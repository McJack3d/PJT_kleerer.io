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
Generate sources.yaml from the built dataset (data.js).

Every scored product that carries a `url` becomes a tracked source, linked back
to its `product_id` (so snapshots inherit its label_hash). This keeps the seed
list in sync with the catalogue automatically: add a product with a URL, rerun
this, and the pipeline tracks it. Hand-added sources (e.g. marketplace URLs the
catalogue doesn't carry) can still be appended to sources.yaml below the marker.

Usage:  python3 gen_sources.py         # rewrites the generated block in place
"""
import os, sys, json
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_JS = os.path.join(HERE, "..", "data.js")
OUT = os.path.join(HERE, "sources.yaml")

# Domains we know render server-side (classic PrestaShop / pharmacy stores) →
# the static fetcher can read them today. Everything else defaults to "js"
# (Shopify/headless DTC), which needs the Phase-1 headless renderer.
STATIC_DOMAINS = {
    "www.nutripure.fr", "www.newpharma.fr", "www.redcare-pharmacie.fr",
    "www.granions.fr", "fr.arkopharma.com", "protealpes.com",
    "www.superphysique-nutrition.fr", "www.laboratoire-lescuyer.com",
    "farma2go.com", "vitavea.com", "www.onatera.com",
}

HEADER = '''# n3gh. — tracked product sources.
# THE GENERATED BLOCK BELOW is produced by gen_sources.py from data.js — do not
# hand-edit it; rerun `python3 gen_sources.py` instead. Add manual sources
# (e.g. marketplace URLs) under the "# --- manual sources ---" marker at the end.
#
# id / product_id: link a source to its scored product (snapshot inherits label_hash)
# url: canonical product page   ·   ean: barcode (enables OpenFoodFacts)
# render: "static" (HTML has the data) or "js" (needs headless renderer, Phase 1)

meta:
  user_agent: "n3gh-bot/0.1 (+https://n3gh.com/bot; supplement price & label transparency; contact: hello@n3gh.com)"
  min_delay_seconds_per_domain: 8
  respect_robots: true
  timeout_seconds: 20

sources:
'''

MANUAL_MARKER = "# --- manual sources (kept across regenerations) ---"


def esc(s):
    if s is None:
        return "null"
    s = str(s).replace('"', "'")
    return f'"{s}"' if any(c in s for c in ": #\t") else s


def main():
    raw = open(DATA_JS, encoding="utf-8").read().split("= ", 1)[1].rstrip().rstrip(";")
    products = json.loads(raw)["products"]
    tracked = [p for p in products if p.get("url")]

    # preserve any manual block from the existing file
    manual = ""
    if os.path.exists(OUT):
        cur = open(OUT, encoding="utf-8").read()
        if MANUAL_MARKER in cur:
            manual = cur.split(MANUAL_MARKER, 1)[1]

    lines = [HEADER]
    for p in sorted(tracked, key=lambda x: (x["category"], x["id"])):
        dom = urlparse(p["url"]).netloc
        render = "static" if dom in STATIC_DOMAINS else "js"
        lines.append(f"  - id: {p['id']}")
        lines.append(f"    product_id: {p['id']}")
        lines.append(f"    brand: {esc(p['brand'])}")
        lines.append(f"    name: {esc(p['name'])}")
        lines.append(f"    category: {p['category']}")
        lines.append(f"    url: {p['url']}")
        lines.append(f"    ean: {esc(p.get('ean'))}")
        lines.append(f"    render: {render}")
        lines.append("")
    lines.append(MANUAL_MARKER)
    lines.append(manual.lstrip("\n") if manual.strip() else
                 "\n  # Append hand-picked sources here (marketplace URLs, extra formats).\n"
                 "  # Example:\n"
                 "  # - id: amazon-myprotein-creatine\n"
                 "  #   product_id: myprotein-creatine\n"
                 "  #   brand: Myprotein\n"
                 "  #   name: Creatine Monohydrate\n"
                 "  #   category: creatine\n"
                 "  #   url: https://www.amazon.fr/dp/XXXXXXXX\n"
                 "  #   ean: null\n"
                 "  #   render: js\n")

    open(OUT, "w", encoding="utf-8").write("\n".join(lines))
    n_static = sum(1 for p in tracked if urlparse(p["url"]).netloc in STATIC_DOMAINS)
    print(f"sources.yaml regenerated: {len(tracked)} tracked "
          f"({n_static} static, {len(tracked)-n_static} js) across "
          f"{len(set(p['category'] for p in tracked))} categories")


if __name__ == "__main__":
    main()
