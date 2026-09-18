# kleerer.io

Source for **[kleerer.com](https://kleerer.com)** — an independent, evidence-based health-data project. The site is static (no build step, no backend, no runtime dependencies) and is published via GitHub Pages directly from this repository.

## What this is

kleerer. makes supplement science available to people looking for advice or recommendations, without sponsors, affiliate links, or paid placement. It's built in numbered "p" steps (products); the first one is live.

- **`index.html` / `style.css` / `script.js`** — the root landing page: the project's mission statement, bilingual (EN/FR, detected from the browser's language, never from IP), linking through to each product.
- **`compare/`** — **p1 · compare**, the first product: an independent supplement comparator. Open `compare/index.html` in a browser or visit [kleerer.com/compare](https://kleerer.com/compare/). See [compare/README.md](compare/README.md) for how it works and [compare/METHODOLOGY.md](compare/METHODOLOGY.md) for the full scoring rules.
- **`bot/`** — a transparency page describing `kleerer-bot`, the crawler used to collect price/label data (identifies itself honestly, respects `robots.txt`, rate-limited, no login walls bypassed). Site owners can request exclusion via `hello@kleerer.com`.
- **`compare/evidence/`** — **what supplements actually do, by need.** Sleep, stress, muscle, bone, heart, immunity, memory, joints, skin, gut, energy, libido — each supplement graded A–D on the trials behind that specific pairing, participants counted, every figure cited. The EFSA authorised claim is shown separately from the trial evidence, because a regulator approving a sentence about a nutrient's role is not a trial showing an outcome improved. The dataset is one readable file (`evidence.js`) so any grade can be challenged with a better study.
- **`terms/`** — terms of use, including the database-right and text-and-data-mining clauses (EN/FR).
- **`NOTICE.md`** — which licence applies to which layer, and exactly what the database right does and does not claim. Read this before reusing anything.
- **`robots.txt` / `.well-known/tdmrep.json`** — the TDM reservation in human- and machine-readable form.
- **`analytics.js`** — cookieless audience measurement: no cookies, no identifiers, no personal data, DNT/GPC honoured, so no consent banner and no self-selected baseline. Inert until a provider is configured.
- **`manifest.webmanifest` / `sw.js` / `pwa.js` / `icons/`** — the installable app. `compare/` is a PWA: add it to a home screen and **the whole catalogue works offline**, which is the point — the moment you most want a score is standing at the shelf, which is exactly where the signal dies. The ~390 KB catalogue is precached, so it runs with the radio off. The service worker touches our own origin only, stores nothing about the visitor, and sends nothing anywhere.
- **`CNAME`** — GitHub Pages custom-domain config, points the repo at `kleerer.com`.

## What it's used for

`compare/` scores dietary supplements (whey, creatine, vitamin D3, magnesium, omega-3, multivitamins, zinc, vitamin C, collagen, probiotics, melatonin, vitamin B12, vitamin K2, B-complex, biotin, folate, iron, potassium — and, shown apart, the botanicals ashwagandha, maca, rhodiola and curcumin, and in teal the testosterone boosters tribulus, fenugreek and ZMA) on a transparent, reproducible **0–100 Health & Compo Score (grades A–E)**, computed only from what's on the label and what a brand publicly proves — never from marketing claims:

- **Health & Compo Score** = Composition & Efficacy (0–40) + Purity & Additives (0–30) + Transparency & Testing (0–30). A banned/restricted/withdrawn substance (per EU-EFSA, US-FDA, or WHO — strictest of the three wins) is an automatic 0 / grade E, regardless of anything else.
- **Price per gram of active ingredient**, separated from the health score — price never affects the score, only the value comparison.
- **Personalised dosage check** against the user's own targets, including a stack builder (p2, beta) that sums combined products (built-in secondary actives included) and flags when a combined total crosses an EU upper limit.
- Everything is open-method: the auto-tagger and scoring engine are plain, auditable Python scripts, so anyone can challenge a score by pointing at better proof.
- **An unreadable label is not a score.** If the auto-tagger meets an ingredient string it cannot classify, the product is **withheld from the site entirely** until a human rules on that string — it is not published with a token penalty. Rulings are recorded in `compare/data/review-ledger.json` with the reason, reviewer and date, and each published product shows what was decided about it. See [METHODOLOGY §2c](compare/METHODOLOGY.md) and `compare/scripts/review.py`.

## The data

- **Botanicals are scored apart.** Ashwagandha, maca, rhodiola and curcumin are plant extracts, not nutrients — no reference intake, no EFSA limit, no authorised claim — so they appear in light purple, go through the same score and review gate as everything else, and carry their safety advisories where the dose would otherwise be. See [METHODOLOGY §5](compare/METHODOLOGY.md).
- **Testosterone boosters are scored apart too, in teal.** Tribulus, fenugreek and ZMA go through the same score, which is exactly why they land low: no tribulus dose has raised testosterone in men in a controlled trial, and the evidence page grades most of the wider group (D-aspartic acid, turkesterone, boron, DHEA) D. The colour exists so a reader sees that verdict before the price. See [METHODOLOGY §5b](compare/METHODOLOGY.md).
- **Scope**: 257 coded products across 25 categories (18 nutrient categories + 4 botanicals + 3 testosterone boosters), EU market with a French-market focus; prices snapshot **July 2026** for the original nutrient categories, **September 2026** for the botanicals, the vitamin batch (B12, K2, B-complex, biotin, folate) and the boosters, and **September 2026** for iron and potassium. All 257 are published; the review queue is empty. Anything withheld in future shows up in `compare/data.js` under `meta.n_withheld_for_review`.
- **`compare/data/products_raw.json`**: 37 curated EU products in a coded schema (id, category, brand, price, form, dosing, additives, certifications, transparency flags, source URL, confidence level).
- **`compare/data/fr/*.json`**: ~220 French-market products as free-text labels (`botanicals.json` holds the 30 ashwagandha, maca, rhodiola and curcumin products, `vitamins.json` the 33 B12, K2, B-complex, biotin and folate products, `boosters.json` the 13 tribulus, fenugreek and ZMA products — all transcribed from the brands' own pages on 6 September 2026; `minerals.json` the 13 iron and 5 potassium products, transcribed from cached brand pages of 13 September 2026 and each checked field by field by a second, independent pass); `compare/scripts/autotag.py` auto-tags these into the same coded schema (form quality tiers, additive classification) used for the curated set.
- **`compare/data.js`**: the generated, scored dataset the app actually reads — built from the two sources above by `compare/scripts/build_scores.py`. Generated; not edited by hand.
- **`compare/pipeline/`**: the data-collection pipeline — a polite crawler (honours `robots.txt`, rate-limited, honest User-Agent) that snapshots price + label per product daily, diffs each snapshot against the previous day to catch price moves and silent reformulations, and enriches by EAN via OpenFoodFacts open data where possible. The *code* is public; the accumulating **historical archive** (the actual time-series asset) is kept in a separate private repository (`kleerer-data`) — see [compare/pipeline/README.md](compare/pipeline/README.md).
- **Data honesty**: prices are EU/FR list prices as snapshotted in July 2026 (promo-heavy brands are flagged per product since they routinely sell well below list); each product carries a confidence level (high/medium/low); scores come from labels and public documents, not independent lab testing.

## Disclaimer

kleerer. does not provide medical advice. Consult a healthcare professional before supplementing, especially if pregnant, on medication, or managing a condition.

## Licence

**Not one licence — one per layer.** A software licence and a dataset are different kinds of thing, and applying MIT to both (as this repo previously did) licensed away the dataset by accident. Full detail in [NOTICE.md](NOTICE.md).

| Layer | Licence |
| :---- | :------ |
| Site/app code, scoring engine, auto-tagger, pipeline | **AGPL-3.0-only** ([LICENSE](LICENSE)) — also available under a commercial licence |
| `compare/METHODOLOGY.md` | **CC BY-NC-ND 4.0** ([details](compare/LICENSE-METHODOLOGY.md)) |
| `compare/data.js`, `compare/data/` | **CC BY-NC-SA 4.0** + database right ([details](compare/LICENSE-DATA.md)) |
| Historical price/composition archive | **Not published. All rights reserved.** |

The AGPL's network clause applies: run a modified version as a service and you owe its users your source. If that does not work for your product, the commercial licence is the paid exemption — `hello@kleerer.com`. It covers the engine only and **never** the archive.

### Database right and TDM

The catalogue and the archive are protected databases (Directive 96/9/EC; CPI art. L.341-1 ff.), and text-and-data-mining rights are reserved (Directive (EU) 2019/790 art. 4(3); CPI art. L.122-5-3) — see [`robots.txt`](robots.txt) and [`.well-known/tdmrep.json`](.well-known/tdmrep.json).

**The limit, stated plainly:** the database right protects the *database*, not the facts in it. A single price is a fact and is not protected — quote or republish any individual price or label freely. What is reserved is extraction of a **substantial part**. The public pages stay deliberately crawlable and citable, including by AI assistants; the reservation targets bulk mining of the archive, the methodology, and the catalogue-as-a-database.

Corrections and pull requests are welcome. Contributions are accepted under the licence of the layer they touch.
