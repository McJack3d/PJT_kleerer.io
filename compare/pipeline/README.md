# n3gh. data pipeline (v0)

> **Why this exists.** The web app is replicable in an evening. This pipeline is not — because what it produces (a *versioned time-series* of prices and label compositions across the EU supplement market) can only be accumulated day by day. A better LLM tomorrow can copy today's snapshot; it can never regenerate three years of price history, reformulation diffs and delistings it never observed. **The moat is the archive, not the code.**

The pipeline turns a list of product URLs into dated, hashed snapshots, detects what changed since yesterday, and hands normalized records to the same scoring engine the site uses.

```
sources.yaml            seed list of product URLs (source of truth for what we track)
fetch.py                polite fetcher: robots.txt, rate-limit, retries, caching
extract.py              pull structured facts (schema.org JSON-LD, microdata, meta) from a page
snapshot.py             write a dated, content-hashed snapshot per product
diff.py                 compare the two latest snapshots → price moves + reformulations
run.py                  orchestrate: fetch → extract → snapshot → diff → report
offtake.py              OpenFoodFacts adapter (open data, no scraping) for barcodes/EANs
tests/                  fixtures + unit tests (run offline, no network)
snapshots/              the archive. One folder per day. THIS is the asset.
reports/                daily human-readable change reports (markdown)
```

## Design principles

1. **Politeness first.** We honour `robots.txt`, throttle per-domain, set an honest User-Agent with a contact URL, cache aggressively, and never hammer a site. Legal/ToS risk is a first-class concern (see roadmap Phase 1 audit).
2. **Open data before scraping.** Where a product has an EAN, we pull nutrition/ingredient facts from **OpenFoodFacts** (open database, ODbL) instead of scraping the merchant. `offtake.py` does this.
3. **Structured before unstructured.** We prefer schema.org `Product`/`Offer` JSON-LD (price, availability) already embedded in most e-commerce pages over brittle HTML scraping.
4. **Everything is versioned.** Snapshots are immutable and content-addressed. The `label_hash` from the scoring engine detects silent reformulations; price series are kept forever.
5. **Same normalization as the site.** `extract.py` feeds `scripts/autotag.py`, so a scraped product is tagged and scored exactly like a curated one.

## Quick start

```bash
cd compare/pipeline
python3 run.py --dry-run          # parse sources.yaml, show what would be fetched
python3 run.py --limit 5          # fetch 5 products politely, snapshot + diff
python3 -m pytest tests/ -q       # offline tests (no network)
```

`run.py` writes today's snapshots to `snapshots/YYYY-MM-DD/` and a change report to `reports/YYYY-MM-DD.md` (both git-ignored in this public repo).

## Archive privacy — where the history actually lives

**The historical archive is private by design.** The public repo contains code and today's catalogue only; the accumulating time-series — the asset — is committed daily to the **private** repository `n3gh/n3gh-data` by the workflow, via the env vars `N3GH_SNAPSHOT_DIR` / `N3GH_REPORTS_DIR`.

One-time setup:
1. Create the private repo `n3gh-data` on GitHub (empty is fine).
2. Create a fine-grained personal access token scoped to **only** that repo, permission *Contents: Read and write* (GitHub → Settings → Developer settings → Fine-grained tokens).
3. In `n3gh.io` → Settings → Secrets and variables → Actions → new secret **`DATA_REPO_TOKEN`** = that token.
4. Re-run the workflow. Each day now lands as one commit in `n3gh-data`.

**Offline backup** (external drive): run [`backup.sh`](backup.sh) — first run creates full `git clone --mirror` copies of both repos (every commit, every day ever recorded); later runs are fast incremental updates. Suggested cadence: weekly. A mirror alone is enough to restore everything even if GitHub vanished.

**Also recommended (2 min):** on both repos, Settings → Rules → protect `main` against force-pushes and deletion, so no one — including a compromised token — can silently rewrite history.

## What v0 does and does not do

**Does:** polite fetch, **headless rendering for JS-only shops** (Playwright Chromium, free on GitHub Actions — `render.py`), JSON-LD/meta extraction, **live ingredient-label extraction** feeding the shared auto-tagger (observed reformulation detection), dated content-hashed snapshots, price-move + reformulation diffing, OpenFoodFacts enrichment by EAN, auto-generated source list from the catalogue (`gen_sources.py`, 695 tracked sources, including manufacturers, Amazon.fr and French online pharmacies), dry-run planning, 16 offline tests.

**Does not yet:** per-merchant HTML adapters, captcha/anti-bot evasion (we don't evade — if a site blocks us, we record the failure and move on), a proper database. Bot transparency page: [/bot/](../../bot/) — site owners can request exclusion at hello@n3gh.com.
