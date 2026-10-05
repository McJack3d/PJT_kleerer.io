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
Offline test suite for the n3gh. pipeline. No network.
Run: python3 -m pytest tests/ -q     (or: python3 tests/test_pipeline.py)
"""
import os, sys, json

HERE = os.path.dirname(os.path.abspath(__file__))
PIPE = os.path.dirname(HERE)
sys.path.insert(0, PIPE)
sys.path.insert(0, os.path.join(PIPE, "..", "scripts"))

import extract, snapshot, diff
import autotag
FIX = os.path.join(HERE, "fixtures")


def _read(name):
    with open(os.path.join(FIX, name), encoding="utf-8") as f:
        return f.read()


# ----------------------------- extraction ---------------------------------- #
def test_extract_jsonld():
    e = extract.extract(_read("jsonld_product.html"), "http://x")
    assert e["price"] == 14.90
    assert e["currency"] == "EUR"
    assert e["brand"] == "Nutripure"
    assert e["gtin"] == "3770011503087"
    assert e["availability"] == "InStock"
    assert e["source"] == "json-ld"


def test_extract_meta_french_comma():
    e = extract.extract(_read("meta_product.html"), "http://x")
    assert e["price"] == 11.90          # "11,90" parsed correctly
    assert e["currency"] == "EUR"
    assert e["source"] == "meta"


def test_extract_text_fallback():
    e = extract.extract(_read("text_only.html"), "http://x")
    assert e["price"] == 29.95
    assert e["source"] == "text-fallback"


def test_price_thousands_format():
    assert extract._to_float("1.299,00") == 1299.00
    assert extract._to_float("29.90") == 29.90
    assert extract._to_float("29,90") == 29.90


def test_extract_ingredients_and_live_tags():
    e = extract.extract(_read("ingredients_product.html"), "http://x")
    assert e["price"] == 27.99
    ing = e.get("ingredients_text")
    assert ing and "collagène marin" in ing.lower()
    items = extract.ingredient_items(ing)
    tags = [t for t in (autotag.classify_additive(x) for x in items) if t]
    # must catch both artificial sweeteners in the scraped label (v1.2 tiers)
    assert "sweetener_d" in tags and "sweetener_c" in tags
    lh = snapshot.observed_label_hash(ing, tags)
    assert lh and len(lh) == 12


def test_observed_reformulation_detected():
    prev = {"x": {"id": "x", "price": 27.99, "currency": "EUR",
                  "availability": "InStock", "label_hash": "same",
                  "live_label_hash": "live-aaa"}}
    curr = {"x": {"id": "x", "price": 27.99, "currency": "EUR",
                  "availability": "InStock", "label_hash": "same",
                  "live_label_hash": "live-bbb"}}   # ingredients changed on the page
    ch = diff.diff_days(prev, curr)
    assert any(c["kind"] == "reformulation" and "observed" in c["detail"] for c in ch)


# ----------------------------- auto-tagger --------------------------------- #
def test_autotag_penalties_v12():
    # sweeteners are tiered by evidence of harm
    assert autotag.classify_additive("édulcorant : sucralose") == "sweetener_d"
    assert autotag.classify_additive("acésulfame K") == "sweetener_c"
    assert autotag.classify_additive("aspartame") == "sweetener_c"
    assert autotag.classify_additive("saccharine") == "sweetener_b"
    assert autotag.classify_additive("sirop de glucose") == "added_sugar"
    assert autotag.classify_additive("maltitol") == "polyol"
    assert autotag.classify_additive("colorant azoïque : E110") == "artificial_colour"
    assert autotag.classify_additive("stéarate de magnésium") == "anticaking"
    assert autotag.classify_additive("lécithine de tournesol") == "lecithin"
    assert autotag.classify_additive("Botanical blend without individual doses") == "proprietary_blend"


def test_autotag_natural_sweeteners_neutral():
    for s in ["extrait de stevia", "glycosides de stéviol", "monk fruit extract"]:
        assert autotag.classify_additive(s) is None, s


def test_autotag_red_card_substances():
    assert autotag.classify_additive("dioxyde de titane (E171)") == "banned:titanium_dioxide"
    assert autotag.classify_additive("huile partiellement hydrogénée") == "banned:trans_fat"
    assert autotag.classify_additive("erythrosine E127") == "banned:red_3_erythrosine"
    # ...but the REPLACEMENT / "free of" must NOT trip the red card
    assert autotag.classify_additive("Calcium carbonate (whitener — E171 replacement)") != "banned:titanium_dioxide"
    assert autotag.classify_additive("titanium dioxide free") != "banned:titanium_dioxide"
    # fully hydrogenated (saturated) is a heavy penalty, NOT a red card
    assert autotag.classify_additive("fully hydrogenated rapeseed fat") == "hydrogenated_fat"


def test_autotag_neutrals():
    for neutral in ["huile de colza vierge bio", "gélule végétale (HPMC)",
                    "arôme naturel de vanille", "extrait riche en tocophérols",
                    "glycérine", "acide citrique", "Organic olive oil (antioxidant, neutral)"]:
        assert autotag.classify_additive(neutral) is None, neutral


def test_autotag_unknown_flags_review():
    # unrecognised → "unknown" (surfaced for human review), never silently dropped
    assert autotag.classify_additive("zorblax 3000") == "unknown"
    tags, detail, banned, review = autotag.tags_from_additives(
        ["sucralose", "dioxyde de titane E171", "zorblax 3000", "huile d'olive"])
    assert "sweetener_d" in tags and "banned" in tags and "unknown" in tags
    assert banned == ["titanium_dioxide"]
    assert review == ["zorblax 3000"]


def test_form_tiers():
    assert autotag.infer_form_tier("magnesium", "oxyde de magnésium marin")[0] == 4
    assert autotag.infer_form_tier("magnesium", "bisglycinate chélaté")[0] == 20
    assert autotag.infer_form_tier("magnesium", "oxyde microencapsulé Magshape")[0] == 10
    assert autotag.infer_form_tier("omega3", "rTG concentré EPAX")[0] == 20
    assert autotag.infer_form_tier("omega3", "ethyl ester concentrate")[0] == 10
    assert autotag.infer_form_tier("zinc", "picolinate de zinc")[0] == 20
    assert autotag.infer_form_tier("zinc", "oxyde de zinc")[0] == 4
    assert autotag.infer_form_tier("collagen", "tripeptides marins")[0] == 20


def test_dose_tiers():
    assert autotag.infer_dose_tier("zinc", {"active_per_unit": 30, "units_per_day": 1})[0] == 12  # >UL
    assert autotag.infer_dose_tier("zinc", {"active_per_unit": 15, "units_per_day": 1})[0] == 20
    assert autotag.infer_dose_tier("melatonin", {"active_per_unit": 1.9, "units_per_day": 1})[0] == 20
    assert autotag.infer_dose_tier("collagen", {"collagen_g_day": 10})[0] == 20
    assert autotag.infer_dose_tier("collagen", {"collagen_g_day": 0.3})[0] == 8


# ----------------------------- snapshot + diff ----------------------------- #
def test_content_hash_stable_and_sensitive():
    a = {"price": 19.90, "currency": "EUR", "availability": "InStock", "name": "X"}
    b = dict(a)
    assert snapshot.content_hash(a) == snapshot.content_hash(b)
    b["price"] = 21.90
    assert snapshot.content_hash(a) != snapshot.content_hash(b)


def test_diff_detects_changes():
    prev = {
        "p1": {"id": "p1", "price": 19.90, "currency": "EUR", "availability": "InStock", "label_hash": "aaa"},
        "p2": {"id": "p2", "price": 10.00, "currency": "EUR", "availability": "InStock", "label_hash": "bbb"},
        "gone": {"id": "gone", "price": 5.0, "currency": "EUR", "availability": "InStock", "label_hash": "ccc"},
    }
    curr = {
        "p1": {"id": "p1", "price": 24.90, "currency": "EUR", "availability": "InStock", "label_hash": "aaa"},  # price up
        "p2": {"id": "p2", "price": 10.00, "currency": "EUR", "availability": "OutOfStock", "label_hash": "zzz"},  # avail + reformulation
        "new": {"id": "new", "price": 9.0, "currency": "EUR", "availability": "InStock", "label_hash": "ddd"},   # new
    }
    kinds = sorted(c["kind"] for c in diff.diff_days(prev, curr))
    assert kinds == sorted(["price", "availability", "reformulation", "disappeared", "new"])
    price = [c for c in diff.diff_days(prev, curr) if c["kind"] == "price"][0]
    assert price["pct"] == 25.1  # (24.90-19.90)/19.90*100


def test_report_renders():
    r = diff.render_report("2026-07-11", [{"id": "x", "kind": "price", "detail": "a→b"}], 8)
    assert "change report" in r and "price (1)" in r


# ----------------------------- renderer dispatch --------------------------- #
def test_render_graceful_without_playwright():
    import render
    # whether or not playwright is installed, the API must never raise here
    assert isinstance(render.available(), bool)
    if not render.available():
        r = render.render("https://example.com/x", {"respect_robots": False}, use_cache=False)
        assert not r.ok() and "playwright" in (r.reason or "").lower()


def test_fetch_source_dispatch_falls_back():
    import run
    # js source with no playwright → must dispatch to static path without raising
    called = {}
    import fetch as f
    orig = f.fetch
    def fake_fetch(url, meta, use_cache=True, **kw):
        called["url"] = url
        return f.FetchResult(url, 200, "<html></html>")
    f.fetch = fake_fetch
    try:
        src = {"id": "x", "url": "https://example.com/p", "render": "js"}
        res, engine = run.fetch_source(src, {"respect_robots": False})
        assert res.ok()
        import render
        assert engine in ("static", "headless")
        if not render.available():
            assert engine == "static" and called["url"] == src["url"]
    finally:
        f.fetch = orig


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    passed = 0
    for fn in fns:
        fn(); passed += 1
        print(f"  ok  {fn.__name__}")
    print(f"\n{passed}/{len(fns)} tests passed")
