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
Dated, content-hashed snapshots — the archive layer.

Each run writes one JSON file per product under snapshots/YYYY-MM-DD/<id>.json:

  {
    "id", "date", "url", "fetched_at",
    "price", "currency", "availability",
    "content_hash",        # sha1 of the observed facts (price+availability+name)
    "label_hash",          # optional: from the scoring engine, detects reformulation
    "extract_source",      # json-ld | meta | text-fallback
    "raw"                  # the extracted dict
  }

Snapshots are immutable: we never overwrite a past day. Committing snapshots/ to
git turns the repository history into a versioned price+label time-series. When
the dataset outgrows git, the same files move to object storage unchanged.
"""
import os, json, hashlib, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
# The archive location. By default a local folder (dev runs); in production the
# daily workflow points this at a checkout of the PRIVATE n3gh-data repo so
# the accumulating history never lands in the public repository.
SNAP_ROOT = os.environ.get("N3GH_SNAPSHOT_DIR", os.path.join(HERE, "snapshots"))


def today():
    return datetime.date.today().isoformat()


def content_hash(rec):
    basis = {"price": rec.get("price"), "currency": rec.get("currency"),
             "availability": rec.get("availability"), "name": rec.get("name")}
    return hashlib.sha1(json.dumps(basis, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:12]


def observed_label_hash(ingredients_text, purity_tags):
    """Fingerprint of the LIVE-observed label (scraped ingredients), distinct
    from the curated label_hash. When two consecutive days both have this, the
    pipeline can flag a real, observed reformulation."""
    if not ingredients_text:
        return None
    basis = {"ingredients": ingredients_text.lower().strip(),
             "tags": sorted(purity_tags or [])}
    return hashlib.sha1(json.dumps(basis, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:12]


def write_snapshot(source, extracted, label_hash=None, live_label_hash=None,
                   live_purity_tags=None, date=None):
    date = date or today()
    day_dir = os.path.join(SNAP_ROOT, date)
    os.makedirs(day_dir, exist_ok=True)
    rec = {
        "id": source["id"],
        "date": date,
        "url": source["url"],
        "fetched_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "price": extracted.get("price"),
        "currency": extracted.get("currency"),
        "availability": extracted.get("availability"),
        "extract_source": extracted.get("source"),
        "label_hash": label_hash,
        "live_label_hash": live_label_hash,
        "live_purity_tags": live_purity_tags,
        "ingredients_text": extracted.get("ingredients_text"),
        "raw": extracted,
    }
    rec["content_hash"] = content_hash(extracted)
    path = os.path.join(day_dir, source["id"] + ".json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(rec, f, ensure_ascii=False, indent=1)
    return path


def list_days():
    if not os.path.isdir(SNAP_ROOT):
        return []
    return sorted(d for d in os.listdir(SNAP_ROOT)
                  if os.path.isdir(os.path.join(SNAP_ROOT, d)))


def load_day(date):
    day_dir = os.path.join(SNAP_ROOT, date)
    out = {}
    if not os.path.isdir(day_dir):
        return out
    for fn in os.listdir(day_dir):
        if fn.endswith(".json"):
            with open(os.path.join(day_dir, fn), encoding="utf-8") as f:
                rec = json.load(f)
                out[rec["id"]] = rec
    return out
