<!--
SPDX-License-Identifier: CC-BY-NC-ND-4.0
Copyright © 2026 n3gh. All rights not expressly granted are reserved.
Licence: LICENSE-METHODOLOGY.md · https://creativecommons.org/licenses/by-nc-nd/4.0/
Text-and-data-mining rights reserved — Dir. (EU) 2019/790 art. 4(3); CPI art. L.122-5-3.
-->

# n3gh. — Health & Compo Score methodology (v1.2)

> **Licence.** This document is published under **CC BY-NC-ND 4.0** — quote it,
> cite it, redistribute it verbatim with attribution. Commercial use and
> modified or rebranded republication are not permitted; see
> [`LICENSE-METHODOLOGY.md`](LICENSE-METHODOLOGY.md). The *code* implementing
> this method is separately licensed under AGPL-3.0-only. Arguing with a rule
> here, in public and by name, is expressly invited — that is what publishing it
> is for.

**Goal.** Give every supplement a transparent, reproducible 0–100 score based only on what is on the label and what the brand publicly proves — never on marketing claims. Free-text labels are turned into coded tags by an open auto-tagger ([`scripts/autotag.py`](scripts/autotag.py)) — the **same module the collection pipeline uses** — and scored by an open script ([`scripts/build_scores.py`](scripts/build_scores.py)).

**Open method, proprietary data.** The *scoring code and rules* are open so anyone can audit and challenge them. The *dataset and its history* are not published: the daily price-and-label time-series accumulated by our pipeline is n3gh's core asset and cannot be regenerated retroactively by a competitor. Openness of method earns trust; privacy of the archive is the moat.

**What the score is not.** It is not medical advice, not a measure of whether *you* need the product, and not a lab test — we score label composition and public transparency, not actual batch content.

**Scope.** 612 published products across 25 categories (18 nutrient categories, 4 botanicals, 3 testosterone boosters — see §5), EU with a French-market focus. Records retain their own price and label observation dates; the 9 October 2026 expansion is documented in [the audit](AUDIT-2026-10-09.md). Scoring methodology v1.4; personalised dosing model v2.

---

## Score structure

`Health & Compo Score = Composition & Efficacy (0–40) + Purity & Additives (0–30) + Transparency & Testing (0–30)`

| Grade | Score |
|---|---|
| **A** | ≥ 80 |
| **B** | 65–79 |
| **C** | 50–64 |
| **D** | 35–49 |
| **E** | < 35 |

**🟥 Red card (automatic 0 / grade E).** If a product contains a substance banned, restricted, or with authorisation withdrawn by *any* of EU-EFSA, US-FDA or WHO, its total score is forced to **0** regardless of everything else. A banned additive is not a deduction to be offset by good dosing — it is a disqualification.

---

## 1. Composition & Efficacy (0–40)

**1a. Form quality (0–20)** — how bioavailable the chemical/physical form is (chelate vs oxide, rTG vs ethyl ester, Creapure® vs generic, strain-coded probiotics, bioactive vitamins…). Full per-category ladder in [`autotag.py`](scripts/autotag.py).

**1b. Effective dosing (0–20)** — daily dose at label serving vs published effective ranges and EFSA reference values, with penalties for exceeding EU upper limits (e.g. vitamin D > 4 000 IU, zinc > 25 mg, melatonin > 1.9 mg).

## 2. Purity & Additives (0–30)
Start at 30, subtract per additive (floor 0). Every ingredient string is classified by `autotag.classify_additive`. **The penalties are proportionate to the strength of the health evidence**, and the most evidence-backed harm here is *added sugar* — so no sweetener is penalised more than sugar.

| Tag | Penalty | Basis |
|---|---|---|
| **Banned substance** | **RED CARD → 0** | banned/withdrawn/restricted by EU, FDA or WHO (see §2b) |
| Fully hydrogenated fat | −25 | saturated; near-disqualifying (partially hydrogenated = trans fat = red card) |
| Undisclosed doses / proprietary blend | −10 | you can't assess what isn't quantified |
| BHA / BHT (E320/E321) | −10 | IARC 2B / endocrine suspicion |
| Added sugar | −8 | strongest harm evidence of any additive here |
| Sweetener — Tier D (sucralose, erythritol, xylitol) | −6 | mechanistic / cardiovascular signal (see §2a) |
| Sweetener — Tier C (aspartame, acesulfame-K) | −4 | cohort cancer/CVD signal |
| Artificial azo colour (E102/E110/E129…) | −3 | EU child-attention warning required |
| Sweetener — Tier B (saccharin, cyclamate) | −2 | reassuring evidence but not natural |
| Polyol (maltitol, sorbitol) · PEG carrier · artificial flavour · emulsifier · thickener · filler · anti-caking · coating · preservative (sorbates/benzoates) | −2 each | technological additives, minor concern |
| Undisclosed minor ingredient ("support comprimé standard", bare "arômes") | −1 | transparency deduction, not a harm claim (see §2d) |
| Acidity regulator / raising agent (citric acid, sodium citrate, malic acid, tartaric acid, potassium hydroxide, sodium carbonate) | −1 | trace pH agents; no health signal (see §2d) |
| Unrecognised ingredient | **product withheld from the site** | not scored at all until a human rules on it (see §2c) |

Neutral (0): water, glycerine, gelatine and capsule shells, carrier oils, natural tocopherol/rosemary antioxidants, natural flavours, plant-based colour concentrates, pectin, lactase, prebiotic fibres, and **Tier-A natural sweeteners (stevia, monk fruit)** — no credible harm signal.

### 2a. Our position on sweeteners (evidence-based, not alarmist)
The balance of current evidence is that regulator-approved sweeteners are safe at realistic intakes: EFSA, the FDA and WHO/JECFA continue to uphold their acceptable daily intakes, and in July 2023 JECFA reaffirmed aspartame's ADI even as IARC placed it in Group 2B — its weakest "possibly carcinogenic" hazard tier. Large observational cohorts (NutriNet-Santé, >100 000 adults) report modest associations between some sweeteners — aspartame, acesulfame-K, sucralose — and cancer or cardiovascular endpoints, and laboratory studies have flagged genotoxicity of a sucralose impurity and platelet effects of erythritol and xylitol. **These are cohort signals and in-vitro findings, not established causation**, and several are weakened by reverse causality (blood polyol levels are partly produced by the body). Notably, the evidence that *added sugar* harms health is stronger and more consistent than for any sweetener — which is why we penalise sugar more. WHO (2023) advises against using sweeteners for weight control, a conditional, low-certainty recommendation. n3gh therefore applies a **mild precaution proportional to the evidence** (Tier B < C < D), never a blanket "sweeteners cause cancer" verdict.

Key sources: [IARC/JECFA aspartame assessment, WHO 2023](https://www.who.int/news/item/14-07-2023-aspartame-hazard-and-risk-assessment-results-released) · [Debras et al., sweeteners & cancer, PLOS Medicine 2022](https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1003950) · [Debras et al., sweeteners & CVD, BMJ 2022](https://www.bmj.com/content/378/bmj-2022-071204) · [Schiffman et al., sucralose-6-acetate, J. Toxicol. Environ. Health 2023](https://www.tandfonline.com/doi/full/10.1080/10937404.2023.2213903) · [Witkowski et al., erythritol & cardiovascular risk, Nature Medicine 2023](https://www.nature.com/articles/s41591-023-02223-9) · [Witkowski et al., xylitol, European Heart Journal 2024](https://academic.oup.com/eurheartj/article-abstract/45/27/2439/7683453) · [WHO guideline on non-sugar sweeteners, 2023](https://www.who.int/news/item/15-05-2023-who-advises-not-to-use-non-sugar-sweeteners-for-weight-control-in-newly-released-guideline) · [FDA, Aspartame and Other Sweeteners, 2025](https://www.fda.gov/food/food-additives-petitions/aspartame-and-other-sweeteners-food) · [Added-sugar harms umbrella review, Annual Review of Nutrition 2023](https://www.annualreviews.org/content/journals/10.1146/annurev-nutr-062322-020650).

### 2b. Red-card registry — strictest-guideline-wins
For every additive we compare the positions of the EU (EFSA), the US FDA and the WHO (JECFA/IARC), and we adopt the **most cautious** of the three. If any single body bans a substance, withdraws its authorisation, or restricts it, we flag it — even where the other two still permit it. Regulators genuinely diverge (titanium dioxide is banned in EU food yet allowed by the FDA), and a health score should not wait for the slowest jurisdiction.

| Substance | Red card because | Most recent action |
|---|---|---|
| Titanium dioxide (E171) | EU food ban (possible genotoxicity) | EU 2022 |
| Partially hydrogenated oil / industrial trans fat | WHO elimination target; FDA GRAS revoked; EU 2% cap | 2018–2021 |
| Brominated vegetable oil (BVO) | FDA authorisation revoked; EU never allowed | FDA 2024 |
| Potassium bromate (E924) | IARC 2B; EU-banned; California ban | 2023 |
| Red Dye No. 3 / erythrosine (E127) | FDA authorisation revoked (thyroid tumours) | FDA 2025 |
| Propylparaben (E216/E217) | EU food authorisation removed (endocrine concern) | EU 2006 |

*Fully hydrogenated fat is not a red card — it is saturated, not trans — but scores −25. Calcium carbonate, the clean E171 replacement, is neutral.*

### 2c. Unrecognised ingredients → the product is withheld
When the tagger meets an ingredient it can't classify, it does **not** guess it away, and it no longer scores it either. **The product is withheld from the site entirely** until a human has ruled on the string.

Earlier versions of this method gave an unrecognised ingredient a "conservative" −2 and published the product with a *needs review* flag. That was the wrong instinct dressed up as a cautious one. A −2 is a claim — it says *whatever this is, it is minor* — and an unreadable string is precisely the case where we have no basis for that claim. It could be an inert bulking agent; it could be a substance that should red-card the product to grade E. Publishing a B for a label we cannot read is the exact failure this whole method exists to prevent, so the product does not ship.

Every ruling is recorded in `data/review-ledger.json` against the normalised ingredient string, with the verdict (benign, a named additive penalty, or a red card), the reason, the reviewer and the date. Ruling on a string once releases every product carrying it. Corrections keep the superseded ruling, so what was believed and when stays auditable.

A product that *is* published therefore carries the opposite signal from before: the card's **manually reviewed** section names each once-unreadable ingredient and shows what a human decided about it. That ruling is challengeable in public, same as any other rule here.

### 2d. The −1 band, and why it exists (v1.3)
Two kinds of ingredient were being forced into a −2-or-nothing choice that fitted neither.

**Undisclosed minor ingredients.** A label reading *"support comprimé standard"* or a bare *"arômes"* has declared that something is present without saying what. Scoring that as zero rewards vagueness; scoring it −2 alongside a named, evidence-assessed additive overstates what is wrong. It is a **transparency** deduction. Note the deliberate distance from *proprietary blend* (−10): an undisclosed blend of **actives** means you cannot assess the product at all, whereas an unspecified tablet excipient means you cannot audit its filler. Those are not the same failure and no longer carry the same weight.

**Acidity regulators and raising agents.** Citric acid, sodium citrate, malic acid, tartaric acid, potassium hydroxide and sodium carbonate are trace pH agents with no harm signal. −1 records that a technological ingredient was added without implying a health concern.

Citric acid and sodium citrate sat on the neutral list until v1.3 while their functional equivalents scored −1, so the same chemistry scored differently depending on which acidifier a brand happened to choose. They now share the band. **Which way an inconsistency is resolved matters:** the fix was to move citric acid down to −1, not to move the others up to neutral, because a declared additive is still a declared additive — but the deduction stays at the floor, since the evidence does not support more.

**What this does not touch: mineral actives.** Magnesium citrate, zinc citrate and potassium citrate are *the product*, not additives in it — their quality is already scored by form tier (§1a). Calcium citrate remains a bulking filler, magnesium carbonate an anti-caking agent, calcium carbonate a coating. The acidity rule is evaluated last precisely so none of these is taxed for being a citrate or a carbonate.

## 3. Transparency & Testing (0–30)
Published COAs (+12) · recognised third-party certification (Informed Sport, Cologne List, IFOS, Sport Protect, AFNOR NF, Friend of the Sea…) (+10) · branded traceable ingredient (Creapure®, EPAX®, Peptan®, Quali-C®…) (+4) · fully quantified label, no proprietary blend (+4).

## Value & price level (separate from the health score)
Price never contaminates a health score. Alongside it we show two things:
- **€ / standard dose**, normalised per category (€ / 25 g protein · 3 g creatine · 1000 IU D3 · 300 mg elemental Mg · 500 mg EPA+DHA · 15 mg zinc · 1000 mg vitamin C · 10 g collagen · € / day for multis, probiotics, melatonin).
- **Price level 1–5** — a simple affordability band within each category (1 = cheapest per standard dose, 5 = priciest), computed from the z-score of the €/dose distribution. It is a "how expensive is this" badge, not a quality judgement.

## Provenance (separate axis — deliberately NOT in the health score)
We flag each product's **country of manufacture** and a zone: 🇫🇷 made in France · 🇪🇺 EU/EEA · 🌍 outside the EU. n3gh has a French-market focus, so we attach a small **proximity malus** (0 for France, 1 for EU, 3 for extra-EU). **This malus is shown separately and is not folded into the Health & Compo Score** — a clean German product is not "less healthy" than a French one, and mixing sovereignty preference into a health metric would undermine its credibility. Displaying both lets a user weigh health and provenance for themselves.

## Known limitations (v1.2)
Scores rely on label data and public documents, not independent lab work; per-flavour variations exist; the auto-tagger is keyword-based and fails safe to *review* on unusual strings; form and dose tiers compress live scientific debate into single numbers; sweetener science in particular is still evolving. Corrections and pull requests to the scoring rules are welcome — that is the point of an open method.

## Personalised dosing — "dosage vs your needs" (model v2)

An optional profile (weight, age, sex, activity; height optional) turns every product's
label dose into an answer to *"is this right for me?"*. **It never touches the Health &
Compo Score** — two people looking at the same product see the same grade.

### Two questions, deliberately kept apart

The model answers them separately, because conflating them is how a dosage checker
becomes noise:

1. **Is it in your effective band?** — a personalised `lo–hi` range, built from your
   profile where the evidence supports scaling.
2. **Does it breach a regulatory limit?** — an `ul`, identical for everyone. A matter of
   law and safety, not preference.

| State | Meaning | Colour |
|---|---|---|
| **✓ fits you** | inside your personalised band | green |
| **↓ under-dosed for you** | below the band — the label serving won't get you there | amber |
| **↑ more than you need** | above your band, **within every regulatory limit** — safe, just more than you need; a cost question | neutral |
| **⚠ over the *n* limit** | breaches a statutory upper limit | red |

Only the last state is red. Earlier versions painted *any* dose above the optimal band in
red, which flagged 10 of 11 vitamin C products and 8 of 11 zinc products as if they were
dangerous when none breached any limit — the same false-alarm inflation the additive
penalties are explicitly designed to avoid.

### Upper limits, and what they actually mean

A UL breach is reported with its **consequence**, because ULs are not all the same kind of
thing. Proportionate wording matters as much here as it does for sweeteners (§2a):

| Nutrient | Limit | What the limit is actually about |
|---|---|---|
| Vitamin D3 | 4000 IU/day (EFSA) | genuine toxicity ceiling — hypercalcaemia |
| Zinc | 25 mg/day (EFSA) | competes with copper absorption |
| Magnesium | 250 mg/day supplemental (EFSA) | **gut tolerance** (osmotic diarrhoea), not toxicity; applies to supplements, not food |
| Vitamin C | 1000 mg/day (ANSES advisory) | gut tolerance, not toxicity |
| Melatonin | 1.9 mg (French ceiling) | regulatory: above it the product is a medicine, not a supplement |
| Omega-3 | 5000 mg EPA+DHA (EFSA: no concern below) | rarely reached by any product |

13 of 19 magnesium products in the catalogue exceed the 250 mg supplemental UL — mostly
well-tolerated chelates dosed there on purpose. The product says so rather than implying harm.

### What we personalise, and what we honestly don't

Scaling is applied **only where the literature scales**. Where it doesn't, the band is the
same for everyone and the interface says so out loud instead of inventing a number.

| Category | Personalised by | Reference |
|---|---|---|
| Whey / protein | weight, activity, age | 0.83 g/kg (sedentary RDA) → 1.4–2.2 g/kg ([ISSN](https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8), [Morton 2018](https://bjsm.bmj.com/content/52/6/376)); floor 1.0–1.2 g/kg at 65+ (ESPEN / PROT-AGE) |
| Vitamin D3 | age, BMI | 800–2000 IU; floor 1000 at 65+; up to 4000 at BMI ≥ 30 ([Endocrine Society](https://academic.oup.com/jcem/article/96/7/1911/2833671)) |
| Magnesium | weight, sex | total need ~6 mg/kg capped at the ANSES PRI (360 F / 420 M); supplement fills ~25–60% of it |
| Zinc | sex, activity | EFSA PRI 8/11 mg (F/M), +7–10 mg for heavy training, capped at UL 25 |
| Omega-3 | activity | 250 mg EFSA adequate intake → 1–2 g when very active (ISSN) |
| Vitamin C | age, activity | ANSES PRI 110 mg (120 at 65+), ~200 mg in heavy training |
| Creatine | weight **above ~100 kg only** | ISSN maintenance is a **flat 3–5 g/day**; heavier bodies to ~0.05 g/kg |
| Collagen | activity only | trials dose 5–15 g as **absolute** amounts — the literature does not scale by body weight |
| Probiotics | **not personalised** | effect is strain-specific and not dose-linear; studied range ~1–50 bn CFU; no weight/sex/age scaling established |
| Melatonin | **not personalised** | 0.5–1.9 mg regardless of body size; a note flags that endogenous melatonin declines past 55 |
| Multivitamin | **no single target exists** | 20+ nutrients each with their own target; we say so and point to the single-nutrient categories rather than fake one number |

A previous version scaled creatine as `0.04 g/kg` capped at 3–5 g, which collapsed the band
to `3–3 g` for anyone under ~85 kg and flagged a standard scoop as "above target" until
125 kg. Flat 3–5 g is what ISSN actually says.

The verdict is general guidance for healthy adults — **not medical advice**, and no
substitute for blood work or a professional.

## Stacking — "my stack" (p2, beta)

Users can add any products to a persistent stack. The engine sums the **combined daily
intake per nutrient** — including declared built-in secondary actives, coded in the data
as `secondary_actives` (e.g. WHC UnoCardio and both NORSAN oils carry 800–1000 IU of
vitamin D3 per daily dose on top of their omega-3) — and checks every total twice:

1. **against the regulatory limits** (`LIMITS` table) — profile-independent, works for
   every visitor: two 300 mg magnesium products total 600 mg against the 250 mg
   supplemental UL, and each breach is reported with its consequence;
2. **against the user's personal bands** when a profile is set, plus a "not covered"
   list restricted to nutrients with official reference intakes (D3, magnesium, omega-3,
   zinc, vitamin C — everything else is goal-dependent and is not suggested), each with
   a best-scoring and a cheapest fitting product.

**Multivitamins, per nutrient.** Each multivitamin carries a `nutrients` map of what it
contributes per daily dose for the four nutrients with a regulatory ceiling (vitamin D3,
zinc, magnesium, vitamin C). A key present means coded, `0` means confirmed absent, a
missing key means unknown. The stack sums every coded nutrient in full and names only the
uncoded ones, so partial coding still yields real totals. Today: 2 of 18 complete, 12
partial (mostly vitamin D, the nutrient most often doubled up), 4 uncoded.

**Price context.** A product may carry one coarse derived fact about its price: that the
shown figure is a list price the brand structurally discounts, or that the snapshot was
captured during a promotion and therefore flatters the value ranking, or that pricing is
stable. It is a single field, never a series — the daily archive that produces it stays
private and nothing about its history is reconstructible from what is published.

**Honest boundaries.** Multivitamins whose labels are not yet coded are named individually rather than caveating every multivitamin, and any
stack containing one displays its totals as *lower bounds* and says so — coding those
labels is the next data milestone. A product whose *name* declares an extra active we
have not coded (e.g. a collagen "+ Vitamine C") is flagged as uncounted rather than
silently ignored — the same fail-visible rule as unrecognised ingredients. Secondary
actives are only coded where the manufacturer declares the amount; nothing is estimated.

---

## 5. Botanicals, and the evidence page (v1.4)

**Botanicals are scored on the same method and shown apart.** Ashwagandha, maca, rhodiola and curcumin are plant extracts with pharmacological effects, not nutrients: there is no amount the body needs, no EFSA upper limit, and no authorised health claim for any of them (botanical claims are on hold under Reg. 1924/2006). They appear in light purple on the comparator so nobody mistakes an extract for a vitamin, and they go through exactly the same composition, purity, transparency and review gate as everything else — a plant extract is still a label with a form, a dose and an additives list.

**Form tier (0–20) for a botanical means: is this the material the trials used?** Standardisation is not marketing here; it is the only way a shelf product and a trial share anything beyond a name.

| Category | 20 | lower tiers |
|---|---|---|
| Ashwagandha | branded root extract with standardised withanolides (KSM-66, Sensoril) | 17 standardised ≥2.5 % · 14 unstandardised extract · **12 standardised below 2.5 %**, or branded but root-and-leaf (Shoden) · 10 whole root powder · **8 contains leaf, unbranded** — regulators retain the root alone (withaferin A) |
| Maca | — | 18 gelatinised or concentrated · 16 coloured ecotype · 14 raw powder |
| Rhodiola | double-standardised, rosavins + salidroside | 16 single marker · 12 unstandardised extract · 8 root powder |
| Curcumin | enhanced-absorption formulation with its own trials (Meriva, BCM-95, Longvida, Turmipure…) | 16 95% + piperine · 12 plain 95% · 6 turmeric powder |

**Dose tier (0–20) is the range the trials on the evidence page actually used**, not a serving suggestion: ashwagandha 300–600 mg/day (20 at ≥600; penalised above 1,200 because safety scales with dose and benefit does not), maca 1.5–3 g/day powder-equivalent, rhodiola 200–600 mg/day, curcumin 1,000–1,500 mg/day curcuminoids for a plain extract or 250–500 mg for an enhanced-absorption form.

**Safety is handled as a prominent advisory, not a red card.** Denmark banned ashwagandha in 2023 and ANSES advised against it for several groups in 2024, but neither is one of the three bodies in the red-card rule (§2b), so the product is not forced to zero. Instead the advisory is printed on the dosing note and on the evidence page where the dose would otherwise be. Curcumin carries a liver-injury case history with concentrated forms and is annotated the same way. Being scrupulous about the rule matters here: expanding "red card" by analogy would make it mean whatever we felt like that day.

### 5b. Vitamins batch and testosterone boosters (v1.5)

**Five more nutrient categories** — vitamin B12, vitamin K2, B-complex, biotin and folate (B9) — join the nutrient group. Vitamins E and A are covered on the evidence page (SELECT; ATBC/CARET) but not as product categories: nothing is sold standalone on the tracked shops, and the large trials argue against buying them anyway.

For a vitamin, *form* is the chemical species, and the honest ladder is flatter than the marketing: every cobalamin corrects a B12 deficiency and cyanocobalamin is the form the trials used, so "methyl" and "liposomal" earn no premium; the neural-tube-defect evidence is for **folic acid**, so it outranks methylfolate rather than the reverse; MK-7 outranks MK-4 because supplement-sized MK-4 doses are far below the 45 mg the Japanese bone trials used. **Biotin's dose ladder points downward on purpose**: nothing above the 40 µg reference intake has evidence in healthy people, and from ~1 mg the FDA-documented interference with troponin and thyroid assays becomes the dominant fact about the product. A 10,000 µg "hair" capsule scores 8/20 for dose, and the watch-out says why.

**Testosterone boosters get a third colour, teal.** Tribulus and fenugreek are scored on the same method — form is "the extract the trials used", dose is "the range the trials used" — which is exactly why they land low. No tribulus dose has raised testosterone in men in any controlled trial, so its dose tier is a flat 8/20 with a note saying so; fenugreek's 500–600 mg band reflects four small, mostly manufacturer-linked trials that moved a blood value and showed nothing a person feels. The evidence page grades the wider group — D-aspartic acid, turkesterone, ZMA, boron, DHEA — and most of it is D. The colour exists so that a reader sees that verdict before the price. **ZMA** (zinc + magnesium + B6) is the third booster category: its active is the zinc — the only component with a testosterone claim, and only in deficiency — scored on a zinc-salt ladder (monomethionine and bisglycinate chelates above aspartate, above oxide) and on a dose band that stops at the 25 mg EFSA ceiling. The one positive ZMA trial used 30 mg, above that ceiling, and was funded by the patent holder; the independent replication found nothing. Magnesium and melatonin, where a label adds them, are coded as secondary actives so the stack builder counts them.

B-complex products are scored like multivitamins (form quality and dose style per entry), since a per-nutrient ladder for eight vitamins in one capsule would be false precision.

### 5c. Minerals: iron and potassium (v1.6)

**Iron** (13 products). EFSA (2024) could not set a tolerable upper intake level; it set a *safe level of intake* of 40 mg/day of iron from all sources, derived from trials where 20–25 mg/day of supplemental iron on top of food caused no black stools — a cautious marker, not a toxicity threshold ([EFSA Journal 2024;22:8819](https://doi.org/10.2903/j.efsa.2024.8819)). The form ladder ranks the **iron salt**: ferrous bisglycinate and ferrous sulfate 20 (the best head-to-head evidence, and the reference form of the fatigue and dosing trials), fumarate 18, gluconate 16, iron-enriched koji, "liposomal" and sucrosomial iron 12 (no adult head-to-head absorption data; a liposome around bisglycinate is scored as bisglycinate), ferric pyrophosphate 10, undeclared 8. The dose ladder gives 20 to 14–25 mg/day (at or above the 14 mg NRV, within the supplemental amount behind EFSA's safe level), 14 to 5–14 mg and to 25–40 mg, 10 above 40 mg, 6 above 65 mg. Treatment doses (60–100 mg) correct a proven deficiency in trials; they belong with a blood test and a doctor, so they score lower here. Every iron product carries the same warning: without menstrual losses iron accumulates, so men and post-menopausal women should test first; and iron is a leading cause of serious accidental poisoning in young children.

**Potassium** (5 products). EFSA has set no upper limit. The dose band is the range of the pooled blood-pressure trials, which begin at 30 mmol (~1,170 mg) a day and whose benefit reverses at high intakes (Filippini, *J Am Heart Assoc* 2020), capped at the 3,000 mg adult maximum of the draft French update approved by ANSES in 2024. **The French maximum actually in force is 80 mg/day** (arrêté du 9 mai 2006, Annex III): a regulatory ceiling, not a toxicity threshold. As with melatonin above its 1.9 mg ceiling, a product above it keeps a capped dose tier (14 instead of 20) and says so on its card rather than being zeroed; four of the five products exceed it. Salts: chloride 20 (the form of most blood-pressure trials), citrate 18, bicarbonate and gluconate 16. Each product also carries the hyperkalaemia warning for kidney disease and for ACE inhibitors, ARBs, spironolactone and potassium-sparing diuretics.

Calcium, iodine, selenium and chromium are wired into the classifier and the site but have no published products yet: each needs its form and dose ladder verified before a single product is scored.

### 5a. The evidence page — grades are per outcome, not per supplement

[`/compare/evidence/`](evidence/) lists what supplements do by **need** — sleep, stress, muscle, bone, heart, immunity, memory, joints, skin, gut, energy, libido. Each row is one supplement for one need, graded on the trials behind that pairing:

| Grade | Meaning |
|---|---|
| **A** strong | several large RCTs or meta-analyses totalling >~1,000 participants, consistent direction, effect large enough to notice |
| **B** moderate | meta-analyses of smaller trials or a few hundred to ~1,000 participants; consistent but modest — or strong only in a defined group (e.g. the deficient) |
| **C** limited | few or small trials, low-certainty grading, inconsistent, or high risk of bias including manufacturer funding |
| **D** not supported | null in large trials for that outcome, or only observational/animal data |

A grade is never a verdict on a molecule: creatine is A for muscle and C for memory; the same fish oil is B for triglycerides and C for cardiovascular events. Every figure cites its source with the participant count, and the dataset is one readable file (`evidence/evidence.js`) so any grade can be challenged by pointing at a better study.

**The EFSA line is deliberately separate from the trial evidence.** An EFSA authorised claim is regulator-approved *wording* about a nutrient's physiological role — "magnesium contributes to normal psychological function" — and is not a trial showing an outcome improved. Both are shown, side by side, precisely so that the authorised sentence and the low-certainty sleep trials for the same nutrient cannot be confused for one another.
