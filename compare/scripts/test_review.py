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
Tests for the §5.2 review gate.

The rule under test — "a product flagged for review is never displayed on the
site before manual review" — is the kind that fails silently and invisibly: the
symptom of a broken gate is a product appearing that should not have, which
nobody notices because the site looks fine. So it is tested directly, and the
withholding path is tested as carefully as the release path.

    python3 scripts/test_review.py
"""
import json, os, sys, tempfile, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import review


# --------------------------------------------------------------------------- #
#  harness: point review.py at a throwaway ledger so the real one is untouched
# --------------------------------------------------------------------------- #
class TempLedger:
    def __enter__(self):
        self.dir = tempfile.mkdtemp(prefix="n3gh-review-test-")
        self._ledger, self._queue = review.LEDGER, review.QUEUE
        review.LEDGER = os.path.join(self.dir, "review-ledger.json")
        review.QUEUE = os.path.join(self.dir, "review-queue.json")
        return self

    def __exit__(self, *exc):
        review.LEDGER, review.QUEUE = self._ledger, self._queue
        shutil.rmtree(self.dir, ignore_errors=True)


def test_unruled_string_is_pending_not_penalised():
    with TempLedger():
        tags, banned, pending = review.resolve(["mystery powder"])
        assert pending == ["mystery powder"], pending
        assert tags == [], tags
        assert banned == [], banned


def test_neutral_ruling_clears_without_penalty():
    with TempLedger():
        review.decide("arômes", "neutral", "flavouring, no dose declared")
        tags, banned, pending = review.resolve(["arômes"])
        assert pending == [], pending
        assert tags == [], tags


def test_penalty_ruling_scores_as_that_tag():
    with TempLedger():
        review.decide("émulsifiant E471", "penalty:lecithin", "mono/diglycerides")
        tags, banned, pending = review.resolve(["émulsifiant E471"])
        assert pending == [], pending
        assert tags == ["lecithin"], tags


def test_banned_ruling_red_cards():
    with TempLedger():
        review.decide("kava extract", "banned:kava", "withdrawn, hepatotoxicity")
        tags, banned, pending = review.resolve(["kava extract"])
        assert pending == [], pending
        assert banned == ["kava"], banned
        assert "banned" in tags, tags


def test_ruling_keys_on_normalised_string():
    """A curly apostrophe is what shops actually publish. A ruling made on one
    spelling must clear the other, or the queue fills with the same substance
    under three encodings."""
    with TempLedger():
        review.decide("correcteur d'acidité", "neutral")          # straight quote
        _, _, pending = review.resolve(["Correcteur d’acidité"])  # curly + caps
        assert pending == [], pending


def test_one_ruling_clears_every_product_carrying_it():
    with TempLedger():
        review.decide("arômes", "neutral")
        for _ in range(7):
            _, _, pending = review.resolve(["arômes"])
            assert pending == []


def test_partial_ruling_still_withholds():
    """The failure this guards: ruling on one of a product's two unknowns and
    assuming the product is cleared."""
    with TempLedger():
        review.decide("arômes", "neutral")
        _, _, pending = review.resolve(["arômes", "support comprimé standard"])
        assert pending == ["support comprimé standard"], pending


def test_correction_preserves_the_previous_ruling():
    with TempLedger():
        review.decide("e471", "neutral", "thought it was inert")
        review.decide("e471", "penalty:lecithin", "corrected: it is an emulsifier")
        entry = review.load()["decisions"][review.key_for("e471")]
        assert entry["verdict"] == "penalty:lecithin"
        assert len(entry["superseded"]) == 1, entry
        assert entry["superseded"][0]["verdict"] == "neutral"


def test_invalid_penalty_tag_is_refused():
    """A typo'd tag must not silently score as nothing."""
    with TempLedger():
        try:
            review.decide("something", "penalty:not_a_real_tag")
        except SystemExit:
            return
        raise AssertionError("accepted a penalty tag that does not exist")


def test_queue_counts_what_each_string_blocks():
    with TempLedger():
        q = review.write_queue([
            {"id": "a", "brand": "A", "name": "x", "category": "whey",
             "pending": ["arômes"]},
            {"id": "b", "brand": "B", "name": "y", "category": "zinc",
             "pending": ["arômes", "talc mystère"]},
        ])
        assert q["n_withheld_products"] == 2, q
        assert q["n_pending_strings"] == 2, q
        top = q["pending_strings"][0]
        assert top["string"] == "arômes" and top["blocks_n_products"] == 2, top


def test_queue_round_trips():
    with TempLedger():
        review.write_queue([{"id": "a", "brand": "A", "name": "x",
                             "category": "whey", "pending": ["arômes"]}])
        loaded = review.load_queue()
        assert loaded["n_withheld_products"] == 1, loaded


def test_empty_flags_are_not_a_review():
    with TempLedger():
        for empty in ([], None):
            tags, banned, pending = review.resolve(empty)
            assert (tags, banned, pending) == ([], [], [])


def main():
    tests = [(n, f) for n, f in sorted(globals().items())
             if n.startswith("test_") and callable(f)]
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"  ok  {name}")
        except Exception as e:                          # noqa: BLE001
            failed += 1
            print(f"  FAIL {name}: {type(e).__name__}: {e}")
    print(f"\n{len(tests) - failed}/{len(tests)} tests passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
