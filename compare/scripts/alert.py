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
n3gh. — owner alerts (guidelines §5.2, the "alert to the product owner" leg).

The loop is: flagged product -> ALERT -> manual review -> publish or withhold.
Withholding already happens without anyone being told, which is the safe
failure. This is the part that stops "safe" from quietly meaning "the catalogue
shrinks every week and nobody notices".

Channels, all best-effort — a dead channel must never fail a build or a
collection run:

  stdout       always. A banner that survives being read in a scrollback.
  log file     always. ~/Library/Logs/n3gh-review.log (override: N3GH_LOG_DIR)
  desktop      macOS notification, when running on a Mac with a session.
  webhook      only if N3GH_ALERT_WEBHOOK is set. OFF by default and
               deliberately so: it posts product names to a third party, and
               nothing here should start talking to the network because a
               default was left on.

There is no email channel. Adding one means a credential in the environment of a
daily cron job, for a message that lands on the same machine that generated it.
The desktop notification does that job without the secret.
"""
import json, os, subprocess, sys, datetime, urllib.request

LOG_DIR = os.environ.get("N3GH_LOG_DIR",
                         os.path.expanduser("~/Library/Logs"))
LOG_FILE = os.path.join(LOG_DIR, "n3gh-review.log")
OWNER = "Alexandre Bredillot"


def _log(line):
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"{datetime.datetime.now().isoformat(timespec='seconds')}  {line}\n")
    except OSError:
        pass


def _notify_macos(title, message):
    if sys.platform != "darwin":
        return
    try:
        # osascript, not a dependency. Quotes in product names would break the
        # AppleScript string, so they are stripped rather than escaped.
        safe = message.replace('"', "").replace("\\", "")[:240]
        head = title.replace('"', "")[:120]
        subprocess.run(
            ["osascript", "-e",
             f'display notification "{safe}" with title "{head}" sound name "Submarine"'],
            check=False, capture_output=True, timeout=10,
        )
    except (OSError, subprocess.SubprocessError):
        pass


def _webhook(payload):
    url = os.environ.get("N3GH_ALERT_WEBHOOK")
    if not url:
        return
    try:
        req = urllib.request.Request(
            url, data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json",
                     "User-Agent": "n3gh-alert/1.0"},
        )
        urllib.request.urlopen(req, timeout=10).close()
    except Exception:                                   # noqa: BLE001 — never fail a build
        _log("webhook delivery failed (alert still recorded locally)")


def review_needed(queue):
    """Announce that products are being withheld pending review.

    `queue` is the dict written by review.write_queue(). Returns True if an
    alert was raised, False if there was nothing to raise.
    """
    n_p = queue.get("n_withheld_products", 0)
    n_s = queue.get("n_pending_strings", 0)
    if not n_p:
        return False

    top = queue["pending_strings"][:5]
    detail = ", ".join(f"{r['string']} (×{r['blocks_n_products']})" for r in top)
    if n_s > len(top):
        detail += f", +{n_s - len(top)} more"

    bar = "!" * 74
    print(f"\n{bar}")
    print(f"  REVIEW REQUIRED — {OWNER}")
    print(f"  {n_p} product(s) WITHHELD from the site: {n_s} unrecognised ingredient string(s)")
    print(f"  {detail}")
    print(f"\n  These products are NOT published until each string is ruled on (§5.2).")
    print(f"    python3 scripts/review.py --list")
    print(f'    python3 scripts/review.py --decide "<string>" --as neutral --note "why"')
    print(f"{bar}\n")

    _log(f"REVIEW REQUIRED: {n_p} product(s) withheld, {n_s} pending string(s) — {detail}")
    _notify_macos(
        f"n3gh — {n_p} product(s) withheld",
        f"{n_s} unrecognised ingredient(s) need review: {detail}",
    )
    _webhook({
        "event": "review_needed",
        "owner": OWNER,
        "withheld_products": n_p,
        "pending_strings": n_s,
        "top": top,
        "generated": queue.get("generated"),
    })
    return True


def cleared(n_released):
    """Counterpart to review_needed: say so when the queue empties."""
    if n_released:
        msg = f"review queue cleared — {n_released} product(s) released to the site"
        print(f"\n✅ {msg}\n")
        _log(msg)
        _notify_macos("n3gh — review queue clear", msg)


if __name__ == "__main__":
    # Manual re-alert, e.g. from a cron job that only wants to nag.
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import review
    q = review.load_queue()
    if not q:
        print("no review queue — run scripts/build_scores.py first")
        sys.exit(0)
    sys.exit(0 if review_needed(q) else 0)
