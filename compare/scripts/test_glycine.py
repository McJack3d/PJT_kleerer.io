"""Glycine uses free-active grams and cannot bypass the ingredient review gate."""
import contextlib
import copy
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import autotag
import build_scores
import review


class GlycineTests(unittest.TestCase):
    def setUp(self):
        self.powder = {
            "category": "glycine", "brand": "Example", "name": "Glycine",
            "variant": "300 g", "format": "powder", "form": "Glycine libre",
            "pack_g": 300, "serving_g": 5, "active_per_100g": 100,
            "active_per_serving_g": 5, "price_eur": 15, "additives": [],
            "full_label": True,
        }
        self.capsules = {
            "category": "glycine", "brand": "Example", "name": "Glycine",
            "variant": "120 capsules", "format": "capsules", "form": "Free glycine",
            "units_pack": 120, "units_per_day": 2, "active_per_unit": 0.5,
            "price_eur": 3, "additives": ["capsule HPMC"], "full_label": True,
        }

    def test_equal_active_cost_compares_equally_across_formats(self):
        # Both packs cost €0.05 per gram, despite different serving suggestions.
        powder = build_scores.value_metrics(build_scores.normalize(self.powder))
        capsules = build_scores.value_metrics(build_scores.normalize(self.capsules))
        self.assertEqual(powder, (0.25, 0.15, 60, "€ / 3 g glycine"))
        self.assertEqual(capsules, (0.05, 0.15, 60, "€ / 3 g glycine"))

    def test_blend_price_uses_only_declared_free_glycine(self):
        self.powder.update(form="Glycine libre + vitamine C", glycine_blend=True,
                           active_per_100g=50, active_per_serving_g=2.5)
        product = build_scores.normalize(self.powder)
        self.assertEqual(product["form_tier"], 14)
        self.assertEqual(build_scores.value_metrics(product)[1], 0.30)

    def test_l_prefix_and_manufacturing_claims_do_not_earn_a_premium(self):
        for form in ("Glycine", "L-glycine cristallisée", "Free glycine fermentation", "Glycine en gélules"):
            with self.subTest(form=form):
                self.assertEqual(autotag.infer_form_tier("glycine", form)[0], 18)

    def test_other_glycine_compounds_are_not_free_glycine(self):
        for form in ("Trimethylglycine", "Betaine", "Magnesium bisglycinate", "Collagen glycine"):
            with self.subTest(form=form):
                self.assertEqual(autotag.infer_form_tier("glycine", form)[0], 8)

    def test_sodium_salt_label_does_not_claim_a_verified_free_glycine_fraction(self):
        self.powder["form"] = "Glycine cristallisée et son sel de sodium"
        product = build_scores.normalize(self.powder)
        self.assertEqual(product["form_tier"], 8)
        self.assertIn("not separately established", product["form_note"])
        self.assertEqual(product["active_per_serving_g"], 5)
        self.assertEqual(build_scores.value_metrics(product)[1], 0.15)

    def test_calcium_laurate_is_an_anticaking_agent_even_with_a_shell(self):
        for ingredient in ("Calcium Laurate", "laurate de calcium", "capsule HPMC, calcium laurate"):
            with self.subTest(ingredient=ingredient):
                self.assertEqual(autotag.classify_additive(ingredient), "anticaking")

    def test_known_leucine_does_not_neutralise_other_ingredients(self):
        for ingredient in ("L-leucine", "leucine", " Leucine "):
            self.assertIsNone(autotag.classify_additive(ingredient))
        for ingredient in ("L-leucine + unidentified XYZ", "D-leucine", "norleucine"):
            self.assertEqual(autotag.classify_additive(ingredient), "unknown")
        self.assertEqual(autotag.classify_additive("L-leucine + titanium dioxide"), "banned:titanium_dioxide")

    def test_dose_score_has_no_invented_effective_band_or_high_dose_reward(self):
        for grams in (0.5, 3, 5, 10):
            product = copy.deepcopy(self.powder)
            product.update(serving_g=grams, active_per_serving_g=grams)
            normalised = build_scores.normalize(product)
            self.assertEqual(build_scores.dose_score(normalised), 12)
            self.assertIn("no established general target", normalised["dose_note"])
            self.assertIn("not a recommended intake", normalised["dose_note"])

    def test_missing_or_invalid_active_amount_is_not_assumed_pure(self):
        for value in (None, 0, -1, True, float("nan"), float("inf")):
            for sample, field in ((self.powder, "active_per_serving_g"), (self.capsules, "active_per_unit")):
                with self.subTest(field=field, value=value):
                    product = copy.deepcopy(sample)
                    product[field] = value
                    with self.assertRaises(ValueError):
                        build_scores.normalize(product)

    def test_inconsistent_powder_units_are_rejected(self):
        for fields in ({"active_per_100g": 110}, {"active_per_serving_g": 5000},
                       {"active_per_100g": 50}, {"units_pack": 120}):
            with self.subTest(fields=fields):
                product = dict(self.powder, **fields)
                with self.assertRaises(ValueError):
                    build_scores.normalize(product)

    def test_unknown_ingredient_withholds_glycine_before_ranking(self):
        """Exercise the real builder against temporary files, with no alerts."""
        unresolved = dict(self.powder, variant="Unreviewed", additives=["L-leucine", "unidentified excipient XYZ"])
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "fr").mkdir()
            (root / "raw.json").write_text(json.dumps({"snapshot": "2026-10-13", "products": []}))
            (root / "fr" / "glycine.json").write_text(json.dumps([self.powder, unresolved]))
            with (patch.multiple(build_scores, V1=str(root / "raw.json"), FRDIR=str(root / "fr"),
                                 INSTORE=str(root / "instore"), OUT=str(root / "data.js")),
                  patch.multiple(review, LEDGER=str(root / "ledger.json"), QUEUE=str(root / "queue.json")),
                  patch.object(build_scores.verification, "load", return_value=({}, {})),
                  patch.object(build_scores.alert, "cleared"),
                  patch.object(build_scores.alert, "review_needed"),
                  contextlib.redirect_stdout(io.StringIO())):
                build_scores.main()
            payload = json.loads((root / "data.js").read_text().split("const N3GH_DATA = ")[1].rstrip(";\n"))
            self.assertEqual(payload["meta"]["n_products"], 1)
            self.assertEqual(payload["meta"]["n_withheld_for_review"], 1)
            self.assertEqual(payload["products"][0]["variant"], "300 g")
            self.assertEqual(payload["products"][0]["rank_in_category"], 1)


if __name__ == "__main__":
    unittest.main()
