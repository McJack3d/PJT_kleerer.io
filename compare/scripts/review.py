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
n3gh. — unrecognised-ingredient review ledger.

THE RULE THIS ENFORCES (guidelines §5.2):

    A product flagged for review is NEVER displayed on the site before manual
    review.

Before this module, an ingredient string the auto-tagger could not classify
produced an "unknown" tag worth a provisional -2 purity penalty, and the product
was published anyway with the unknown surfaced on its card. That is a guess
presented as a score. An unrecognised string is not a small penalty — it is an
absence of knowledge, and it could equally be an inert bulking agent or a
substance that should red-card the product to grade E. Publishing a B-grade for
something we cannot read is the one failure mode the whole method exists to
avoid.

So: unrecognised -> WITHHELD, not penalised. The product leaves the site until a
human has ruled on the string.

HOW A STRING GETS CLEARED

Every decision is recorded here, against the normalised ingredient string, with
who decided it and when. A decision is one of:

    neutral            benign; scores nothing, penalises nothing
    penalty:<tag>      a known additive class; scores as that tag would
    banned:<name>      red card; forces the product to 0 / grade E

Because decisions key on the normalised string, ruling on "aromes" once clears
every product carrying it. The ledger is append-only in spirit: correcting a
decision rewrites the entry but keeps the previous one in `superseded`, so the
audit trail of what was believed when survives. That trail is also evidence of
the "verifying" investment the database right depends on (§9).

USAGE

    python3 scripts/review.py --list                 # what is pending, and what it blocks
    python3 scripts/review.py --decide "aromes" --as neutral --note "flavouring, no dose"
    python3 scripts/review.py --decide "e471" --as penalty:lecithin
    python3 scripts/review.py --decide "kava" --as banned:kava_extract
    python3 scripts/review.py --suggest-rules        # decisions ripe for promotion into autotag.py
"""
import json, os, sys, datetime, argparse, collections

import autotag

HERE = os.path.dirname(os.path.abspath(__file__))
LEDGER = os.path.join(HERE, "..", "data", "review-ledger.json")
QUEUE = os.path.join(HERE, "..", "data", "review-queue.json")

VALID_PREFIXES = ("neutral", "penalty:", "banned:")


# --------------------------------------------------------------------------- #
#  Ledger I/O
# --------------------------------------------------------------------------- #
# Typographic characters shops actually publish, folded to ASCII BEFORE the
# tagger's normaliser sees them.
#
# This is not belt-and-braces. Some versions of autotag._norm run
# encode("ascii", "ignore"), which DELETES what it cannot map rather than
# folding it: "correcteur d’acidité" (curly U+2019) becomes "correcteur
# dacidite" while "correcteur d'acidité" (straight) becomes "correcteur
# d'acidite". Two keys, one substance — so a ruling made on the string as typed
# would not clear the string as scraped, and the queue would slowly fill with
# the same ingredient under three encodings. Folding here makes the ledger key
# stable no matter which normaliser is in the tree.
_TYPOGRAPHY = (("’", "'"), ("‘", "'"), ("ʼ", "'"),
               ("´", "'"), ("`", "'"),
               (" ", " "), (" ", " "), (" ", " "),
               ("–", "-"), ("—", "-"), ("‑", "-"))


def key_for(raw):
    """Normalised ledger key: fold typography, then apply the tagger's own
    normaliser, so a decision keys on the substance rather than on its
    encoding."""
    s = str(raw)
    for bad, good in _TYPOGRAPHY:
        s = s.replace(bad, good)
    return autotag._norm(s)


def load():
    if not os.path.exists(LEDGER):
        return {"version": 1, "decisions": {}}
    with open(LEDGER, encoding="utf-8") as f:
        return json.load(f)


def save(ledger):
    os.makedirs(os.path.dirname(LEDGER), exist_ok=True)
    with open(LEDGER, "w", encoding="utf-8") as f:
        json.dump(ledger, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")


def decide(raw, verdict, note="", who="Alexandre Bredillot"):
    if not verdict.startswith(VALID_PREFIXES):
        sys.exit(f"invalid verdict {verdict!r} — expected neutral | penalty:<tag> | banned:<name>")
    if verdict.startswith("penalty:"):
        tag = verdict.split(":", 1)[1]
        import build_scores
        if tag not in build_scores.PURITY_PENALTIES:
            sys.exit(f"unknown penalty tag {tag!r} — must exist in build_scores.PURITY_PENALTIES")

    ledger = load()
    k = key_for(raw)
    prior = ledger["decisions"].get(k)
    entry = {
        "seen_as": raw,
        "verdict": verdict,
        "note": note,
        "reviewed_by": who,
        "reviewed_on": datetime.date.today().isoformat(),
    }
    if prior:
        # keep the old ruling; what we believed and when is part of the evidence
        entry["superseded"] = prior.get("superseded", []) + [
            {k2: v2 for k2, v2 in prior.items() if k2 != "superseded"}
        ]
    ledger["decisions"][k] = entry
    save(ledger)
    return entry


# --------------------------------------------------------------------------- #
#  The gate itself — used by build_scores.py
# --------------------------------------------------------------------------- #
def resolve(review_flags, ledger=None):
    """Apply the ledger to a product's unrecognised strings.

    Returns (resolved_tags, banned_names, pending).
      resolved_tags  penalty tags earned by strings that HAVE been ruled on
      banned_names   red-card substances found among ruled-on strings
      pending        strings with no ruling yet -> the product must be withheld

    Note there is no "unknown" tag in the output. A string is either ruled on
    (and scores as whatever it was ruled to be) or pending (and the product does
    not ship). The provisional -2 is gone deliberately: it let an unread label
    masquerade as a nearly-clean one.
    """
    ledger = ledger if ledger is not None else load()
    decisions = ledger["decisions"]
    tags, banned, pending = [], [], []
    for raw in review_flags or []:
        d = decisions.get(key_for(raw))
        if not d:
            pending.append(raw)
            continue
        v = d["verdict"]
        if v == "neutral":
            continue
        if v.startswith("banned:"):
            banned.append(v.split(":", 1)[1])
            tags.append("banned")
        else:
            tags.append(v.split(":", 1)[1])
    return tags, banned, pending


def rulings_for(review_flags, ledger=None):
    """The human rulings behind a product that DOES ship.

    Returns [{string, verdict, note, reviewed_on}] for every once-unrecognised
    string on the product. On the card this is a trust signal rather than a
    warning: a named person read this label and decided, on this date.
    """
    ledger = ledger if ledger is not None else load()
    out = []
    for raw in review_flags or []:
        d = ledger["decisions"].get(key_for(raw))
        if d:
            out.append({"string": raw, "verdict": d["verdict"],
                        "note": d.get("note", ""), "reviewed_on": d.get("reviewed_on")})
    return out


def write_queue(withheld):
    """Persist the work list. `withheld` is a list of dicts:
    {id, brand, name, category, pending:[strings]}"""
    by_string = collections.Counter()
    for w in withheld:
        for s in w["pending"]:
            by_string[s] += 1
    payload = {
        "generated": datetime.date.today().isoformat(),
        "n_withheld_products": len(withheld),
        "n_pending_strings": len(by_string),
        "pending_strings": [
            {"string": s, "blocks_n_products": n} for s, n in by_string.most_common()
        ],
        "withheld_products": sorted(withheld, key=lambda w: w["id"]),
    }
    os.makedirs(os.path.dirname(QUEUE), exist_ok=True)
    with open(QUEUE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
        f.write("\n")
    return payload


def load_queue():
    if not os.path.exists(QUEUE):
        return None
    with open(QUEUE, encoding="utf-8") as f:
        return json.load(f)


# --------------------------------------------------------------------------- #
#  CLI
# --------------------------------------------------------------------------- #
def cmd_list():
    q = load_queue()
    if not q:
        print("no review queue yet — run scripts/build_scores.py first")
        return 0
    if not q["pending_strings"]:
        print(f"✅ nothing pending ({q['generated']}) — every product is cleared to publish")
        return 0

    print(f"REVIEW QUEUE — {q['generated']}")
    print(f"{q['n_pending_strings']} unrecognised string(s) withholding "
          f"{q['n_withheld_products']} product(s) from the site\n")
    print("  blocks  ingredient string")
    print("  ------  ---------------------------------------------------------")
    for row in q["pending_strings"]:
        print(f"  {row['blocks_n_products']:>6}  {row['string']}")
    print("\nwithheld products:")
    for w in q["withheld_products"]:
        print(f"  [{w['category']}] {w['brand']} — {w['name']}")
        print(f"      {', '.join(w['pending'])}")
    print("\nrule one string, clear every product carrying it:")
    print('  python3 scripts/review.py --decide "<string>" --as neutral --note "why"')
    return 1


def cmd_suggest_rules():
    """Decisions repeated often enough that they belong in autotag.py itself.
    The ledger clears products; the tagger is where knowledge should end up."""
    ledger = load()
    q = load_queue() or {"pending_strings": []}
    by_verdict = collections.defaultdict(list)
    for k, d in sorted(ledger["decisions"].items()):
        by_verdict[d["verdict"]].append(k)
    if not by_verdict:
        print("no decisions recorded yet")
        return 0
    print("Decisions on record, grouped by verdict. Anything here that is a")
    print("general rule rather than a one-off belongs in autotag.py, so future")
    print("products never enter the queue for it in the first place.\n")
    for verdict in sorted(by_verdict):
        print(f"{verdict}:")
        for k in by_verdict[verdict]:
            print(f"    \"{k}\",")
        print()
    return 0


def main():
    ap = argparse.ArgumentParser(description="n3gh unrecognised-ingredient review ledger")
    ap.add_argument("--list", action="store_true", help="show what is pending and what it blocks")
    ap.add_argument("--decide", metavar="STRING", help="ingredient string to rule on")
    ap.add_argument("--as", dest="verdict", metavar="VERDICT",
                    help="neutral | penalty:<tag> | banned:<name>")
    ap.add_argument("--note", default="", help="why — recorded in the ledger")
    ap.add_argument("--by", default="Alexandre Bredillot", help="who reviewed it")
    ap.add_argument("--suggest-rules", action="store_true",
                    help="decisions ripe for promotion into autotag.py")
    a = ap.parse_args()

    if a.suggest_rules:
        return cmd_suggest_rules()
    if a.decide:
        if not a.verdict:
            sys.exit("--decide needs --as neutral | penalty:<tag> | banned:<name>")
        e = decide(a.decide, a.verdict, a.note, a.by)
        print(f"recorded: {key_for(a.decide)!r} -> {e['verdict']}")
        print("re-run scripts/build_scores.py to release anything this unblocks")
        return 0
    return cmd_list()


if __name__ == "__main__":
    sys.exit(main())
