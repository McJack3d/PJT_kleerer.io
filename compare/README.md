# p1 · compare

**The independent supplement comparator — score the label, price the active.**

First product of the kleerer. roadmap. Every supplement gets a transparent **Health & Compo Score** (0–100, grades A–E) computed from its label and public proofs, a price per gram of *actual* active, a **personalised dosage check** against your own targets, and a **stack builder** (p2, beta) that sums whatever you combine — built-in secondary actives included — and warns when the total quietly crosses an EU upper limit. **257 real products across 25 categories** — whey, creatine, vitamin D3, magnesium, omega-3, multivitamin, zinc, vitamin C, collagen, probiotics, melatonin, vitamin B12, vitamin K2, B-complex, biotin, folate, iron, potassium, plus four botanicals shown apart in purple (ashwagandha, maca, rhodiola, curcumin) and three testosterone boosters shown in teal (tribulus, fenugreek, ZMA) — EU with a French-market focus, nutrient snapshot July 2026; botanicals, vitamins and boosters September 2026. What each one is actually good for, graded on the trials, is on [`evidence/`](evidence/). No sponsors, no affiliate links, no paid placements.

## Run it

No build step, no server needed — open `compare/index.html` in any browser, or visit `/compare/` on the hosted site (GitHub Pages serves it automatically from this folder).

## What's inside

```
index.html                the app (single file, vanilla JS, zero runtime deps)
i18n.js                   UI translations (en/fr) + browser-language detection
en/, fr/                  prerendered per-language routes (generated — do not edit)
data.js                   generated dataset with scores — do not edit by hand
data/products_raw.json    curated source (v1, coded): 37 EU products, each with a buy link
data/fr/*.json            French-market source (126 products, free-text labels)
scripts/autotag.py        auto-tagger: free-text label → coded tags + form tiers
scripts/build_scores.py   scoring engine — normalizes + scores → data.js
scripts/build_pages.py    prerenders /compare/en/ and /compare/fr/ for crawlers
METHODOLOGY.md            full Health & Compo Score methodology (v1.1)
pipeline/                 the data collection pipeline (the moat) — see pipeline/README.md
```

## Edit or extend the data

1. Add/fix a product: edit `data/products_raw.json` (coded schema) **or** drop a line in `data/fr/*.json` (plain label — the auto-tagger codes it for you).
2. Rebuild: `python3 scripts/build_scores.py` (stdlib only, Python ≥ 3.8).
3. Refresh the prerendered routes: `python3 scripts/build_pages.py`.
4. Reload `index.html`.

The script validates every score range, rejects duplicate ids, and prints the full ranking so regressions are visible at a glance.

## Scoring in one paragraph

`Score = Composition & Efficacy (40) + Purity & Additives (30) + Transparency & Testing (30)`. Form quality (chelate vs oxide, rTG vs ethyl ester, Creapure® vs generic, strain-coded probiotics…) and effective dosing vs EFSA references make up composition; additives subtract from a 30-point purity base via the open auto-tagger; published COAs (+12), third-party certifications (+10), branded traceable ingredients (+4) and fully quantified labels (+4) make up transparency. Price never touches the health score — value is shown separately. Full rules: [METHODOLOGY.md](METHODOLOGY.md).

## The pipeline (why this isn't replicable in an evening)

The app and the score can be cloned quickly. The [`pipeline/`](pipeline/) can't — it produces a **versioned time-series** of prices and label compositions that can only be accumulated day by day. It fetches tracked products politely (robots.txt, rate-limits, honest UA), snapshots price + label into a dated, content-hashed archive, and diffs each day against the last to catch price moves and silent reformulations. A [daily GitHub Action](../.github/workflows/daily-pipeline.yml) runs it and commits the archive. See [pipeline/README.md](pipeline/README.md).

**Storage note.** The archive lives in git for now (small, auditable, free). Once daily snapshots across thousands of products outgrow git comfortably (roughly when `pipeline/snapshots/` passes a few hundred MB), the same JSON files move unchanged to object storage (S3/R2) and git keeps only the reports. Nothing about the format changes.

## Language

The interface is bilingual (English / French). The language comes from the browser's own
`navigator.language`, with a manual toggle in the header that wins and is remembered in
`localStorage` (shared with the root page). **We never geolocate the visitor's IP**: that
would mean sending their address to a third-party service — breaking the zero-dependency,
no-external-request design — and it answers the wrong question anyway, since a French
speaker in London wants French.

`scripts/build_pages.py` prerenders **`/compare/en/` and `/compare/fr/`** so crawlers see a
translated `<title>`, meta description, Open Graph tags and `<html lang>` without running
any JavaScript. All three URLs carry a reciprocal `hreflang` set; `/compare/` is the
`x-default` that negotiates client-side, and each language route is canonical to itself.
On a prerendered route the URL wins over the stored preference, and the toggle navigates
to the sibling route so the page never contradicts its own canonical tag.

One honest limit: translation covers the **interface**. Product-level editorial fields in
the dataset (`notes`, `flags`, `form_note`, `price_note`) stay in the language they were
authored in, so a French product's notes read in French in both UIs.

## Multivitamins, per nutrient

Multivitamins have no single dose to check, so each one carries a `nutrients` map of what
it contributes **per daily dose** for the four nutrients that have a regulatory ceiling
(vitamin D3 in IU, zinc / magnesium / vitamin C in mg elemental). A key present means
coded; `0` means confirmed absent from the formula; a **missing key means unknown**. The
stack sums every coded nutrient in full and names only the genuinely uncoded ones — so a
partially coded product still contributes real numbers instead of triggering a blanket
caveat. `nutrients_source` records where each figure came from.

Coverage today: 2 of 18 complete, 12 partial, 4 uncoded. Extending it is ordinary data
work — add a `nutrients` block to the product in its source file and rebuild.

## Price context

Each product may carry a `price_context`: one coarse, derived fact, never a price series.
`list_price` means the shown price is the list price and the product structurally sells
below it (so its € / active is a worst case); `promo_price` means the snapshot was taken
**during** a promotion, so the value ranking currently flatters it; `stable` means the
price is what you pay. This is the only thing the private archive publishes about price
history — a single field per product, with nothing reconstructible from it.

## Data honesty

Prices are EU/FR list prices snapshotted **July 2026**; promo-heavy brands (Myprotein, Bulk, Prozis) sell 30–45 % below list most of the year, and this is flagged per product. Each product carries a data-confidence level (high / medium / low). Scores are computed from labels and public documents — **not** from independent lab testing.

## Disclaimer

kleerer. does not provide medical advice. Supplements are not a substitute for a varied diet. Consult a healthcare professional before supplementing, especially if pregnant, on medication, or managing a condition.

## License

MIT — see [LICENSE](../LICENSE) at the repository root. Corrections and pull requests welcome: if a brand disagrees with a score, the fix is the same for everyone — publish better proof.
