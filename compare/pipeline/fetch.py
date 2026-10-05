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
Polite HTTP fetcher for the n3gh. pipeline.

Rules baked in:
  - honour robots.txt (per domain, cached)
  - per-domain rate limiting (min delay between hits)
  - honest User-Agent with a contact URL
  - on-disk response cache (so re-runs and tests don't re-hit the network)
  - bounded retries with backoff

Standard library only — no third-party deps, so it runs anywhere including a
minimal GitHub Actions runner. Network calls are the ONLY thing not covered by
the offline test suite.
"""
import os, time, json, hashlib, urllib.request, urllib.error, urllib.robotparser
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(HERE, ".cache")
os.makedirs(CACHE_DIR, exist_ok=True)

_last_hit = {}          # domain -> monotonic timestamp
_robots = {}            # domain -> RobotFileParser


class FetchResult:
    def __init__(self, url, status, body, from_cache=False, blocked=False, reason=""):
        self.url, self.status, self.body = url, status, body
        self.from_cache, self.blocked, self.reason = from_cache, blocked, reason
    def ok(self):
        return self.status == 200 and not self.blocked


def _cache_path(url):
    return os.path.join(CACHE_DIR, hashlib.sha1(url.encode()).hexdigest() + ".html")


def _robots_ok(url, ua):
    dom = urlparse(url).netloc
    if dom not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(f"{urlparse(url).scheme}://{dom}/robots.txt")
        try:
            rp.read()
        except Exception:
            rp = None                       # if robots unreachable, be conservative? we allow but note
        _robots[dom] = rp
    rp = _robots[dom]
    return True if rp is None else rp.can_fetch(ua, url)


def _throttle(url, min_delay):
    dom = urlparse(url).netloc
    now = time.monotonic()
    wait = min_delay - (now - _last_hit.get(dom, -1e9))
    if wait > 0:
        time.sleep(wait)
    _last_hit[dom] = time.monotonic()


def fetch(url, meta, use_cache=True, max_age_hours=20):
    """Return a FetchResult. Uses cache when fresh; never bypasses robots."""
    ua = meta.get("user_agent", "n3gh-bot/0.1")
    cache = _cache_path(url)
    if use_cache and os.path.exists(cache):
        age_h = (time.time() - os.path.getmtime(cache)) / 3600.0
        if age_h < max_age_hours:
            with open(cache, encoding="utf-8") as f:
                return FetchResult(url, 200, f.read(), from_cache=True)

    if meta.get("respect_robots", True) and not _robots_ok(url, ua):
        return FetchResult(url, 0, "", blocked=True, reason="robots.txt disallows")

    _throttle(url, meta.get("min_delay_seconds_per_domain", 8))
    req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept": "text/html"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=meta.get("timeout_seconds", 20)) as r:
                body = r.read().decode("utf-8", "replace")
                with open(cache, "w", encoding="utf-8") as f:
                    f.write(body)
                return FetchResult(url, r.status, body)
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < 2:
                time.sleep(5 * (attempt + 1)); continue
            return FetchResult(url, e.code, "", reason=str(e))
        except Exception as e:
            if attempt < 2:
                time.sleep(3 * (attempt + 1)); continue
            return FetchResult(url, 0, "", reason=str(e))
    return FetchResult(url, 0, "", reason="exhausted retries")
