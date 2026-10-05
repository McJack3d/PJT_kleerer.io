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
Headless renderer for JS-only shops (Shopify, headless DTC, Amazon).

Why: many product pages ship an almost-empty HTML shell and inject price and
label with JavaScript after load. The static fetcher reads the shell and finds
nothing. This module drives a real Chromium *without a window* (Playwright),
executes the page's JavaScript exactly like a normal browser, then hands the
final DOM to the same extractor.

Politeness is identical to the static path: robots.txt is checked and the
per-domain rate limit is honoured BEFORE any browser navigation. The rendered
HTML goes through the same on-disk cache.

Cost: free. GitHub Actions public repos get unlimited minutes, and Playwright
installs its own Chromium there (see .github/workflows/daily-pipeline.yml).

Graceful degradation: if Playwright isn't installed, render() reports
unavailable and run.py falls back to the static fetcher — which often still
works, because most Shopify shops embed schema.org JSON-LD server-side.
"""
import os, time, hashlib

import fetch as _fetch          # reuse robots + throttle + cache primitives

try:
    from playwright.sync_api import sync_playwright
    _PW_AVAILABLE = True
except Exception:
    _PW_AVAILABLE = False

_browser = None
_pw = None


def available():
    return _PW_AVAILABLE


def _get_browser():
    global _browser, _pw
    if _browser is None:
        _pw = sync_playwright().start()
        _browser = _pw.chromium.launch(headless=True)
    return _browser


def close():
    global _browser, _pw
    if _browser:
        _browser.close(); _browser = None
    if _pw:
        _pw.stop(); _pw = None


def render(url, meta, use_cache=True, max_age_hours=20, wait_ms=2500):
    """Return a FetchResult whose body is the post-JavaScript DOM."""
    cache = _fetch._cache_path(url + "#rendered")
    if use_cache and os.path.exists(cache):
        age_h = (time.time() - os.path.getmtime(cache)) / 3600.0
        if age_h < max_age_hours:
            with open(cache, encoding="utf-8") as f:
                return _fetch.FetchResult(url, 200, f.read(), from_cache=True)

    if not _PW_AVAILABLE:
        return _fetch.FetchResult(url, 0, "", blocked=False,
                                  reason="playwright not installed (pip install playwright && playwright install chromium)")

    ua = meta.get("user_agent", "n3gh-bot/0.1")
    if meta.get("respect_robots", True) and not _fetch._robots_ok(url, ua):
        return _fetch.FetchResult(url, 0, "", blocked=True, reason="robots.txt disallows")
    _fetch._throttle(url, meta.get("min_delay_seconds_per_domain", 8))

    try:
        browser = _get_browser()
        ctx = browser.new_context(user_agent=ua, locale="fr-FR",
                                  viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        # block heavy assets we never need — faster and lighter on the site
        page.route("**/*", lambda route: route.abort()
                   if route.request.resource_type in ("image", "media", "font")
                   else route.continue_())
        page.goto(url, timeout=meta.get("timeout_seconds", 20) * 1000,
                  wait_until="domcontentloaded")
        page.wait_for_timeout(wait_ms)          # let price hydration finish
        body = page.content()
        ctx.close()
        with open(cache, "w", encoding="utf-8") as f:
            f.write(body)
        return _fetch.FetchResult(url, 200, body)
    except Exception as e:
        return _fetch.FetchResult(url, 0, "", reason=f"render failed: {e}")
