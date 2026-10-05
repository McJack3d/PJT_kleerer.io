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
Orchestrator: fetch → extract → snapshot → diff → report.

Usage:
  python3 run.py --dry-run            # plan only, no network
  python3 run.py --limit 5           # process first 5 sources
  python3 run.py                     # process all sources
  python3 run.py --no-cache          # force fresh fetch

Writes snapshots/<today>/*.json and reports/<today>.md, then prints a summary.
Designed to be run daily by a GitHub Action; commit the new files and the git
history becomes the versioned archive.
"""
import os, sys, argparse, json, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "scripts"))
import fetch, extract, snapshot, diff, offtake, render
try:
    import autotag
except Exception:
    autotag = None


def fetch_source(s, meta, use_cache=True):
    """Dispatch: js sources go through the headless renderer when available;
    everything else (and every fallback) uses the polite static fetcher."""
    if s.get("render") == "js" and render.available():
        res = render.render(s["url"], meta, use_cache=use_cache)
        if res.ok():
            return res, "headless"
        # fall through to static — Shopify shops often embed JSON-LD server-side
    res = fetch.fetch(s["url"], meta, use_cache=use_cache)
    return res, "static"

REPORTS = os.environ.get("N3GH_REPORTS_DIR", os.path.join(HERE, "reports"))
DATA_JS = os.path.join(HERE, "..", "data.js")


def load_label_hashes():
    """Map product_id -> label_hash from the built data.js. Lets each snapshot
    record the label fingerprint the scoring engine computed, so a later edit to
    the scored label surfaces as a reformulation in the daily diff. When Phase-1
    live label extraction lands, this same field is filled from scraped data."""
    try:
        raw = open(DATA_JS, encoding="utf-8").read().split("= ", 1)[1].rstrip().rstrip(";")
        data = json.loads(raw)
        return {p["id"]: p.get("label_hash") for p in data["products"]}
    except Exception:
        return {}


def load_sources():
    """Minimal YAML reader for our flat sources.yaml (no external deps)."""
    path = os.path.join(HERE, "sources.yaml")
    meta, sources, cur = {}, [], None
    section = None
    with open(path, encoding="utf-8") as f:
        for line in f:
            raw = line.rstrip("\n")
            if not raw.strip() or raw.strip().startswith("#"):
                continue
            if raw.startswith("meta:"):
                section = "meta"; continue
            if raw.startswith("sources:"):
                section = "sources"; continue
            if section == "meta" and raw.startswith("  ") and ":" in raw:
                k, v = raw.strip().split(":", 1)
                meta[k.strip()] = _coerce(v.strip())
            elif section == "sources":
                if raw.lstrip().startswith("- "):
                    cur = {}; sources.append(cur)
                    k, v = raw.lstrip()[2:].split(":", 1)
                    cur[k.strip()] = _coerce(v.strip())
                elif raw.startswith("    ") and ":" in raw and cur is not None:
                    k, v = raw.strip().split(":", 1)
                    cur[k.strip()] = _coerce(v.strip())
    return meta, sources


def _coerce(v):
    v = v.strip().strip('"')
    if v in ("null", "~", ""): return None
    if v == "true": return True
    if v == "false": return False
    try:
        return int(v)
    except ValueError:
        try:
            return float(v)
        except ValueError:
            return v


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--no-cache", action="store_true")
    args = ap.parse_args()

    meta, sources = load_sources()
    label_hashes = load_label_hashes()
    if args.limit:
        sources = sources[:args.limit]

    if args.dry_run:
        print(f"[dry-run] {len(sources)} sources, UA={meta.get('user_agent')}")
        for s in sources:
            print(f"  - {s['id']:38} {s.get('render','static'):7} {s['url']}")
        return

    if any(s.get("render") == "js" for s in sources) and not render.available():
        print("note: playwright not installed — js sources will use the static "
              "fallback (JSON-LD is often server-side anyway). To enable: "
              "pip install playwright && playwright install chromium\n")

    date = snapshot.today()
    written, off_hits = 0, 0
    for s in sources:
        res, engine = fetch_source(s, meta, use_cache=not args.no_cache)
        if not res.ok():
            print(f"  ! {s['id']}: fetch failed ({res.reason or res.status})")
            # still snapshot the failure state (availability unknown)
            snapshot.write_snapshot(s, {"price": None, "source": "fetch-failed",
                                        "availability": None, "name": s.get("name")})
            continue
        ex = extract.extract(res.body, s["url"])
        # live label extraction: scraped ingredients → auto-tagger → observed tags
        live_tags, ingredients = None, ex.get("ingredients_text")
        if not ingredients and s.get("ean"):        # fall back to OpenFoodFacts
            enr = offtake.enrich_by_ean(s["ean"], fetch.fetch, meta)
            if enr and enr.get("found"):
                off_hits += 1
                ingredients = enr.get("ingredients_text") or ingredients
                ex["ingredients_text"] = ingredients
                live_tags = enr.get("derived_purity_tags")
        if ingredients and live_tags is None and autotag:
            live_tags = [t for t in (autotag.classify_additive(x)
                         for x in extract.ingredient_items(ingredients)) if t]
        live_lh = snapshot.observed_label_hash(ingredients, live_tags)
        lh = label_hashes.get(s.get("product_id"))
        snapshot.write_snapshot(s, ex, label_hash=lh,
                                live_label_hash=live_lh, live_purity_tags=live_tags)
        written += 1
        tag = "cache" if res.from_cache else engine
        lbl = "＋label" if ingredients else ""
        print(f"  ✓ {s['id']:38} {ex.get('price')} {ex.get('currency') or ''} [{ex.get('source')}, {tag}] {lbl}")

    render.close()

    # diff against previous day
    days = snapshot.list_days()
    changes = []
    if len(days) >= 2:
        prev, curr = snapshot.load_day(days[-2]), snapshot.load_day(days[-1])
        changes = diff.diff_days(prev, curr)
    os.makedirs(REPORTS, exist_ok=True)
    report = diff.render_report(date, changes, len(sources))
    with open(os.path.join(REPORTS, f"{date}.md"), "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\nsnapshots written: {written}/{len(sources)} · OFF enrichments: {off_hits} · "
          f"changes vs prev day: {len(changes)}")
    print(f"report → reports/{date}.md")


if __name__ == "__main__":
    main()
