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
OpenFoodFacts adapter — open data enrichment by EAN (barcode).

OpenFoodFacts is an open database (ODbL). Where a tracked product has an EAN, we
pull its ingredient list and nutrition facts from OFF instead of scraping the
merchant — cleaner legally and often more structured. This is the "open data
before scraping" principle in code.

Returns a dict with ingredients_text + parsed additive tags (via the shared
auto-tagger), ready to feed the scoring engine. Network calls go through the
polite fetcher so caching and rate-limiting still apply.

Note: OFF coverage of supplements is partial (its core is food). Missing EANs
just yield None — the pipeline falls back to curated label data.
"""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts"))
try:
    import autotag
except Exception:
    autotag = None

OFF_URL = "https://world.openfoodfacts.org/api/v2/product/{ean}.json?fields=product_name,brands,ingredients_text_fr,ingredients_text,additives_tags,nutriments"


def enrich_by_ean(ean, fetch_fn, meta):
    if not ean:
        return None
    res = fetch_fn(OFF_URL.format(ean=ean), meta)
    if not res.ok():
        return {"ean": ean, "found": False, "reason": res.reason or f"status {res.status}"}
    try:
        data = json.loads(res.body)
    except Exception:
        return {"ean": ean, "found": False, "reason": "bad JSON"}
    if data.get("status") != 1 and "product" not in data:
        return {"ean": ean, "found": False, "reason": "not in OpenFoodFacts"}
    prod = data.get("product", {})
    ingredients = prod.get("ingredients_text_fr") or prod.get("ingredients_text") or ""
    additive_strings = [a.replace("en:", "").replace("fr:", "") for a in prod.get("additives_tags", [])]
    tags = []
    if autotag and ingredients:
        # naive split on comma/semicolon → classify each fragment
        for frag in [s.strip() for s in ingredients.replace(";", ",").split(",") if s.strip()]:
            t = autotag.classify_additive(frag)
            if t:
                tags.append(t)
    return {
        "ean": ean, "found": True,
        "product_name": prod.get("product_name"),
        "brands": prod.get("brands"),
        "ingredients_text": ingredients,
        "off_additives": additive_strings,
        "derived_purity_tags": tags,
        "source": "openfoodfacts",
    }
