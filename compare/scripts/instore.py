#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 n3gh.
#
# This file is part of the n3gh scoring engine and collection pipeline.
# Licensed under the GNU Affero General Public License v3.0 ONLY; see LICENSE.
# A separate commercial licence is available for parties who cannot accept the
# AGPL's obligations: hello@n3gh.com. The commercial licence covers this code
# only -- it conveys NO right in the collected archive, which is unpublished and
# all rights reserved. See NOTICE.md.

"""
n3gh. — brick-and-mortar product entry (guidelines §5.1, item 3).

    "Brick-and-mortar-only products — these must be ranked too, even without
     an online listing."

A large part of the French supplement market never appears online: pharmacy
counter brands, Biocoop and Naturalia shelf lines, supermarket own-brands with
no e-commerce SKU. A comparator that silently covers only what is crawlable is
not comparing the market, it is comparing the internet — and it flatters exactly
the DTC brands that are easiest to scrape.

So these products enter by hand, and are then scored on **exactly the same code
path** as everything else. Nothing here relaxes the method: same auto-tagger,
same red-card registry, same review gate. The only difference is where the price
came from, and that difference is recorded rather than hidden.

WHAT IS DIFFERENT, AND WHY IT IS RECORDED

  price_provenance   {store, city, observed_on, method}
                     A shelf price is a single observation at one shop on one
                     day, not a national price. Saying so is the difference
                     between a fact and an implication.
  url = null         no listing to link to. The card shows the observation
                     instead of a buy button.
  confidence         defaults to "medium" — a photographed label read once is
                     genuinely weaker evidence than a page we re-read daily.

STALENESS IS THE REAL RISK. An online price is re-observed every day; a shelf
price is frozen the moment it is typed. `--stale` lists what needs re-visiting,
and the site should never present a year-old shelf price as current.

USAGE
    python3 scripts/instore.py --new              # guided entry
    python3 scripts/instore.py --list             # everything recorded
    python3 scripts/instore.py --stale 90         # observations older than N days
"""
import json, os, sys, glob, datetime, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(HERE, "..", "data", "instore")

CATEGORIES = ["whey", "creatine", "vitamin_d3", "magnesium", "omega3",
              "multivitamin", "zinc", "vitamin_c", "collagen", "probiotics",
              "melatonin"]
STALE_DEFAULT_DAYS = 90


def _slugify(s):
    keep = "".join(c.lower() if c.isalnum() else "-" for c in s)
    while "--" in keep:
        keep = keep.replace("--", "-")
    return keep.strip("-")


def load_all():
    out = []
    for path in sorted(glob.glob(os.path.join(DIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            for e in json.load(f):
                e["_file"] = os.path.basename(path)
                out.append(e)
    return out


def _ask(prompt, default=None, cast=str, choices=None):
    while True:
        suffix = f" [{default}]" if default is not None else ""
        raw = input(f"  {prompt}{suffix}: ").strip()
        if not raw and default is not None:
            return default
        if not raw:
            print("    required")
            continue
        if choices and raw not in choices:
            print(f"    one of: {', '.join(choices)}")
            continue
        try:
            return cast(raw)
        except ValueError:
            print(f"    expected {cast.__name__}")


def cmd_new():
    print("Record a brick-and-mortar product.\n"
          "Everything here is scored identically to an online product — the only\n"
          "difference is that the price is one shop, one day, and says so.\n")
    brand = _ask("brand")
    name = _ask("product name")
    category = _ask("category", choices=CATEGORIES)
    price = _ask("price paid (EUR)", cast=float)

    print("\n  where and when observed:")
    store = _ask("store (e.g. Pharmacie Lafayette)")
    city = _ask("city")
    observed = _ask("observed on (YYYY-MM-DD)", default=datetime.date.today().isoformat())

    print("\n  label, exactly as printed — this is what gets scored:")
    form = _ask("form description (e.g. 'magnesium bisglycinate')")
    additives_raw = input("  additives, comma-separated (blank if none declared): ").strip()
    additives = [a.strip() for a in additives_raw.split(",") if a.strip()]

    entry = {
        "id": _slugify(f"{brand}-{name}"),
        "brand": brand,
        "name": name,
        "category": category,
        "price_eur": price,
        "url": None,
        "confidence": "medium",
        "form": form,
        "additives": additives,
        "price_provenance": {
            "store": store,
            "city": city,
            "observed_on": observed,
            "method": "in_store_observation",
        },
    }

    print("\n  dosing — needed for the €/standard-dose comparison:")
    print("  (leave blank to write the record now and complete it by hand later)")
    upu = input("  active per unit (mg/IU/g): ").strip()
    if upu:
        entry["active_per_unit"] = float(upu)
        entry["units_per_day"] = float(_ask("units per day", default="1", cast=float))
        entry["units_pack"] = float(_ask("units per pack", cast=float))

    fname = os.path.join(DIR, f"{_slugify(store)}.json")
    os.makedirs(DIR, exist_ok=True)
    existing = []
    if os.path.exists(fname):
        with open(fname, encoding="utf-8") as f:
            existing = json.load(f)
    if any(e.get("id") == entry["id"] for e in existing):
        print(f"\n! {entry['id']} already recorded in {os.path.basename(fname)} — edit it by hand")
        return 1
    existing.append(entry)
    with open(fname, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=1)
        f.write("\n")

    print(f"\n✓ written to data/instore/{os.path.basename(fname)}")
    if "active_per_unit" not in entry:
        print("  ! dosing incomplete — build_scores.py will reject it until you add")
        print("    active_per_unit / units_per_day / units_pack by hand")
    print("  next: python3 scripts/build_scores.py")
    return 0


def cmd_list():
    items = load_all()
    if not items:
        print("no in-store products recorded yet")
        print(f"  add one: python3 scripts/instore.py --new")
        return 0
    print(f"{len(items)} in-store product(s)\n")
    for e in items:
        pv = e.get("price_provenance") or {}
        print(f"  [{e.get('category','?')}] {e.get('brand')} — {e.get('name')}")
        print(f"      {e.get('price_eur')} EUR · {pv.get('store','?')}, {pv.get('city','?')}"
              f" · observed {pv.get('observed_on','?')}  ({e['_file']})")
    return 0


def cmd_stale(days):
    items = load_all()
    today = datetime.date.today()
    stale = []
    for e in items:
        obs = (e.get("price_provenance") or {}).get("observed_on")
        if not obs:
            stale.append((e, None))
            continue
        try:
            age = (today - datetime.date.fromisoformat(obs)).days
        except ValueError:
            stale.append((e, None))
            continue
        if age >= days:
            stale.append((e, age))
    if not stale:
        print(f"✅ no in-store observation older than {days} days")
        return 0
    print(f"{len(stale)} observation(s) need re-visiting (≥ {days} days old)\n")
    for e, age in sorted(stale, key=lambda t: -(t[1] or 10**6)):
        pv = e.get("price_provenance") or {}
        label = f"{age}d" if age is not None else "no date"
        print(f"  {label:>8}  {e.get('brand')} — {e.get('name')}  @ {pv.get('store','?')}")
    print("\nA shelf price is frozen the day it is typed. Re-observe or withdraw:")
    print("stale data presented as current is the same failure as an unread label.")
    return 1


def main():
    ap = argparse.ArgumentParser(description="n3gh brick-and-mortar product entry (§5.1)")
    ap.add_argument("--new", action="store_true", help="guided entry for one product")
    ap.add_argument("--list", action="store_true", help="list everything recorded")
    ap.add_argument("--stale", nargs="?", type=int, const=STALE_DEFAULT_DAYS,
                    metavar="DAYS", help=f"observations older than DAYS (default {STALE_DEFAULT_DAYS})")
    a = ap.parse_args()

    if a.new:
        return cmd_new()
    if a.stale is not None:
        return cmd_stale(a.stale)
    return cmd_list()


if __name__ == "__main__":
    sys.exit(main())
