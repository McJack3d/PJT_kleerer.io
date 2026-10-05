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
Prerender per-language routes: /compare/en/ and /compare/fr/.

Why this exists. The app switches language client-side, which is right for a
returning visitor but invisible to a crawler: Googlebot indexes whatever is in
the served HTML, so a French-market site was being indexed entirely in English.
This emits one static page per language with the translated <title>, meta
description, Open Graph tags and <html lang>, plus reciprocal hreflang links —
the parts a crawler reads before any JavaScript runs.

The pages are the SAME app. We do not fork the markup: each route loads the same
i18n.js/data.js and simply starts pinned to its language via <html lang> and a
N3GH_FORCE_LANG global. Behaviour, scores and the toggle are identical; only
the crawler-visible head differs, and a visitor who switches language is sent to
the sibling route so the URL keeps matching the content.

Usage:  python3 scripts/build_pages.py      (run after build_scores.py)
Output: compare/en/index.html, compare/fr/index.html
"""
import os, re, json, sys
from html import escape

HERE = os.path.dirname(os.path.abspath(__file__))
COMPARE = os.path.abspath(os.path.join(HERE, ".."))
SRC = os.path.join(COMPARE, "index.html")
I18N = os.path.join(COMPARE, "i18n.js")
BASE_URL = "https://n3gh.com/compare/"

LANGS = ("en", "fr")


def i18n_strings():
    """Pull the few head-level strings out of i18n.js without executing it."""
    src = open(I18N, encoding="utf-8").read()
    out = {}
    for lang in LANGS:
        # the language block starts at `lang: {` at top level of I18N
        start = src.index(f"\n{lang}: {{")
        block = src[start:start + 4000]
        def grab(key):
            m = re.search(rf'^\s*{key}:\s*"((?:[^"\\]|\\.)*)"', block, re.M)
            if not m:
                return None
            # Unescape only the JS string escapes we actually use. Do NOT round-trip
            # through unicode_escape: it mangles UTF-8 (é -> Ã©) in accented French.
            return m.group(1).replace('\\"', '"').replace("\\'", "'").replace("\\\\", "\\")
        out[lang] = {"metaDesc": grab("metaDesc"), "htmlLang": grab("htmlLang")}
        if not out[lang]["metaDesc"]:
            sys.exit(f"build_pages: could not read metaDesc for '{lang}' from i18n.js")
    return out


TITLES = {
    "en": "Compare supplements: ingredients, doses & prices | n3gh",
    "fr": "Comparateur de compléments : composition, doses et prix | n3gh",
}
OG_TITLES = {
    "en": "n3gh. — supplements, made clear",
    "fr": "n3gh. — les compléments, au clair",
}


def build(lang, strings):
    html = open(SRC, encoding="utf-8").read()
    s = strings[lang]
    alt = "fr" if lang == "en" else "en"

    # assets live one directory up from /compare/<lang>/
    html = html.replace('src="i18n.js', 'src="../i18n.js')
    html = html.replace('src="data.js', 'src="../data.js')
    html = html.replace('href="../"', 'href="../../"')          # logo -> site root

    html = html.replace('<html lang="en">', f'<html lang="{s["htmlLang"]}">')
    html = re.sub(r'<title>.*?</title>', f'<title>{escape(TITLES[lang])}</title>', html, count=1, flags=re.S)
    html = re.sub(r'(<meta name="description" content=")[^"]*(">)',
                  lambda m: m.group(1) + escape(s["metaDesc"], quote=True) + m.group(2),
                  html, count=1)
    html = re.sub(r'(<meta property="og:title" content=")[^"]*(">)',
                  lambda m: m.group(1) + OG_TITLES[lang] + m.group(2), html, count=1)
    html = re.sub(r'(<meta property="og:description" content=")[^"]*(">)',
                  lambda m: m.group(1) + escape(s["metaDesc"], quote=True) + m.group(2),
                  html, count=1)
    html = html.replace(f'<link rel="canonical" href="{BASE_URL}">',
                        f'<link rel="canonical" href="{BASE_URL}{lang}/">')
    html = html.replace(f'<meta property="og:url" content="{BASE_URL}">',
                        f'<meta property="og:url" content="{BASE_URL}{lang}/">')

    # the source page carries its own hreflang set (it is the x-default) — drop it
    # before emitting ours, or the route would advertise two conflicting sets
    html = re.sub(r'^<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n', "",
                  html, flags=re.M)
    hreflang = (f'<link rel="alternate" hreflang="{lang}" href="{BASE_URL}{lang}/">\n'
                f'<link rel="alternate" hreflang="{alt}" href="{BASE_URL}{alt}/">\n'
                f'<link rel="alternate" hreflang="x-default" href="{BASE_URL}">\n')
    html = html.replace('<link rel="canonical"', hreflang + '<link rel="canonical"', 1)

    # Keep sharing cards and structured data in the route's own language.
    for key, value in (("title", OG_TITLES[lang]), ("description", s["metaDesc"])):
        html = re.sub(rf'(<meta name="twitter:{key}" content=")[^"]*(">)',
                      lambda m: m.group(1) + escape(value, quote=True) + m.group(2), html, count=1)

    def localize_schema(match):
        data = json.loads(match.group(1))
        data.update(name=TITLES[lang], url=f"{BASE_URL}{lang}/",
                    inLanguage=lang, description=s["metaDesc"])
        data["about"]["name"] = "Compléments alimentaires" if lang == "fr" else "Dietary supplements"
        return '<script type="application/ld+json">\n' + json.dumps(data, ensure_ascii=False, indent=2) + '\n</script>'
    html = re.sub(r'<script type="application/ld\+json">(.*?)</script>',
                  localize_schema, html, count=1, flags=re.S)

    # pin the language before i18n.js runs, and make the toggle navigate between routes
    pin = (f'<script>window.N3GH_FORCE_LANG="{lang}";'
           f'window.N3GH_LANG_ROUTES={json.dumps({l: f"../{l}/" for l in LANGS})};</script>\n')
    html = html.replace('<script src="../i18n.js', pin + '<script src="../i18n.js', 1)
    return html


def main():
    strings = i18n_strings()
    for lang in LANGS:
        outdir = os.path.join(COMPARE, lang)
        os.makedirs(outdir, exist_ok=True)
        page = build(lang, strings)
        with open(os.path.join(outdir, "index.html"), "w", encoding="utf-8") as f:
            f.write(page)
        print(f"  /compare/{lang}/index.html  ({len(page):,} bytes, lang={strings[lang]['htmlLang']})")
    print("prerendered routes written — crawlers now see a translated head per language")


if __name__ == "__main__":
    main()
