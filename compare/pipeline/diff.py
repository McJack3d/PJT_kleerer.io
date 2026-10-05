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
Diff the two most recent snapshot days → the daily change report.

Detects:
  - price moves (with % change and direction)
  - availability changes (in stock <-> out of stock / delisted)
  - reformulations (label_hash changed) — the silent, valuable signal
  - new / disappeared products

This is where the archive earns its keep: a one-off scrape can tell you today's
price; only a versioned series can tell you a whey quietly dropped from 78 g to
72 g protein, or a brand slipped sucralose into a "clean" formula.
"""
import os


def _fmt_price(p, cur):
    return "—" if p is None else f"{p:.2f} {cur or ''}".strip()


def diff_days(prev, curr):
    """prev, curr: dict id->record. Returns a list of change dicts."""
    changes = []
    for pid, c in curr.items():
        p = prev.get(pid)
        if p is None:
            changes.append({"id": pid, "kind": "new", "detail": "first snapshot"})
            continue
        # price
        if p.get("price") is not None and c.get("price") is not None and p["price"] != c["price"]:
            pct = (c["price"] - p["price"]) / p["price"] * 100 if p["price"] else 0
            changes.append({"id": pid, "kind": "price",
                            "detail": f"{_fmt_price(p['price'],p.get('currency'))} → "
                                      f"{_fmt_price(c['price'],c.get('currency'))} ({pct:+.1f}%)",
                            "pct": round(pct, 1)})
        # availability
        if p.get("availability") != c.get("availability") and (p.get("availability") or c.get("availability")):
            changes.append({"id": pid, "kind": "availability",
                            "detail": f"{p.get('availability') or '?'} → {c.get('availability') or '?'}"})
        # reformulation — observed (scraped ingredients changed) takes priority
        if p.get("live_label_hash") and c.get("live_label_hash") and p["live_label_hash"] != c["live_label_hash"]:
            changes.append({"id": pid, "kind": "reformulation",
                            "detail": f"observed label changed ({p['live_label_hash']} → {c['live_label_hash']})"})
        elif p.get("label_hash") and c.get("label_hash") and p["label_hash"] != c["label_hash"]:
            changes.append({"id": pid, "kind": "reformulation",
                            "detail": f"curated label changed ({p['label_hash']} → {c['label_hash']})"})
    for pid in prev:
        if pid not in curr:
            changes.append({"id": pid, "kind": "disappeared", "detail": "not in latest snapshot"})
    return changes


def render_report(date, changes, n_tracked):
    lines = [f"# n3gh. change report — {date}", ""]
    lines.append(f"Tracked products: **{n_tracked}** · changes detected: **{len(changes)}**")
    lines.append("")
    if not changes:
        lines.append("_No changes since the previous snapshot._")
        return "\n".join(lines)
    order = ["reformulation", "price", "availability", "disappeared", "new"]
    icons = {"reformulation": "🧪", "price": "💶", "availability": "📦",
             "disappeared": "❌", "new": "🆕"}
    for kind in order:
        rows = [c for c in changes if c["kind"] == kind]
        if not rows:
            continue
        lines.append(f"## {icons.get(kind,'')} {kind} ({len(rows)})")
        lines.append("")
        for c in rows:
            lines.append(f"- **{c['id']}** — {c['detail']}")
        lines.append("")
    return "\n".join(lines)
