// n3gh. — UI translations (en / fr). Hand-written, not machine-translated.
//
// Language is chosen from the browser's own stated preference (navigator.language),
// never from IP geolocation: geolocation needs a third-party lookup (an external
// request carrying the visitor's IP, which this site refuses to make), and it
// answers the wrong question anyway — a French speaker in London wants French.
// A manual toggle always wins and is remembered in localStorage.
//
// Scope: this file covers the INTERFACE. Product-level editorial fields in the
// dataset (notes, flags, form_note, price_note) stay in the language they were
// authored in — translating the catalogue is a data task, not a UI one.

const I18N = {

/* ===================== ENGLISH ===================== */
en: {
  htmlLang: "en",
  langName: "EN",
  langSwitchTitle: "Afficher en français",
  metaDesc: "Independent supplement comparator: an evidence-based Health & Compo Score (A–E), price per gram of actual active, and a personalised dosage check for 257 EU/French products across 25 categories — vitamins, minerals, proteins, botanicals and testosterone boosters scored apart. No sponsors, no affiliate links.",

  crumb: "/ p1 · compare",
  navEvidence: "evidence", navMethodology: "methodology",
  navAbout: "about",

  heroSub: `Compare ingredients, scores and price per active. No sponsors or affiliate links.`,

  statProducts: "products scored",
  statCategories: "categories",
  statRegion: "market scope",
  statSnapshot: "catalogue edition",
  statOpen: "open data &amp; method",

  profileTitle: "individual profile", profileOptional: "optional", profileActive: "active", stackOptional: "optional",
  pWeight: "weight (kg)", pHeight: "height (cm)", pHeightPlaceholder: "optional",
  pSex: "sex", pMale: "male", pFemale: "female",
  pAge: "age", pActivity: "activity",
  pSedentary: "sedentary", pActive: "active", pAthlete: "athlete",
  pApply: "apply", pClear: "clear",
  pStatusNone: "no profile — every product shows its dose, none is checked against you",
  pStatusOn: (w,h,a,s,ac) => `profile active — ${w} kg${h?" · "+h+" cm":""} · ${a} y · ${s} · ${ac} · every dose below is now checked against your targets`,
  pHint: `optional — personalises the "dosage vs your needs" line on every product. Weight and age are required; height only sharpens the vitamin&nbsp;D target (via BMI). Healthy adults; evidence-based ranges, EU upper limits respected; not medical advice.`,
  pAlertRequired: "Weight and age are required. Height is optional (it only sharpens the vitamin D target).",

  searchPlaceholder: "search brand or product…",
  fitPill: "fits me",
  fitPillTitle: "show only products whose daily dose lands in your personal target band",
  stackBtn: n => `my stack (${n})`,
  stackBtnTitle: "everything you'd take per day, summed nutrient by nutrient and checked against the EU limits — and your bands, with a profile",
  sortScore: "sort: best score", sortFit: "sort: best fit for me",
  sortValue: "sort: best value (€ / active)", sortPrice: "sort: price, low → high",
  sortBrand: "sort: brand a–z",

  cats: {all:"all", whey:"whey", creatine:"creatine", vitamin_d3:"vitamin d3", magnesium:"magnesium",
    omega3:"omega-3", multivitamin:"multivitamin", zinc:"zinc", vitamin_c:"vitamin c",
    collagen:"collagen", probiotics:"probiotics", melatonin:"melatonin",
    ashwagandha:"ashwagandha", maca:"maca", rhodiola:"rhodiola", curcumin:"curcumin",
    vitamin_d2:"vitamin D2", vitamin_b1:"vitamin B1", vitamin_b2:"vitamin B2", vitamin_b3:"vitamin B3", vitamin_b5:"vitamin B5", vitamin_b6:"vitamin B6",
    vitamin_b12:"vitamin B12", vitamin_k2:"vitamin K2", b_complex:"B complex", biotin:"biotin", folate:"folate (B9)",
    tribulus:"tribulus", fenugreek:"fenugreek", zma:"ZMA",
    vitamin_e:"vitamin E", iron:"iron", calcium:"calcium", iodine:"iodine", selenium:"selenium", chromium:"chromium", potassium:"potassium"},

  units: {whey:"g protein", creatine:"g creatine", vitamin_d3:"IU vitamin D3",
    magnesium:"mg elemental Mg", omega3:"mg EPA+DHA", zinc:"mg zinc", vitamin_c:"mg vitamin C",
    collagen:"g peptides", probiotics:"billion CFU", melatonin:"mg melatonin",
    ashwagandha:"mg root extract", maca:"mg maca", rhodiola:"mg extract", curcumin:"mg curcuminoids",
    vitamin_b12:"µg B12", vitamin_k2:"µg MK-7", biotin:"µg biotin", folate:"µg folate", tribulus:"mg extract", fenugreek:"mg extract", zma:"mg zinc",
    vitamin_e:"mg vitamin E", iron:"mg iron", calcium:"mg calcium", iodine:"µg iodine", selenium:"µg selenium", chromium:"µg chromium", potassium:"mg potassium"},
  nutrientUnits: {vitamin_d2:"IU D2", vitamin_d3:"IU D3", vitamin_b1:"mg", vitamin_b2:"mg", vitamin_b3:"mg", vitamin_b5:"mg", vitamin_b6:"mg", vitamin_b12:"µg", biotin:"µg", folate:"µg"},
  stackUnits: {whey:"g protein (per serving)", creatine:"g creatine", vitamin_d3:"IU vitamin D (D2 + D3)",
    magnesium:"mg elemental Mg", omega3:"mg EPA+DHA", zinc:"mg zinc", vitamin_c:"mg vitamin C",
    collagen:"g collagen peptides", probiotics:"billion CFU", melatonin:"mg melatonin",
    ashwagandha:"mg ashwagandha extract", maca:"mg maca", rhodiola:"mg rhodiola extract", curcumin:"mg curcuminoids",
    vitamin_b12:"µg vitamin B12", vitamin_k2:"µg vitamin K2 (MK-7)", biotin:"µg biotin", folate:"µg folate", tribulus:"mg tribulus extract", fenugreek:"mg fenugreek extract", zma:"mg zinc",
    vitamin_e:"mg vitamin E (alpha-tocopherol)", iron:"mg elemental iron", calcium:"mg elemental calcium", iodine:"µg iodine", selenium:"µg selenium", chromium:"µg chromium", potassium:"mg elemental potassium"},

  actives: {
    whey: p => `${p.active_per_100g} g protein / 100 g · ${p.active_per_serving_g} g per ${p.serving_g} g serving`,
    creatine: p => `${p.active_per_serving_g} g creatine per ${p.serving_g} g serving · ${p.active_per_100g} g / 100 g`,
    vitamin_d3: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("en")} IU / day (${p.units_per_day} × ${p.unit_name})`,
    magnesium: p => `${p.active_per_unit*p.units_per_day} mg elemental Mg / day (${p.units_per_day} × ${p.unit_name})`,
    omega3: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("en")} mg EPA+DHA / day (${p.units_per_day} × ${p.unit_name})`,
    zinc: p => `${p.active_per_unit*p.units_per_day} mg elemental Zn / day (${p.units_per_day} × ${p.unit_name})`,
    vitamin_c: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("en")} mg vitamin C / day (${p.units_per_day} × ${p.unit_name})`,
    collagenPowder: p => `${p.active_per_serving_g} g collagen per ${p.serving_g} g serving`,
    collagenCaps: p => `${(p.active_per_unit*p.units_per_day).toFixed(2)} g collagen / day (${p.units_per_day} × ${p.unit_name})`,
    probiotics: p => `${p.active_per_unit*p.units_per_day} billion CFU / day (${p.units_per_day} × ${p.unit_name})`,
    melatonin: p => `${p.active_per_unit*p.units_per_day} mg melatonin / day (${p.units_per_day} × ${p.unit_name})`,
    ashwagandha: p => `${p.active_per_unit*p.units_per_day} mg root extract / day (${p.units_per_day} × ${p.unit_name})`,
    maca: p => `${(p.active_per_unit*p.units_per_day*(p.extract_ratio||1)).toLocaleString("en")} mg maca (powder-equivalent) / day (${p.units_per_day} × ${p.unit_name})`,
    rhodiola: p => `${p.active_per_unit*p.units_per_day} mg extract / day (${p.units_per_day} × ${p.unit_name})`,
    curcumin: p => `${p.active_per_unit*p.units_per_day} mg curcuminoids / day (${p.units_per_day} × ${p.unit_name})`,
    vitamin_b12: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("en")} µg B12 / day (${p.units_per_day} × ${p.unit_name})`,
    vitamin_k2: p => `${p.active_per_unit*p.units_per_day} µg MK-7 / day (${p.units_per_day} × ${p.unit_name})`,
    biotin: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("en")} µg biotin / day (${p.units_per_day} × ${p.unit_name})`,
    folate: p => `${p.active_per_unit*p.units_per_day} µg folate / day (${p.units_per_day} × ${p.unit_name})`,
    b_complex: p => `${p.units_per_day} × ${p.unit_name} / day — B-vitamin complex`,
    tribulus: p => `${p.active_per_unit*p.units_per_day} mg tribulus / day (${p.units_per_day} × ${p.unit_name})`,
    fenugreek: p => `${p.active_per_unit*p.units_per_day} mg fenugreek extract / day (${p.units_per_day} × ${p.unit_name})`,
    zma: p => `${p.active_per_unit*p.units_per_day} mg zinc / day (${p.units_per_day} × ${p.unit_name}) — with magnesium and B6`,
    vitamin_e: p => `${+(p.active_per_unit*p.units_per_day).toFixed(1)} mg vitamin E / day (${p.units_per_day} × ${p.unit_name})`,
    iron: p => `${+(p.active_per_unit*p.units_per_day).toFixed(1)} mg elemental iron / day (${p.units_per_day} × ${p.unit_name})`,
    calcium: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("en")} mg elemental calcium / day (${p.units_per_day} × ${p.unit_name})`,
    iodine: p => `${p.active_per_unit*p.units_per_day} µg iodine / day (${p.units_per_day} × ${p.unit_name})`,
    selenium: p => `${p.active_per_unit*p.units_per_day} µg selenium / day (${p.units_per_day} × ${p.unit_name})`,
    chromium: p => `${p.active_per_unit*p.units_per_day} µg chromium / day (${p.units_per_day} × ${p.unit_name})`,
    potassium: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("en")} mg elemental potassium / day (${p.units_per_day} × ${p.unit_name})`,
    fallback: p => `${p.units_per_day} ${p.unit_name}s / day`
  },

  ulWhy: {
    folate: "the EFSA upper limit for supplemental folic acid — 1,000 µg/day. Above it, folate can correct the anaemia of a B12 deficiency while the nerve damage continues unseen",
    vitamin_d3: "sustained intake above the UL risks hypercalcaemia — this is a genuine toxicity ceiling",
    magnesium: "EFSA set this limit on gut tolerance (osmotic diarrhoea), not toxicity, and it covers supplements only — not magnesium from food. Well-tolerated chelates are often dosed above it deliberately",
    zinc: "sustained intake above the UL competes with copper absorption",
    vitamin_c: "an ANSES advisory ceiling on gut tolerance, not a toxicity threshold",
    melatonin: "a French regulatory ceiling for food supplements, not a toxicity threshold — above it the product is a medicine, not a supplement",
    omega3: "EFSA finds supplemental EPA+DHA up to 5000 mg/day raises no safety concern"
  },

  scaledBy: {
    wheyAll: "weight, activity and age", creatineWeight: "weight (above 100 kg)",
    d3: "age and BMI", magnesium: "weight and sex", omega3: "activity",
    zinc: "sex and activity", vitaminC: "age and activity", collagen: "activity only",
    melatoninAge: "age (note only)"
  },

  notes: {
    whey: (lo,hi,w,ac,old) => `${lo}–${hi} g/kg/day for a ${w} kg ${ac} adult${old?" aged 65+ (ESPEN)":" (ISSN / Morton 2018)"} — this is your TOTAL diet target; a supplement only tops up food`,
    creatine: (hi,w) => `ISSN maintenance is a flat 3–5 g/day; heavier or heavily-training bodies sit at the top (~0.05 g/kg → ${hi} g at ${w} kg). No EU upper limit is set`,
    d3Bmi: bmi => `BMI ${bmi} — sequestration in adipose tissue raises the requirement (Endocrine Society); EFSA UL 4000 IU/day`,
    d3Old: "floor raised for 65+ (skin synthesis falls with age); EFSA UL 4000 IU/day",
    d3NoHeight: "add your height to refine this — BMI ≥ 30 raises the target; EFSA UL 4000 IU/day",
    d3Plain: "EFSA UL 4000 IU/day",
    magnesium: (ai,sexPri,lo,hi) => `your total need ≈ ${ai} mg/day (~6 mg/kg, capped at the ${sexPri} mg PRI, ANSES); diet covers most, so a supplement should fill ${lo}–${hi} mg. EFSA UL for supplements is 250 mg/day`,
    magnesiumPriM: "male 420", magnesiumPriF: "female 360",
    omega3: ac => `EFSA adequate intake is 250 mg/day; ${ac} adults benefit from more (ISSN). EFSA finds supplemental intakes up to 5000 mg/day raise no safety concern, so a higher dose is a cost question, not a safety one`,
    zinc: (base,men,athlete) => `EFSA PRI is ${base} mg/day for ${men}${athlete?"; sweat and training losses raise it":""}. The EFSA UL is 25 mg/day — sustained intake above that impairs copper absorption`,
    zincMen: "men", zincWomen: "women",
    vitaminC: (lo,athlete) => `ANSES PRI is ${lo} mg/day${athlete?"; heavy training raises turnover to ~200 mg":""}. Above that there is no established added benefit, but no harm either — ANSES advises staying at or below 1000 mg/day from supplements`,
    collagen: "clinical trials use 5 g (skin) to 15 g (joints, tendon loading) as absolute doses — collagen peptide research does not scale by body weight, so this band moves with your activity only",
    ashwagandha: "300–600 mg/day of standardised root extract is what the stress and sleep trials used. Not a nutrient: no reference intake, no EFSA limit — and two European agencies advise against it for thyroid, liver or heart conditions, pregnancy, sedative use and under-18s. Read the evidence page before the dose",
    maca: "trials used 1.5–3 g/day of powder (or its extract equivalent) for 6–12 weeks. Evidence is limited; the band is the studied range, not a proven effective dose",
    rhodiola: "200–600 mg/day of extract standardised to rosavins and salidroside — anything unstandardised shares only a name with the trials",
    vitamin_b12: "25–1,000 µg/day: the reference intake is 4 µg, but only ~1 % is absorbed passively at high doses, so a vegan needs 50–100 µg/day or ~2,000 µg once a week. No EFSA upper limit. Cyanocobalamin and methylcobalamin both work; the cheap one is fine",
    vitamin_k2: "90–200 µg/day of MK-7 is the range the bone-density trials used; 375 µg was the top. No EFSA upper limit — but anyone on a vitamin-K antagonist (warfarin, fluindione) must not take this without their prescriber",
    biotin: "40 µg/day covers the reference intake and there is no trial showing any benefit above it in healthy people. Hair products sell 5,000–10,000 µg: no evidence, and from ~1,000 µg it falsifies troponin and thyroid blood tests (FDA warning). Here, more is worse",
    folate: "400 µg/day is the periconceptional dose that cuts neural-tube defects by ~70 %; 200 µg is the adult reference intake. 1,000 µg/day is the EFSA limit for folic acid — above it a B12 deficiency can go unnoticed",
    tribulus: "there is no band to show: no tribulus dose has raised testosterone in men in any controlled trial. Read the evidence page before buying",
    fenugreek: "500–600 mg/day of standardised seed extract is what the four small, mostly manufacturer-linked testosterone trials used. A blood value moved; nothing a person feels has been shown to",
    zma: "the band is the zinc band — 10–25 mg/day, the 25 mg being the EFSA ceiling. The one positive ZMA trial (30 mg zinc, 450 mg magnesium, 10.5 mg B6) was funded by the patent holder; the independent replication found no change in testosterone, strength or body composition. If you are not short of zinc, more of it does nothing to testosterone",
    curcumin: "plain 95% extract needs ~1,000–1,500 mg/day of curcuminoids to reach the osteoarthritis-trial doses; enhanced-absorption forms use 250–500 mg. Concentrated curcumin has a liver-injury case history — treat it as a drug, not a spice",
    probiotics: "studied doses span roughly 1–50 billion CFU and the effect is strain-specific, not dose-linear — more CFU is not inherently better. No body-weight, sex or age scaling is established, so this band is the same for everyone",
    melatonin: old => "EFSA allows the sleep-onset claim from 1 mg (0.5 mg for jet lag); 1.9 mg is the French regulatory ceiling for a food supplement"
      + (old ? ". Endogenous melatonin declines past 55, where supplementation tends to help most" : ". No body-weight scaling is established")
  },

  fit: {
    wheyLabel: (d,pct,lo,hi) => `1 serving = ${d} g protein ≈ ${pct}% of your ${lo} g/day minimum (your total-diet target is ${lo}–${hi} g — food does most of it)`,
    wheyChip: pct => `≈${pct}% of your daily protein`,
    overLabel: (d,unit,ul,lo,hi) => `${d} ${unit} per day — above the ${ul} regulatory limit for supplements (your effective band is ${lo}–${hi})`,
    overWhat: why => `. What that means: ${why}`,
    overChip: ul => `⚠ over the ${ul} limit`,
    lowLabel: (d,unit,lo,hi) => `${d} ${unit} per day — below your ${lo}–${hi} target; you would need more than the label serving`,
    lowChip: "↓ under-dosed for you",
    highLabel: (d,unit,lo,hi) => `${d} ${unit} per day — above your ${lo}–${hi} optimal band but within every regulatory limit: safe, just more than you need`,
    highChip: "↑ more than you need",
    okLabel: (d,unit,lo,hi) => `${d} ${unit} per day — inside your ${lo}–${hi} target`,
    okChip: "✓ fits you"
  },

  barYourBand: (lo,hi) => `your band ${lo}–${hi}`,
  barEuLimit: ul => `EU limit ${ul}`,
  barNoLimit: "no EU limit set",

  stack: {
    remove: "Remove",
    title: "my stack",
    empty: profile => `Empty. Add products with the <b>+ stack</b> button on any card — mix categories freely. The stack sums what you would actually swallow per day, nutrient by nutrient, checks the recorded amounts against available limits${profile ? " and your personal bands" : ""}, and catches overlaps: an omega-3 with built-in vitamin D counts toward your vitamin-D total.`,
    emptyNoProfile: "The limit checks work without a profile; fill one in (top of the page) to also see your personal target bands here.",
    products: n => `${n} product${n>1?"s":""}`,
    perDay: "per day, all together", perMonth: "per month (~30 days)",
    combined: profile => `combined daily intake${profile ? " vs your targets" : " vs EU limits"}`,
    nothing: "Nothing to sum yet.",
    total: "total",
    overChip: ul => `⚠ over the ${ul} limit`,
    overNote: (total,unit,ul,why) => `combined ${total} ${unit} exceeds the ${ul} regulatory limit for supplements. ${why}.`,
    inBand: "✓ in your band", belowBand: "↓ below your band", aboveBand: "↑ more than you need",
    withinLimit: ul => `within the ${ul} limit`,
    wheyNote: (pct,lo) => `≈ ${pct}% of your ${lo} g/day minimum — one serving of each shake, food does the rest.`,
    from: "from:", builtIn: "(built-in)", fromMulti: "(multi / B complex)", vitaminDTotal: "vitamin D · D2 + D3",
    multiWarn: names => `⚑ Missing amounts, <b>not counted above</b>: ${names}. Totals cover only the nutrients shown and coded label amounts. Other nutrients and unrecorded amounts may be missing.`,
    mentionWarn: list => `⚑ declared but not yet coded: ${list} — not counted in the totals above.`,
    mentions: (brand,name,cat) => `${brand} ${name} mentions <b>${cat}</b>`,
    notCovered: "not covered by this stack",
    notCoveredIntro: hasMulti => `A varied diet may already cover these — nothing here is a prompt to buy more.${hasMulti ? " Your multivitamin likely covers part of them too." : ""} If you do want to cover one:`,
    bestForYou: "best for you:", cheapestFit: "cheapest fit:",
    profileHint: "Fill in your profile (top of the page) to see the totals against your personal bands and what this stack doesn't cover.",
    footnote: "Only recorded supplement amounts are included; food intake is additional. Multi/B-complex totals cover vitamin D, magnesium, zinc, vitamin C and folate when coded. Checks apply only to the limits implemented here and do not establish overall safety or suitability.",
    alertMax: "Stack up to 12 products."
  },


  priceCtx: {
    listChip: r => `usually −${r[0]}–${r[1]}%`,
    listTitle: "the price shown is the list price — this brand runs near-permanent promotions, so you normally pay less",
    listLong: r => `The price above is the list price. This brand discounts structurally, so the effective price is typically ${r[0]}–${r[1]}% lower — which also makes the € / active figure above a worst case.`,
    promoChip: "⚠ captured on promo",
    promoTitle: "this price was captured during a promotion — it is lower than the usual price, so the value ranking flatters this product",
    promoLong: (pct, normal) => `This price was captured during a promotion${pct?` (−${pct}%)`:""}${normal?`, against a normal price of ${normal}`:""}. The € / active and price-level figures above are therefore better than this product usually offers.`,
    stableLong: "No recurring promotion pattern recorded. Check the current price on the merchant’s page."
  },
  contribute: {
    line: url => `Spotted something wrong — a price, a dose, an ingredient? <a href="${url}" target="_blank" rel="noopener">Open a correction</a>. The dataset and the scoring script are public; corrections arrive as auditable changes, and the fix applies to every product equally.`,
    btnReview: "Challenge this ruling ↗",
    titleReview: (b,n) => `[data] challenge an ingredient ruling — ${b} ${n}`,
    titleFix: (b,n) => `[data] correction — ${b} ${n}`,
    body: (p, flags) => `Product: ${p.brand} — ${p.name} (${p.variant})\nProduct id: ${p.id}\nCategory: ${p.category}\n${flags?`Unrecognised ingredient(s): ${flags}\n`:""}\n**What is wrong / what should it be?**\n\n\n**Source** (label photo, brand page, COA):\n\n`
  },
  zones: {FR:"brand origin estimate: France", EU:"brand origin estimate: EU", EXTRA_EU:"brand origin estimate: outside EU", UNKNOWN:"brand origin unconfirmed"},
  confidence: {high:"high", medium:"medium", low:"low"},
  priceLevelTitle: tier => `price level ${tier}/5 (1=cheapest per dose, 5=priciest)`,

  chipCoa: "COA published", chipThirdParty: "3rd-party tested", chipVegan: "vegan",
  chipBooster: "\"booster\"", chipBoosterTitle: "sold to raise testosterone — scored on the same method, which is why it lands where it does: the evidence page grades most of this group D",
  chipBotanical: "botanical", chipBotanicalTitle: "a plant extract, not a nutrient — no reference intake, no EFSA limit, no authorised health claim. Scored on the same method; its evidence is graded separately on the evidence page",
  chipReview: "ingredient reviewed", chipReviewTitle: "an ingredient here was unreadable by the auto-tagger and was ruled on by a human before this product was published",
  chipFlags: n => `⚠ ${n} flag${n>1?"s":""}`,

  barComposition: "composition", barPurity: "purity", barTransparency: "transparency",
  btnDetails: "details", btnCompare: "+ compare", btnCompared: "✓ added",
  btnStack: "+ stack", btnStacked: "✓ stacked",
  btnStackTitle: "add to your daily stack — combined doses are checked against the EU limits",
  btnBuy: "buy ↗", btnBuyTitle: "direct product page — n3gh has no affiliation and earns nothing",
  perDayShort: (c,d) => `${c}/day · ~${d} days`,
  confTitle: c => `data confidence: ${c}`,
  redCardBanner: subs => `🟥 red card · banned: ${subs}`,

  countPlain: (n,total) => `${n} of ${total} products`,
  countFit: (n,scope,where) => `${n} of ${scope} ${where} fit your profile`,
  countMatched: n => ` · ${n} of these match your profile`,
  countNeedsProfile: " · fit sort needs a profile (top of the page)",
  countValueWarn: " · value sort is only meaningful within a category",
  whereProducts: "products", whereCat: c => `${c} products`,
  emptyFit: "No product in this category lands in your target band. Clear the “fits me” filter to see how close the others get.",
  emptyNone: "No products match.",

  trayClear: "clear", trayGo: n => `compare (${n})`,
  alertCompareMax: "Compare up to 3 products.",
  alertCompareSame: "Compare products within the same category.",

  cmp: {
    title: "Side-by-side", score: "score", composition: "composition & efficacy",
    purity: "purity & additives", transparency: "transparency & testing", price: "price",
    costDay: "cost / day", daysPack: "days per pack", form: "form", actives: "daily actives",
    doseVsNeeds: "dose vs your needs", additives: "additives", certifications: "certifications",
    watchouts: "watch-outs", none: "None",
    footnote: snap => `Green = best of the selection. Prices were recorded on different dates; see each product’s source & verification section. Promotions can change the comparison.`
  },

  verification: {
    title: "source & verification", source: "source link", label: "label fields", price: "price / variant",
    openSource: "product source", openLabel: "label source", openPrice: "price source",
    checkedOn: date => `reviewed ${date}`, notRechecked: "not rechecked",
    accessNote: "An accessible link does not validate its label or price. A field review applies only to the scope listed below, not to the full formula, additives or certificates.",
    availability: "availability at check", availabilityStates: {InStock:"in stock at source check", OutOfStock:"out of stock at source check"},
    priceScope: "Price review scope:", scope: "Label review scope:", pending: "Still to review:", origin: "Brand location estimate:",
    originNote: "Inferred from the brand; manufacturing location for this product or batch is unconfirmed.",
    statuses: {identity_verified:"structured product identity matched", reachable_unverified:"link accessible · product details unverified", blocked:"automated access blocked", broken_source:"source page missing", unavailable:"source unavailable at check", missing_source:"no source link", unchecked:"source not checked"},
    fields: {price:"price", label:"label", additives:"additives", certifications:"certifications", coa:"batch analysis", variant:"exact variant", nutrients:"nutrient amounts"}
  },

  detail: {
    rowForm: "Form quality", rowDose: "Effective dosing", rowPurity: "Purity & additives",
    rowTransparency: "Transparency & testing",
    noAdditives: "No additives — clean label", noCerts: "No public certifications or COAs",
    rankInCat: n => `#${n} in category`,
    scoreLine: (total,conf) => `Health &amp; Compo Score <b>${total}</b> / 100 · data confidence: <b>${conf}</b>`,
    secBreakdown: "score breakdown", secPrice: "price &amp; value", secProvenance: "provenance",
    secDosage: "dosage vs your needs", secGet: "what you actually get",
    secReview: "ingredient decisions", secWatchouts: "watch-outs",
    inStore: pv => `In-store price — observed at ${pv.store}${pv.city?`, ${pv.city}`:""} on ${pv.observed_on}. One shop, one day: not a national price. Check the date before comparing.`,
    verdictLabel: v => v === "neutral" ? "benign — no penalty"
      : v.startsWith("banned:") ? "banned substance — score forced to 0"
      : `scored as ${v.split(":")[1].replace(/_/g, " ")}`,
    listPrice: "recorded price", priceLevelCell: tier => `price level ${tier}/5 in category`,
    provMalus: m => `(−${m} proximity, shown separately — not in the health score)`,
    unknown: "unknown",
    noDose: "This product's label does not state a daily dose we can check against your profile.",
    fillProfile: "Fill in your profile (top of the page) to see how this dose compares to your personal target.",
    secNutrients: "recorded nutrients",
    multiLead: "Recorded label amounts per daily serving. This table can be partial; an omitted nutrient is not a confirmed zero.",
    absent: "not in this formula", perDayWord: "day",
    multiCoded: "The stack uses the recorded amounts of vitamin D (D2 + D3), magnesium, zinc, vitamin C and folate. Other nutrients below are shown for information.",
    multiMissing: list => `Not yet coded from this label, so not counted in stack totals: ${list}.`,
    multiNote: d => `The dose score (${d}/20) is a methodological summary, not a complete assessment of each nutrient or of this product’s suitability for you.`,
    personalisedTo: s => `Personalised to your ${s}.`,
    notPersonalised: "This band is <b>not</b> personalised: no body-weight, sex or age scaling is established for this nutrient, so it is the same for everyone.",
    guidance: " Guidance for healthy adults — not medical advice.",
    builtIn: (amt,unit) => `+ built-in: ${amt} ${unit} / day — counted in your stack totals`,
    btnInStack: "✓ in your stack", btnAddStack: "+ add to my stack",
    btnBuyLong: "buy — direct product page ↗", noAffiliation: "no affiliation, n3gh earns nothing",
    reviewFlag: r => `✓ “${r.string}” — ${T("detail").verdictLabel(r.verdict)}${r.note?` · ${r.note}`:""}${r.reviewed_on?` · reviewed ${r.reviewed_on}`:""}`,
    redCardLong: subs => `🟥 red card — contains a substance banned or restricted by EU / FDA / WHO: ${subs}. Score forced to 0.`,
    footnote: v => `Scored with methodology v${v} from the public label and brand documents — not from independent lab testing. Not medical advice.`
  },

  footDisclaimer: `<b>Not medical advice.</b> Scores reflect label composition and public transparency only — not whether a supplement is right for you, and not independent lab verification of batch content. Dietary supplements are not a substitute for a varied diet. Talk to a healthcare professional before supplementing, especially if you are pregnant, on medication, or have a medical condition.`,
  footPrices: `Prices are historical catalogue observations; per-product checks appear under <b>source &amp; verification</b> — several brands (Myprotein, Bulk, Prozis) run structural promotions, so effective prices can be 30–45% lower. Data confidence is flagged per product. Found an error? The dataset and scoring script are open — please fix us.`,
  footSummary: `<b>Not medical advice.</b> Prices, licence and data rights — open the detail`,
  footRights: `© 2026 n3gh. Code <b>AGPL-3.0</b> · methodology <b>CC BY-NC-ND 4.0</b> · catalogue <b>CC BY-NC-SA 4.0</b>. This catalogue is a protected database (Dir. 96/9/EC; CPI art. L.341-1 ff.): individual facts are free to quote, extraction of a <b>substantial part</b> is reserved. Text-and-data-mining rights reserved (Dir. (EU) 2019/790 art. 4(3); CPI art. L.122-5-3) — see <a href="/.well-known/tdmrep.json">tdmrep.json</a> and <a href="/terms/">terms</a>.`,
  footMeta: "p1 · compare + p2 · stack (beta) — open method, private data · AGPL-3.0 · v1.5",
  footVersions: "methodology v1.2 · dosing model v2",

  methodology: () => `
    <h2>How the Health &amp; Compo Score works</h2>
    <p>Every product is scored 0–100 by an <b>open</b> script using only the label and public proofs, never marketing claims. The <b>method is open</b> so it can be audited; the <b>dataset and its price/label history are not published</b> — that accumulating archive is n3gh's moat. <b>Price is never part of the health score.</b></p>
    <h4>🟥 Red card</h4>
    <p>A product containing a substance banned, withdrawn or restricted by <b>any</b> of EU-EFSA, US-FDA or WHO (titanium dioxide E171, industrial trans fat, BVO, potassium bromate, Red 3, propylparaben…) is forced to <b>0 / grade E</b> — a banned additive is a disqualification, not a deduction. Strictest-guideline-wins: if one body flags it, we flag it.</p>
    <h4>Composition &amp; efficacy — 40 pts</h4>
    <p><b>Form quality (20):</b> chelated magnesium beats oxide; rTG omega-3 beats ethyl esters; Creapure® beats undocumented monohydrate; strain-coded probiotics beat un-coded. <b>Effective dosing (20):</b> daily dose vs published effective ranges and EFSA reference values, with penalties for exceeding EU upper limits.</p>
    <h4>Purity &amp; additives — 30 pts</h4>
    <p>Start at 30, subtract per additive, <b>proportionate to the health evidence</b>: fully hydrogenated fat −25, undisclosed/proprietary blend −10, BHA/BHT −10, <b>added sugar −8</b>, then sweeteners tiered by evidence (see below), azo colours −3, polyols/carriers/emulsifiers/fillers/coatings/preservatives −2 each, and a −1 band for undisclosed minor ingredients (a bare “arômes”, “support comprimé standard”) and trace acidity or raising agents. Natural sweeteners (stevia, monk fruit), carrier oils, capsule shells and natural flavours are neutral. An unrecognised ingredient is never guessed at: the product is <b>withheld from the site entirely</b> until a human rules on the string. A −2 &ldquo;provisional&rdquo; penalty would be a claim that the worst case is mild, which is exactly what we do not yet know.</p>
    <h4>Our position on sweeteners (evidence-based)</h4>
    <p>Regulators (EFSA, FDA, WHO/JECFA) uphold sweetener safety at their acceptable daily intakes. Large cohorts (NutriNet-Santé, &gt;100 000 adults) and lab studies report <i>signals</i> — not proven causation — for some. We apply mild, proportionate precaution: <b>Tier D</b> sucralose/erythritol/xylitol −6 (mechanistic/CV signal), <b>Tier C</b> aspartame/acesulfame-K −4 (cohort signal), <b>Tier B</b> saccharin/cyclamate −2, <b>Tier A</b> stevia/monk fruit 0. Crucially, <b>added sugar (−8) is penalised more than any sweetener</b>, because the evidence that sugar harms health is stronger. We do not claim "sweeteners cause cancer".</p>
    <h4>Transparency &amp; testing — 30 pts</h4>
    <table><tr><th>Published batch analyses / COAs</th><td>+12</td></tr>
    <tr><th>Recognised third-party certification (Informed Sport, Cologne List, IFOS, Sport Protect, AFNOR NF…)</th><td>+10</td></tr>
    <tr><th>Branded traceable raw ingredient (Creapure®, EPAX®, Peptan®…)</th><td>+4</td></tr>
    <tr><th>Fully quantified label, no proprietary blend</th><td>+4</td></tr></table>
    <h4>Grades</h4>
    <p><b>A</b> ≥ 80 · <b>B</b> 65–79 · <b>C</b> 50–64 · <b>D</b> 35–49 · <b>E</b> &lt; 35</p>
    <h4>Price level &amp; value (separate from the health score)</h4>
    <p><b>€ / standard dose</b> per category (€/25 g protein, €/1000 IU D3, €/10 g collagen…) plus a <b>price level 1–5</b> — a within-category affordability band (1 = cheapest per dose, 5 = priciest). A "cheap" €19 fish oil can cost more per gram of EPA+DHA than a €50 one.</p>
    <h4>Personalised dosing (separate from the health score)</h4>
    <p>If you fill in the optional profile, every product's daily dose is checked against <b>your</b> target. We keep two questions strictly apart. <b>Is it in your effective band?</b> — a personalised range built from your weight, sex, age and activity. <b>Does it breach a legal limit?</b> — the EU/ANSES upper limit, which is identical for everyone. A dose <i>above your band but below every limit</i> is safe, just more than you need: it is never shown in red. Only a genuine upper-limit breach is.</p>
    <table><tr><th>✓ fits you</th><td>inside your personalised band</td></tr>
    <tr><th>↓ under-dosed for you</th><td>below the band — the label serving would not get you there</td></tr>
    <tr><th>↑ more than you need</th><td>above the band, within every regulatory limit — a cost question, not a safety one</td></tr>
    <tr><th>⚠ over the EU limit</th><td>breaches a statutory upper limit (vitamin D 4000 IU, zinc 25 mg, supplemental magnesium 250 mg, melatonin 1.9 mg…)</td></tr></table>
    <p><b>We only personalise what the evidence lets us.</b> Protein scales with body weight and activity (ISSN / Morton 2018, ESPEN past 65); magnesium with weight and sex (~6 mg/kg, capped at the ANSES PRI); vitamin D with age and BMI; zinc with sex and activity (EFSA PRI). But collagen trials dose in absolute grams, and probiotics are strain-specific and not dose-linear — so those bands are <b>the same for everyone, and the product says so</b> instead of inventing a personalised number. Multivitamins get no single target at all: 20+ nutrients each have their own, so we point you to the per-nutrient categories rather than pretend one number exists.</p>
    <p>Personalised dosing never touches the Health &amp; Compo Score — two people looking at the same product see the same grade. It is guidance for healthy adults and <b>not medical advice</b>.</p>
    <h4>My stack (beta) — recorded amounts, combined</h4>
    <p>Add any products to a stack and we sum what you would actually swallow per day, nutrient by nutrient — including <b>declared built-in actives</b> (an omega-3 carrying 800 IU of vitamin D counts toward your vitamin-D total). Recorded totals are compared with the limits implemented here — that works <b>without</b> a profile — and with your personal bands when available. This is not a complete review of every nutrient or interaction. Two 300 mg magnesiums quietly total 600 mg against a 250 mg supplemental limit; nothing on the label warns you, the stack does.</p>
    <p><b>Honest boundary:</b> multivitamin labels aren't per-nutrient coded in our data yet, so a stack containing one shows its totals as <i>lower bounds</i> and says so, rather than guessing. Products whose name declares an extra active we haven't coded are flagged, not silently ignored — the same instinct as the unrecognised-ingredient rule, which withholds the product outright.</p>
    <h4>Provenance (separate axis, not in the health score)</h4>
    <p>The location flag is an <b>estimate associated with the brand</b> (France / EU / outside EU). It does not verify where an individual product or batch was made. This estimate is separate from the composition score.</p>
    <h4>Language</h4>
    <p>The interface follows your browser's language preference (French or English) and you can switch it any time with the toggle in the header — your choice is remembered. We never look up your IP to guess: that would mean sending your address to a third party, and it would answer the wrong question anyway. Note that product-level editorial notes come from the label in the language they were published in.</p>
    <h3>Botanicals, in purple</h3>
    <p>Ashwagandha, maca, rhodiola and curcumin are plant extracts, not nutrients: no reference intake, no EFSA upper limit, and no authorised health claim for any of them. They are shown apart so an extract is never mistaken for a vitamin, and scored on exactly the same method — form tier means <i>is this the material the trials used</i> (standardised, branded extracts vs raw powder), dose tier is the range those trials actually used. Where a European agency has advised against one, the advisory is printed where the dose would otherwise be: ashwagandha carries a 2023 Danish ban and a 2024 ANSES opinion, and is not red-carded only because neither body is in the red-card rule.</p>
    <p>What each supplement is actually good for — by need, graded on the trials, with the EFSA claim shown separately — is on the <a href="/compare/evidence/">evidence page</a>.</p>
    <p>Full details, penalty tables, sources and limitations: <b>METHODOLOGY.md</b> in the repository.</p>`,

  about: META => `
    <h2>About n3gh.</h2>
    <p><b>n3gh.</b> makes health data available to individuals seeking advice or recommendations. The project open-sources science-based resources and technologies to help people enhance their well-being — this comparator (p1) is the first product of that roadmap.</p>
    <h4>Why it exists</h4>
    <p>Supplement marketing sells stories; labels tell the truth. n3gh. reads the label for you: what form the active is in, whether the dose is effective, what else is in the capsule, and what the brand actually proves with third-party tests — then prices the product per gram of active, not per kilo of powder.</p>
    <h4>Independence</h4>
    <p>No sponsors, no affiliate links, no paid placements. Covers ${META.n_products} EU/FR products across ${META.n_categories} categories (snapshot ${META.snapshot}). The <b>scoring method</b> — script and rules — is open-source (MIT) so it can be audited and challenged; the <b>dataset and its daily price/label history</b> stay private, because that accumulating archive is what makes n3gh hard to replicate. If a brand disagrees with a score, the fix is the same for everyone: publish better proof.</p>
    <h4>Roadmap</h4>
    <p>p1: this comparator, with a personalised dosing check on every product. p2, <b>stack</b>, ships inside it (beta): build a basket across categories and it sums the combined daily doses — built-in actives included — warning when two products quietly push a nutrient over its EU limit, and showing what your profile's targets leave uncovered. Next: per-nutrient coding of multivitamin labels (so stack totals stop being lower bounds), the automated price &amp; label pipeline (source audit is Phase 1), and broader categories.</p>
    <p>The daily price-and-label archive stays <b>private</b>, and deliberately so — it is the asset, and publishing it would hand a scraper the one thing that took years to accumulate. What the site shows is today's catalogue; the history stays behind the wall.</p>
    <p style="margin-top:14px"><b>Not medical advice.</b> Always consult a healthcare professional before supplementing.</p>`
},

/* ===================== FRANÇAIS ===================== */
fr: {
  profileTitle: "profil individuel", profileOptional: "facultatif", profileActive: "actif", stackOptional: "facultatif",
  htmlLang: "fr",
  langName: "FR",
  langSwitchTitle: "Switch to English",
  metaDesc: "Comparateur indépendant de compléments alimentaires : un Health & Compo Score fondé sur les preuves (A–E), le prix au gramme d'actif réel et un contrôle de dosage personnalisé pour 257 produits UE/France dans 25 catégories — vitamines, minéraux, protéines, plantes et « boosters » de testostérone notés à part. Sans sponsors, sans liens affiliés.",

  crumb: "/ p1 · comparer",
  navEvidence: "preuves", navMethodology: "méthodologie",
  navAbout: "à propos",

  heroSub: `Comparez les ingrédients, les scores et le prix par actif. Sans sponsors ni liens affiliés.`,

  statProducts: "produits notés",
  statCategories: "catégories",
  statRegion: "marché couvert",
  statSnapshot: "édition du catalogue",
  statOpen: "méthode &amp; données ouvertes",

  pWeight: "poids (kg)", pHeight: "taille (cm)", pHeightPlaceholder: "facultatif",
  pSex: "sexe", pMale: "homme", pFemale: "femme",
  pAge: "âge", pActivity: "activité",
  pSedentary: "sédentaire", pActive: "actif", pAthlete: "sportif",
  pApply: "appliquer", pClear: "effacer",
  pStatusNone: "aucun profil — chaque produit affiche sa dose, aucune n'est confrontée à vos besoins",
  pStatusOn: (w,h,a,s,ac) => `profil actif — ${w} kg${h?" · "+h+" cm":""} · ${a} ans · ${s} · ${ac} · chaque dose ci-dessous est désormais confrontée à vos cibles`,
  pHint: `facultatif — personnalise la ligne « dosage vs vos besoins » sur chaque produit. Le poids et l'âge sont requis ; la taille ne sert qu'à affiner la cible de vitamine&nbsp;D (via l'IMC). Adultes en bonne santé ; fourchettes fondées sur les preuves, limites hautes européennes respectées ; ne constitue pas un avis médical.`,
  pAlertRequired: "Le poids et l'âge sont requis. La taille est facultative (elle ne sert qu'à affiner la cible de vitamine D).",

  searchPlaceholder: "rechercher une marque ou un produit…",
  fitPill: "me convient",
  fitPillTitle: "n'afficher que les produits dont la dose journalière tombe dans votre fourchette cible",
  stackBtn: n => `ma routine (${n})`,
  stackBtnTitle: "tout ce que vous prendriez par jour, additionné nutriment par nutriment et confronté aux limites européennes — et à vos fourchettes, avec un profil",
  sortScore: "tri : meilleur score", sortFit: "tri : me convient le mieux",
  sortValue: "tri : meilleur rapport (€ / actif)", sortPrice: "tri : prix croissant",
  sortBrand: "tri : marque a–z",

  cats: {all:"tout", whey:"whey", creatine:"créatine", vitamin_d3:"vitamine d3", magnesium:"magnésium",
    omega3:"oméga-3", multivitamin:"multivitamines", zinc:"zinc", vitamin_c:"vitamine c",
    collagen:"collagène", probiotics:"probiotiques", melatonin:"mélatonine",
    ashwagandha:"ashwagandha", maca:"maca", rhodiola:"rhodiola", curcumin:"curcumine",
    vitamin_d2:"vitamine D2", vitamin_b1:"vitamine B1", vitamin_b2:"vitamine B2", vitamin_b3:"vitamine B3", vitamin_b5:"vitamine B5", vitamin_b6:"vitamine B6",
    vitamin_b12:"vitamine B12", vitamin_k2:"vitamine K2", b_complex:"complexe B", biotin:"biotine", folate:"folate (B9)",
    tribulus:"tribulus", fenugreek:"fenugrec", zma:"ZMA",
    vitamin_e:"vitamine E", iron:"fer", calcium:"calcium", iodine:"iode", selenium:"sélénium", chromium:"chrome", potassium:"potassium"},

  units: {whey:"g de protéines", creatine:"g de créatine", vitamin_d3:"UI de vitamine D3",
    magnesium:"mg de Mg élémentaire", omega3:"mg d'EPA+DHA", zinc:"mg de zinc", vitamin_c:"mg de vitamine C",
    collagen:"g de peptides", probiotics:"milliards d'UFC", melatonin:"mg de mélatonine",
    ashwagandha:"mg d'extrait de racine", maca:"mg de maca", rhodiola:"mg d'extrait", curcumin:"mg de curcuminoïdes",
    vitamin_b12:"µg de B12", vitamin_k2:"µg de MK-7", biotin:"µg de biotine", folate:"µg de folate", tribulus:"mg d'extrait", fenugreek:"mg d'extrait", zma:"mg de zinc",
    vitamin_e:"mg de vitamine E", iron:"mg de fer", calcium:"mg de calcium", iodine:"µg d'iode", selenium:"µg de sélénium", chromium:"µg de chrome", potassium:"mg de potassium"},
  nutrientUnits: {vitamin_d2:"UI D2", vitamin_d3:"UI D3", vitamin_b1:"mg", vitamin_b2:"mg", vitamin_b3:"mg", vitamin_b5:"mg", vitamin_b6:"mg", vitamin_b12:"µg", biotin:"µg", folate:"µg"},
  stackUnits: {whey:"g de protéines (par portion)", creatine:"g de créatine", vitamin_d3:"UI de vitamine D (D2 + D3)",
    magnesium:"mg de Mg élémentaire", omega3:"mg d'EPA+DHA", zinc:"mg de zinc", vitamin_c:"mg de vitamine C",
    collagen:"g de peptides de collagène", probiotics:"milliards d'UFC", melatonin:"mg de mélatonine",
    ashwagandha:"mg d'extrait d'ashwagandha", maca:"mg de maca", rhodiola:"mg d'extrait de rhodiola", curcumin:"mg de curcuminoïdes",
    vitamin_b12:"µg de vitamine B12", vitamin_k2:"µg de vitamine K2 (MK-7)", biotin:"µg de biotine", folate:"µg de folate", tribulus:"mg d'extrait de tribulus", fenugreek:"mg d'extrait de fenugrec", zma:"mg de zinc",
    vitamin_e:"mg de vitamine E (alpha-tocophérol)", iron:"mg de fer élément", calcium:"mg de calcium élément", iodine:"µg d'iode", selenium:"µg de sélénium", chromium:"µg de chrome", potassium:"mg de potassium élément"},

  actives: {
    whey: p => `${p.active_per_100g} g de protéines / 100 g · ${p.active_per_serving_g} g par portion de ${p.serving_g} g`,
    creatine: p => `${p.active_per_serving_g} g de créatine par portion de ${p.serving_g} g · ${p.active_per_100g} g / 100 g`,
    vitamin_d3: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("fr")} UI / jour (${p.units_per_day} × ${p.unit_name})`,
    magnesium: p => `${p.active_per_unit*p.units_per_day} mg de Mg élémentaire / jour (${p.units_per_day} × ${p.unit_name})`,
    omega3: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("fr")} mg d'EPA+DHA / jour (${p.units_per_day} × ${p.unit_name})`,
    zinc: p => `${p.active_per_unit*p.units_per_day} mg de Zn élémentaire / jour (${p.units_per_day} × ${p.unit_name})`,
    vitamin_c: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("fr")} mg de vitamine C / jour (${p.units_per_day} × ${p.unit_name})`,
    collagenPowder: p => `${p.active_per_serving_g} g de collagène par portion de ${p.serving_g} g`,
    collagenCaps: p => `${(p.active_per_unit*p.units_per_day).toFixed(2)} g de collagène / jour (${p.units_per_day} × ${p.unit_name})`,
    probiotics: p => `${p.active_per_unit*p.units_per_day} milliards d'UFC / jour (${p.units_per_day} × ${p.unit_name})`,
    melatonin: p => `${p.active_per_unit*p.units_per_day} mg de mélatonine / jour (${p.units_per_day} × ${p.unit_name})`,
    ashwagandha: p => `${p.active_per_unit*p.units_per_day} mg d'extrait de racine / jour (${p.units_per_day} × ${p.unit_name})`,
    maca: p => `${(p.active_per_unit*p.units_per_day*(p.extract_ratio||1)).toLocaleString("fr")} mg de maca (équivalent poudre) / jour (${p.units_per_day} × ${p.unit_name})`,
    rhodiola: p => `${p.active_per_unit*p.units_per_day} mg d'extrait / jour (${p.units_per_day} × ${p.unit_name})`,
    curcumin: p => `${p.active_per_unit*p.units_per_day} mg de curcuminoïdes / jour (${p.units_per_day} × ${p.unit_name})`,
    vitamin_b12: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("fr")} µg de B12 / jour (${p.units_per_day} × ${p.unit_name})`,
    vitamin_k2: p => `${p.active_per_unit*p.units_per_day} µg de MK-7 / jour (${p.units_per_day} × ${p.unit_name})`,
    biotin: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("fr")} µg de biotine / jour (${p.units_per_day} × ${p.unit_name})`,
    folate: p => `${p.active_per_unit*p.units_per_day} µg de folate / jour (${p.units_per_day} × ${p.unit_name})`,
    b_complex: p => `${p.units_per_day} × ${p.unit_name} / jour — complexe de vitamines B`,
    tribulus: p => `${p.active_per_unit*p.units_per_day} mg de tribulus / jour (${p.units_per_day} × ${p.unit_name})`,
    fenugreek: p => `${p.active_per_unit*p.units_per_day} mg d'extrait de fenugrec / jour (${p.units_per_day} × ${p.unit_name})`,
    zma: p => `${p.active_per_unit*p.units_per_day} mg de zinc / jour (${p.units_per_day} × ${p.unit_name}) — avec magnésium et B6`,
    vitamin_e: p => `${(+(p.active_per_unit*p.units_per_day).toFixed(1)).toLocaleString("fr")} mg de vitamine E / jour (${p.units_per_day} × ${p.unit_name})`,
    iron: p => `${(+(p.active_per_unit*p.units_per_day).toFixed(1)).toLocaleString("fr")} mg de fer élément / jour (${p.units_per_day} × ${p.unit_name})`,
    calcium: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("fr")} mg de calcium élément / jour (${p.units_per_day} × ${p.unit_name})`,
    iodine: p => `${p.active_per_unit*p.units_per_day} µg d'iode / jour (${p.units_per_day} × ${p.unit_name})`,
    selenium: p => `${p.active_per_unit*p.units_per_day} µg de sélénium / jour (${p.units_per_day} × ${p.unit_name})`,
    chromium: p => `${p.active_per_unit*p.units_per_day} µg de chrome / jour (${p.units_per_day} × ${p.unit_name})`,
    potassium: p => `${(p.active_per_unit*p.units_per_day).toLocaleString("fr")} mg de potassium élément / jour (${p.units_per_day} × ${p.unit_name})`,
    fallback: p => `${p.units_per_day} ${p.unit_name}s / jour`
  },

  ulWhy: {
    folate: "la limite supérieure EFSA pour l'acide folique des compléments — 1 000 µg/j. Au-delà, le folate peut corriger l'anémie d'une carence en B12 pendant que l'atteinte nerveuse continue sans être vue",
    vitamin_d3: "un apport durablement supérieur à la LS expose à une hypercalcémie — c'est un vrai plafond de toxicité",
    magnesium: "l'EFSA a fixé cette limite sur la tolérance digestive (diarrhée osmotique), pas sur la toxicité, et elle ne vise que les compléments — pas le magnésium alimentaire. Les chélates bien tolérés sont souvent dosés au-dessus, délibérément",
    zinc: "un apport durablement supérieur à la LS entre en concurrence avec l'absorption du cuivre",
    vitamin_c: "un plafond indicatif de l'ANSES sur la tolérance digestive, pas un seuil de toxicité",
    melatonin: "un plafond réglementaire français pour les compléments alimentaires, pas un seuil de toxicité — au-delà, le produit relève du médicament, pas du complément",
    omega3: "l'EFSA estime qu'un apport supplémentaire d'EPA+DHA jusqu'à 5000 mg/jour ne soulève aucune préoccupation de sécurité"
  },

  scaledBy: {
    wheyAll: "poids, activité et âge", creatineWeight: "poids (au-delà de 100 kg)",
    d3: "âge et IMC", magnesium: "poids et sexe", omega3: "activité",
    zinc: "sexe et activité", vitaminC: "âge et activité", collagen: "activité uniquement",
    melatoninAge: "âge (remarque seulement)"
  },

  notes: {
    whey: (lo,hi,w,ac,old) => `${lo}–${hi} g/kg/jour pour un adulte ${ac} de ${w} kg${old?" de 65 ans et plus (ESPEN)":" (ISSN / Morton 2018)"} — c'est votre cible alimentaire TOTALE ; un complément ne fait que compléter l'alimentation`,
    creatine: (hi,w) => `l'entretien selon l'ISSN est de 3–5 g/jour, sans ajustement ; les gabarits lourds ou très entraînés se placent en haut de la fourchette (~0,05 g/kg → ${hi} g à ${w} kg). Aucune limite haute européenne n'est fixée`,
    d3Bmi: bmi => `IMC ${bmi} — la séquestration dans le tissu adipeux augmente le besoin (Endocrine Society) ; LS EFSA 4000 UI/jour`,
    d3Old: "plancher relevé à partir de 65 ans (la synthèse cutanée diminue avec l'âge) ; LS EFSA 4000 UI/jour",
    d3NoHeight: "ajoutez votre taille pour affiner — un IMC ≥ 30 relève la cible ; LS EFSA 4000 UI/jour",
    d3Plain: "LS EFSA 4000 UI/jour",
    magnesium: (ai,sexPri,lo,hi) => `votre besoin total ≈ ${ai} mg/jour (~6 mg/kg, plafonné à la RNP ${sexPri} mg, ANSES) ; l'alimentation en couvre l'essentiel, un complément doit donc combler ${lo}–${hi} mg. La LS EFSA pour les compléments est de 250 mg/jour`,
    magnesiumPriM: "homme 420", magnesiumPriF: "femme 360",
    omega3: ac => `l'apport satisfaisant EFSA est de 250 mg/jour ; les adultes ${ac}s tirent bénéfice de davantage (ISSN). L'EFSA estime qu'un apport supplémentaire jusqu'à 5000 mg/jour ne soulève aucune préoccupation de sécurité : une dose plus élevée est donc une question de coût, pas de sécurité`,
    zinc: (base,men,athlete) => `la RNP EFSA est de ${base} mg/jour pour les ${men}${athlete?" ; la sueur et les pertes liées à l'entraînement l'augmentent":""}. La LS EFSA est de 25 mg/jour — au-delà, durablement, l'absorption du cuivre est altérée`,
    zincMen: "hommes", zincWomen: "femmes",
    vitaminC: (lo,athlete) => `la RNP ANSES est de ${lo} mg/jour${athlete?" ; un entraînement intensif porte le renouvellement à ~200 mg":""}. Au-delà, aucun bénéfice supplémentaire n'est établi, mais aucun risque non plus — l'ANSES conseille de rester à 1000 mg/jour au maximum via les compléments`,
    collagen: "les essais cliniques utilisent 5 g (peau) à 15 g (articulations, sollicitation tendineuse) en doses absolues — la recherche sur les peptides de collagène n'ajuste pas au poids corporel, cette fourchette ne bouge donc qu'avec votre activité",
    ashwagandha: "300–600 mg/j d'extrait de racine standardisé : la dose des essais sur le stress et le sommeil. Pas un nutriment : aucun apport de référence, aucune limite EFSA — et deux agences européennes le déconseillent en cas de pathologie thyroïdienne, hépatique ou cardiaque, de grossesse, de prise de sédatifs et avant 18 ans. Lisez la page preuves avant la dose",
    maca: "les essais ont utilisé 1,5–3 g/j de poudre (ou son équivalent en extrait) pendant 6–12 semaines. Preuves limitées : la fourchette est la plage étudiée, pas une dose efficace démontrée",
    rhodiola: "200–600 mg/j d'extrait standardisé en rosavines et salidroside — un extrait non standardisé ne partage qu'un nom avec les essais",
    vitamin_b12: "25–1 000 µg/j : l'apport de référence est de 4 µg, mais seul ~1 % est absorbé passivement à forte dose, donc une personne végane a besoin de 50–100 µg/j ou de ~2 000 µg une fois par semaine. Pas de limite EFSA. Cyanocobalamine et méthylcobalamine marchent toutes deux ; la moins chère convient",
    vitamin_k2: "90–200 µg/j de MK-7 : la plage des essais sur la densité osseuse ; 375 µg en était le haut. Pas de limite EFSA — mais toute personne sous antivitamine K (warfarine, fluindione) ne doit pas en prendre sans son prescripteur",
    biotin: "40 µg/j couvrent l'apport de référence et aucun essai ne montre un bénéfice au-delà chez des personnes en bonne santé. Les produits « cheveux » en vendent 5 000–10 000 µg : aucune preuve, et dès ~1 000 µg elle fausse les dosages de troponine et de thyroïde (alerte FDA). Ici, plus c'est pire",
    folate: "400 µg/j est la dose périconceptionnelle qui réduit les anomalies du tube neural de ~70 % ; 200 µg est l'apport de référence adulte. 1 000 µg/j est la limite EFSA pour l'acide folique — au-delà, une carence en B12 peut passer inaperçue",
    tribulus: "aucune fourchette à afficher : aucune dose de tribulus n'a augmenté la testostérone chez l'homme dans un essai contrôlé. Lisez la page preuves avant d'acheter",
    fenugreek: "500–600 mg/j d'extrait de graines standardisé : ce qu'ont utilisé les quatre petits essais, surtout liés au fabricant, sur la testostérone. Une valeur sanguine a bougé ; rien de ressenti n'a été démontré",
    zma: "la fourchette est celle du zinc — 10–25 mg/j, 25 mg étant le plafond EFSA. Le seul essai ZMA positif (30 mg de zinc, 450 mg de magnésium, 10,5 mg de B6) a été financé par le détenteur du brevet ; la réplication indépendante n'a trouvé aucun changement de testostérone, de force ou de composition corporelle. Sans carence en zinc, en prendre plus ne fait rien à la testostérone",
    curcumin: "un extrait simple à 95 % nécessite ~1 000–1 500 mg/j de curcuminoïdes pour atteindre les doses des essais sur l'arthrose ; les formes à absorption améliorée utilisent 250–500 mg. La curcumine concentrée a un historique d'atteintes hépatiques — à traiter comme un médicament, pas une épice",
    probiotics: "les doses étudiées s'étendent grosso modo de 1 à 50 milliards d'UFC et l'effet dépend de la souche, pas linéairement de la dose — davantage d'UFC n'est pas intrinsèquement mieux. Aucun ajustement au poids, au sexe ou à l'âge n'est établi : cette fourchette est donc la même pour tout le monde",
    melatonin: old => "l'EFSA autorise l'allégation sur l'endormissement à partir de 1 mg (0,5 mg pour le décalage horaire) ; 1,9 mg est le plafond réglementaire français pour un complément alimentaire"
      + (old ? ". La mélatonine endogène décline après 55 ans, âge où la supplémentation aide le plus souvent" : ". Aucun ajustement au poids corporel n'est établi")
  },

  fit: {
    wheyLabel: (d,pct,lo,hi) => `1 portion = ${d} g de protéines ≈ ${pct} % de votre minimum de ${lo} g/jour (votre cible alimentaire totale est de ${lo}–${hi} g — l'alimentation en fait l'essentiel)`,
    wheyChip: pct => `≈${pct} % de vos protéines du jour`,
    overLabel: (d,unit,ul,lo,hi) => `${d} ${unit} par jour — au-dessus de la limite réglementaire de ${ul} pour les compléments (votre fourchette utile est ${lo}–${hi})`,
    overWhat: why => `. Ce que cela signifie : ${why}`,
    overChip: ul => `⚠ au-delà de la limite ${ul}`,
    lowLabel: (d,unit,lo,hi) => `${d} ${unit} par jour — en dessous de votre cible ${lo}–${hi} ; il vous faudrait davantage que la portion indiquée`,
    lowChip: "↓ sous-dosé pour vous",
    highLabel: (d,unit,lo,hi) => `${d} ${unit} par jour — au-dessus de votre fourchette optimale ${lo}–${hi} mais dans toutes les limites réglementaires : sans risque, simplement plus que nécessaire`,
    highChip: "↑ plus que nécessaire",
    okLabel: (d,unit,lo,hi) => `${d} ${unit} par jour — dans votre cible ${lo}–${hi}`,
    okChip: "✓ vous convient"
  },

  barYourBand: (lo,hi) => `votre fourchette ${lo}–${hi}`,
  barEuLimit: ul => `limite UE ${ul}`,
  barNoLimit: "aucune limite UE fixée",

  stack: {
    remove: "Retirer",
    title: "ma routine",
    empty: profile => `Vide. Ajoutez des produits avec le bouton <b>+ routine</b> sur n'importe quelle fiche — mélangez les catégories librement. La routine additionne ce que vous avaleriez réellement chaque jour, nutriment par nutriment, confronte les quantités renseignées aux limites disponibles${profile ? " et à vos fourchettes personnelles" : ""}, et repère les recoupements : un oméga-3 contenant de la vitamine D compte dans votre total de vitamine D.`,
    emptyNoProfile: "Les contrôles de limites fonctionnent sans profil ; renseignez-en un (en haut de la page) pour voir aussi vos fourchettes cibles personnelles ici.",
    products: n => `${n} produit${n>1?"s":""}`,
    perDay: "par jour, tout compris", perMonth: "par mois (~30 jours)",
    combined: profile => `apport journalier cumulé${profile ? " vs vos cibles" : " vs limites UE"}`,
    nothing: "Rien à additionner pour l'instant.",
    total: "total",
    overChip: ul => `⚠ au-delà de la limite ${ul}`,
    overNote: (total,unit,ul,why) => `le cumul de ${total} ${unit} dépasse la limite réglementaire de ${ul} pour les compléments. ${why}.`,
    inBand: "✓ dans votre fourchette", belowBand: "↓ sous votre fourchette", aboveBand: "↑ plus que nécessaire",
    withinLimit: ul => `dans la limite de ${ul}`,
    wheyNote: (pct,lo) => `≈ ${pct} % de votre minimum de ${lo} g/jour — une portion de chaque shake, l'alimentation fait le reste.`,
    from: "provenance :", builtIn: "(intégré)", fromMulti: "(multi / complexe B)", vitaminDTotal: "vitamine D · D2 + D3",
    multiWarn: names => `⚑ Quantités manquantes, <b>non comptabilisées ci-dessus</b> : ${names}. Les totaux couvrent uniquement les nutriments affichés et les quantités codées. D’autres nutriments ou quantités peuvent manquer.`,
    mentionWarn: list => `⚑ déclaré mais pas encore codé : ${list} — non comptabilisé dans les totaux ci-dessus.`,
    mentions: (brand,name,cat) => `${brand} ${name} mentionne <b>${cat}</b>`,
    notCovered: "non couvert par cette routine",
    notCoveredIntro: hasMulti => `Une alimentation variée peut déjà les couvrir — rien ici n'est une incitation à acheter davantage.${hasMulti ? " Votre multivitamines en couvre probablement une partie." : ""} Si vous souhaitez tout de même en couvrir un :`,
    bestForYou: "le meilleur pour vous :", cheapestFit: "le moins cher qui convient :",
    profileHint: "Renseignez votre profil (en haut de la page) pour voir les totaux face à vos fourchettes personnelles et ce que cette routine ne couvre pas.",
    footnote: "Seules les quantités renseignées des compléments sont comptées ; l’alimentation s’y ajoute. Les totaux multi/complexe B couvrent D, magnésium, zinc, C et folates lorsqu’ils sont codés. Les contrôles portent sur les limites intégrées ici et ne garantissent pas la sécurité ou l’adéquation de la routine.",
    alertMax: "Jusqu'à 12 produits dans la routine."
  },


  priceCtx: {
    listChip: r => `souvent −${r[0]} à −${r[1]} %`,
    listTitle: "le prix affiché est le prix public — cette marque pratique des promotions quasi permanentes, vous payez normalement moins",
    listLong: r => `Le prix ci-dessus est le prix public. Cette marque remise structurellement : le prix effectif est généralement inférieur de ${r[0]} à ${r[1]} %, ce qui fait aussi du € / actif affiché une hypothèse haute.`,
    promoChip: "⚠ relevé en promotion",
    promoTitle: "ce prix a été relevé pendant une promotion — il est inférieur au prix habituel, le classement au rapport qualité-prix avantage donc ce produit",
    promoLong: (pct, normal) => `Ce prix a été relevé pendant une promotion${pct?` (−${pct} %)`:""}${normal?`, pour un prix habituel de ${normal}`:""}. Le € / actif et le niveau de prix ci-dessus sont donc meilleurs que ce que ce produit propose habituellement.`,
    stableLong: "Aucun schéma de promotions récurrentes renseigné. Vérifiez le prix actuel sur la fiche du vendeur."
  },
  contribute: {
    line: url => `Vous avez repéré une erreur — un prix, un dosage, un ingrédient ? <a href="${url}" target="_blank" rel="noopener">Proposez une correction</a>. Le jeu de données et le script de notation sont publics ; les corrections arrivent sous forme de modifications auditables, et le correctif s'applique à tous les produits de la même façon.`,
    btnReview: "Contester cette décision ↗",
    titleReview: (b,n) => `[data] contester une décision sur un ingrédient — ${b} ${n}`,
    titleFix: (b,n) => `[data] correction — ${b} ${n}`,
    body: (p, flags) => `Produit : ${p.brand} — ${p.name} (${p.variant})\nIdentifiant : ${p.id}\nCatégorie : ${p.category}\n${flags?`Ingrédient(s) non reconnu(s) : ${flags}\n`:""}\n**Qu'est-ce qui est incorrect, et que faudrait-il ?**\n\n\n**Source** (photo d'étiquette, page de la marque, certificat d'analyse) :\n\n`
  },
  zones: {FR:"origine estimée de la marque : France", EU:"origine estimée de la marque : UE", EXTRA_EU:"origine estimée de la marque : hors UE", UNKNOWN:"origine de la marque non confirmée"},
  confidence: {high:"élevée", medium:"moyenne", low:"faible"},
  priceLevelTitle: tier => `niveau de prix ${tier}/5 (1 = le moins cher par dose, 5 = le plus cher)`,

  chipCoa: "analyses publiées", chipThirdParty: "testé par un tiers", chipVegan: "végan",
  chipBooster: "« booster »", chipBoosterTitle: "vendu pour augmenter la testostérone — noté selon la même méthode, ce qui explique où il atterrit : la page preuves note la plupart de ce groupe D",
  chipBotanical: "plante", chipBotanicalTitle: "un extrait végétal, pas un nutriment — aucun apport de référence, aucune limite EFSA, aucune allégation santé autorisée. Noté selon la même méthode ; ses preuves sont évaluées à part sur la page preuves",
  chipReview: "ingrédient revu", chipReviewTitle: "un ingrédient illisible pour l'auto-tagger a été tranché par un humain avant la publication de ce produit",

  chipFlags: n => `⚠ ${n} alerte${n>1?"s":""}`,

  barComposition: "composition", barPurity: "pureté", barTransparency: "transparence",
  btnDetails: "détails", btnCompare: "+ comparer", btnCompared: "✓ ajouté",
  btnStack: "+ routine", btnStacked: "✓ ajouté",
  btnStackTitle: "ajouter à votre routine quotidienne — les doses cumulées sont confrontées aux limites européennes",
  btnBuy: "acheter ↗", btnBuyTitle: "page produit directe — n3gh n'a aucune affiliation et ne gagne rien",
  perDayShort: (c,d) => `${c}/jour · ~${d} jours`,
  confTitle: c => `fiabilité des données : ${c}`,
  redCardBanner: subs => `🟥 carton rouge · interdit : ${subs}`,

  countPlain: (n,total) => `${n} produits sur ${total}`,
  countFit: (n,scope,where) => `${n} ${where} sur ${scope} vous conviennent`,
  countMatched: n => ` · ${n} d'entre eux correspondent à votre profil`,
  countNeedsProfile: " · le tri par adéquation nécessite un profil (en haut de la page)",
  countValueWarn: " · le tri par rapport qualité-prix n'a de sens qu'au sein d'une catégorie",
  whereProducts: "produits", whereCat: c => `produits ${c}`,
  emptyFit: "Aucun produit de cette catégorie ne tombe dans votre fourchette cible. Retirez le filtre « me convient » pour voir à quel point les autres s'en approchent.",
  emptyNone: "Aucun produit ne correspond.",

  trayClear: "effacer", trayGo: n => `comparer (${n})`,
  alertCompareMax: "Comparez jusqu'à 3 produits.",
  alertCompareSame: "Comparez des produits d'une même catégorie.",

  cmp: {
    title: "Comparaison", score: "score", composition: "composition & efficacité",
    purity: "pureté & additifs", transparency: "transparence & tests", price: "prix",
    costDay: "coût / jour", daysPack: "jours par pack", form: "forme", actives: "actifs journaliers",
    doseVsNeeds: "dose vs vos besoins", additives: "additifs", certifications: "certifications",
    watchouts: "points de vigilance", none: "Aucun",
    footnote: snap => `Vert = le meilleur de la sélection. Les prix ont des dates de relevé différentes : consultez « source & vérification » sur chaque fiche. Les promotions peuvent modifier la comparaison.`
  },

  verification: {
    title: "source & vérification", source: "lien source", label: "champs d’étiquette", price: "prix / variante",
    openSource: "fiche source", openLabel: "source étiquette", openPrice: "source prix",
    checkedOn: date => `revu le ${date}`, notRechecked: "non revérifié",
    accessNote: "Un lien accessible ne valide ni l’étiquette ni le prix. Une revue de champs porte uniquement sur le périmètre indiqué ci-dessous, pas sur la formule entière, les additifs ou les certificats.",
    availability: "disponibilité au contrôle", availabilityStates: {InStock:"en stock lors du contrôle source", OutOfStock:"rupture de stock lors du contrôle source"},
    priceScope: "Périmètre du prix revu :", scope: "Périmètre de l’étiquette revue :", pending: "À revoir :", origin: "Repère géographique de la marque :",
    originNote: "Déduit de la marque ; le lieu de fabrication de ce produit ou de ce lot n’est pas confirmé.",
    statuses: {identity_verified:"identité structurée du produit concordante", reachable_unverified:"lien accessible · fiche non validée", blocked:"accès automatisé bloqué", broken_source:"page source introuvable", unavailable:"source indisponible au contrôle", missing_source:"aucun lien source", unchecked:"source non contrôlée"},
    fields: {price:"prix", label:"étiquette", additives:"additifs", certifications:"certifications", coa:"analyse de lot", variant:"variante exacte", nutrients:"quantités de nutriments"}
  },

  detail: {
    rowForm: "Qualité de la forme", rowDose: "Dosage efficace", rowPurity: "Pureté & additifs",
    rowTransparency: "Transparence & tests",
    noAdditives: "Aucun additif — étiquette propre", noCerts: "Aucune certification ni analyse publique",
    rankInCat: n => `n°${n} de la catégorie`,
    scoreLine: (total,conf) => `Health &amp; Compo Score <b>${total}</b> / 100 · fiabilité des données : <b>${conf}</b>`,
    secBreakdown: "détail du score", secPrice: "prix &amp; valeur", secProvenance: "provenance",
    secDosage: "dosage vs vos besoins", secGet: "ce que vous obtenez vraiment",
    secReview: "décisions sur les ingrédients", secWatchouts: "points de vigilance",
    inStore: pv => `Prix relevé en magasin — ${pv.store}${pv.city?`, ${pv.city}`:""}, le ${pv.observed_on}. Un magasin, un jour : ce n'est pas un prix national. Vérifiez la date avant de comparer.`,
    verdictLabel: v => v === "neutral" ? "bénin — aucune pénalité"
      : v.startsWith("banned:") ? "substance interdite — score ramené à 0"
      : `compté comme ${v.split(":")[1].replace(/_/g, " ")}`,
    listPrice: "prix relevé", priceLevelCell: tier => `niveau de prix ${tier}/5 dans la catégorie`,
    provMalus: m => `(−${m} de proximité, affiché séparément — hors score santé)`,
    unknown: "inconnue",
    noDose: "L'étiquette de ce produit n'indique pas de dose journalière que nous puissions confronter à votre profil.",
    fillProfile: "Renseignez votre profil (en haut de la page) pour voir comment cette dose se compare à votre cible personnelle.",
    secNutrients: "nutriments renseignés",
    multiLead: "Quantités relevées sur l’étiquette pour la portion journalière. Ce tableau peut être partiel : un nutriment absent du tableau n’est pas un zéro confirmé.",
    absent: "absent de cette formule", perDayWord: "jour",
    multiCoded: "La routine utilise les quantités renseignées de vitamine D (D2 + D3), magnésium, zinc, vitamine C et folates. Les autres nutriments ci-dessus sont affichés à titre informatif.",
    multiMissing: list => `Pas encore codé depuis cette étiquette, donc non comptabilisé dans les totaux : ${list}.`,
    multiNote: d => `Le score de dosage (${d}/20) est une synthèse de la méthode, pas une évaluation complète de chaque nutriment ni de l’adéquation du produit à votre situation.`,
    personalisedTo: s => `Personnalisé selon votre ${s}.`,
    notPersonalised: "Cette fourchette n'est <b>pas</b> personnalisée : aucun ajustement au poids, au sexe ou à l'âge n'est établi pour ce nutriment, elle est donc la même pour tout le monde.",
    guidance: " Recommandations pour adultes en bonne santé — ne constitue pas un avis médical.",
    builtIn: (amt,unit) => `+ intégré : ${amt} ${unit} / jour — comptabilisé dans les totaux de votre routine`,
    btnInStack: "✓ dans votre routine", btnAddStack: "+ ajouter à ma routine",
    btnBuyLong: "acheter — page produit directe ↗", noAffiliation: "aucune affiliation, n3gh ne gagne rien",
    reviewFlag: r => `✓ « ${r.string} » — ${T("detail").verdictLabel(r.verdict)}${r.note?` · ${r.note}`:""}${r.reviewed_on?` · vérifié le ${r.reviewed_on}`:""}`,
    redCardLong: subs => `🟥 carton rouge — contient une substance interdite ou restreinte par l'UE / la FDA / l'OMS : ${subs}. Score ramené à 0.`,
    footnote: v => `Noté avec la méthodologie v${v} à partir de l'étiquette publique et des documents de la marque — pas d'analyses en laboratoire indépendant. Ne constitue pas un avis médical.`
  },

  footDisclaimer: `<b>Ne constitue pas un avis médical.</b> Les scores reflètent uniquement la composition de l'étiquette et la transparence publique — ni l'adéquation d'un complément à votre cas, ni une vérification indépendante du contenu des lots. Les compléments alimentaires ne remplacent pas une alimentation variée. Parlez-en à un professionnel de santé avant toute supplémentation, en particulier en cas de grossesse, de traitement en cours ou de pathologie.`,
  footPrices: `Les prix proviennent des relevés historiques du catalogue ; les contrôles par fiche figurent dans <b>source &amp; vérification</b> — plusieurs marques (Myprotein, Bulk, Prozis) pratiquent des promotions structurelles, les prix effectifs peuvent donc être inférieurs de 30 à 45 %. La fiabilité des données est signalée produit par produit. Vous avez repéré une erreur ? Le jeu de données et le script de notation sont ouverts — corrigez-nous.`,
  footSummary: `<b>Ne constitue pas un avis médical.</b> Prix, licence et droits sur les données — ouvrir le détail`,
  footRights: `© 2026 n3gh. Code <b>AGPL-3.0</b> · méthodologie <b>CC BY-NC-ND 4.0</b> · catalogue <b>CC BY-NC-SA 4.0</b>. Ce catalogue est une base de données protégée (dir. 96/9/CE ; CPI art. L.341-1 et s.) : un fait isolé reste librement citable, l'extraction d'une <b>partie substantielle</b> est réservée. Droits de fouille de textes et de données réservés (dir. (UE) 2019/790 art. 4(3) ; CPI art. L.122-5-3) — voir <a href="/.well-known/tdmrep.json">tdmrep.json</a> et les <a href="/terms/">conditions</a>.`,
  footMeta: "p1 · comparer + p2 · routine (bêta) — méthode ouverte, données privées · AGPL-3.0 · v1.5",
  footVersions: "méthodologie v1.2 · modèle de dosage v2",

  methodology: () => `
    <h2>Comment fonctionne le Health &amp; Compo Score</h2>
    <p>Chaque produit est noté de 0 à 100 par un script <b>ouvert</b>, à partir de la seule étiquette et des preuves publiques, jamais des allégations marketing. La <b>méthode est ouverte</b> pour pouvoir être auditée ; le <b>jeu de données et son historique de prix et d'étiquettes ne sont pas publiés</b> — cette archive qui s'accumule est la barrière à l'entrée de n3gh. <b>Le prix n'entre jamais dans le score santé.</b></p>
    <h4>🟥 Carton rouge</h4>
    <p>Un produit contenant une substance interdite, retirée ou restreinte par <b>l'une quelconque</b> des autorités UE-EFSA, US-FDA ou OMS (dioxyde de titane E171, graisses trans industrielles, BVO, bromate de potassium, Rouge 3, propylparabène…) est ramené à <b>0 / note E</b> — un additif interdit est une disqualification, pas une déduction. La règle la plus stricte l'emporte : si une seule autorité le signale, nous le signalons.</p>
    <h4>Composition &amp; efficacité — 40 pts</h4>
    <p><b>Qualité de la forme (20) :</b> le magnésium chélaté l'emporte sur l'oxyde ; l'oméga-3 rTG sur les esters éthyliques ; la Creapure® sur un monohydrate non documenté ; les probiotiques à souche identifiée sur les autres. <b>Dosage efficace (20) :</b> dose journalière face aux fourchettes efficaces publiées et aux valeurs de référence EFSA, avec pénalités en cas de dépassement des limites hautes européennes.</p>
    <h4>Pureté &amp; additifs — 30 pts</h4>
    <p>On part de 30, on retranche par additif, <b>proportionnellement au niveau de preuve sanitaire</b> : graisse entièrement hydrogénée −25, mélange propriétaire non détaillé −10, BHA/BHT −10, <b>sucre ajouté −8</b>, puis les édulcorants par paliers de preuve (voir ci-dessous), colorants azoïques −3, polyols/supports/émulsifiants/charges/enrobages/conservateurs −2 chacun, et un palier −1 pour les ingrédients mineurs non détaillés (un simple «&nbsp;arômes&nbsp;», «&nbsp;support comprimé standard&nbsp;») et les correcteurs d'acidité ou poudres à lever à l'état de traces. Les édulcorants naturels (stévia, fruit du moine), huiles support, enveloppes de gélules et arômes naturels sont neutres. Un ingrédient non reconnu ne fait jamais l'objet d'une supposition : le produit est <b>entièrement retiré du site</b> jusqu'à ce qu'un humain tranche. Une pénalité &laquo;&nbsp;provisoire&nbsp;&raquo; de −2 reviendrait à affirmer que le pire cas est bénin — précisément ce que l'on ignore encore.</p>
    <h4>Notre position sur les édulcorants (fondée sur les preuves)</h4>
    <p>Les autorités (EFSA, FDA, OMS/JECFA) confirment l'innocuité des édulcorants à leurs doses journalières admissibles. De vastes cohortes (NutriNet-Santé, &gt; 100 000 adultes) et des études de laboratoire rapportent des <i>signaux</i> — non une causalité démontrée — pour certains d'entre eux. Nous appliquons une précaution légère et proportionnée : <b>palier D</b> sucralose/érythritol/xylitol −6 (signal mécanistique ou cardiovasculaire), <b>palier C</b> aspartame/acésulfame-K −4 (signal de cohorte), <b>palier B</b> saccharine/cyclamate −2, <b>palier A</b> stévia/fruit du moine 0. Surtout, <b>le sucre ajouté (−8) est plus pénalisé que n'importe quel édulcorant</b>, parce que les preuves de sa nocivité sont plus solides. Nous n'affirmons pas que « les édulcorants donnent le cancer ».</p>
    <h4>Transparence &amp; tests — 30 pts</h4>
    <table><tr><th>Analyses de lots / certificats publiés</th><td>+12</td></tr>
    <tr><th>Certification tierce reconnue (Informed Sport, Cologne List, IFOS, Sport Protect, AFNOR NF…)</th><td>+10</td></tr>
    <tr><th>Matière première de marque traçable (Creapure®, EPAX®, Peptan®…)</th><td>+4</td></tr>
    <tr><th>Étiquette entièrement quantifiée, sans mélange propriétaire</th><td>+4</td></tr></table>
    <h4>Notes</h4>
    <p><b>A</b> ≥ 80 · <b>B</b> 65–79 · <b>C</b> 50–64 · <b>D</b> 35–49 · <b>E</b> &lt; 35</p>
    <h4>Niveau de prix &amp; valeur (distincts du score santé)</h4>
    <p><b>€ / dose standard</b> par catégorie (€/25 g de protéines, €/1000 UI de D3, €/10 g de collagène…) plus un <b>niveau de prix de 1 à 5</b> — une bande d'accessibilité au sein de la catégorie (1 = le moins cher par dose, 5 = le plus cher). Une huile de poisson « pas chère » à 19 € peut revenir plus cher au gramme d'EPA+DHA qu'une autre à 50 €.</p>
    <h4>Dosage personnalisé (distinct du score santé)</h4>
    <p>Si vous renseignez le profil facultatif, la dose journalière de chaque produit est confrontée à <b>votre</b> cible. Nous gardons deux questions strictement séparées. <b>Est-ce dans votre fourchette utile ?</b> — une fourchette personnalisée construite à partir de votre poids, sexe, âge et activité. <b>Cela franchit-il une limite légale ?</b> — la limite haute UE/ANSES, identique pour tout le monde. Une dose <i>au-dessus de votre fourchette mais sous toutes les limites</i> est sans risque, simplement plus que nécessaire : elle n'est jamais affichée en rouge. Seul un vrai dépassement de limite haute l'est.</p>
    <table><tr><th>✓ vous convient</th><td>dans votre fourchette personnalisée</td></tr>
    <tr><th>↓ sous-dosé pour vous</th><td>sous la fourchette — la portion indiquée ne vous y amènerait pas</td></tr>
    <tr><th>↑ plus que nécessaire</th><td>au-dessus de la fourchette, dans toutes les limites réglementaires — une question de coût, pas de sécurité</td></tr>
    <tr><th>⚠ au-delà de la limite UE</th><td>franchit une limite haute réglementaire (vitamine D 4000 UI, zinc 25 mg, magnésium des compléments 250 mg, mélatonine 1,9 mg…)</td></tr></table>
    <p><b>Nous ne personnalisons que ce que les preuves permettent.</b> Les protéines s'ajustent au poids et à l'activité (ISSN / Morton 2018, ESPEN au-delà de 65 ans) ; le magnésium au poids et au sexe (~6 mg/kg, plafonné à la RNP ANSES) ; la vitamine D à l'âge et à l'IMC ; le zinc au sexe et à l'activité (RNP EFSA). Mais les essais sur le collagène dosent en grammes absolus, et les probiotiques dépendent de la souche sans linéarité de dose — ces fourchettes sont donc <b>les mêmes pour tout le monde, et le produit le dit</b> plutôt que d'inventer un chiffre personnalisé. Les multivitamines n'ont aucune cible unique : plus de 20 nutriments ont chacun la leur, nous vous renvoyons donc aux catégories par nutriment au lieu de faire croire qu'un seul chiffre existe.</p>
    <p>Le dosage personnalisé ne touche jamais au Health &amp; Compo Score — deux personnes regardant le même produit voient la même note. Il s'agit de recommandations pour adultes en bonne santé et <b>non d'un avis médical</b>.</p>
    <h4>Ma routine (bêta) — les quantités renseignées, cumulées</h4>
    <p>Ajoutez des produits à une routine et nous additionnons ce que vous avaleriez réellement chaque jour, nutriment par nutriment — y compris les <b>actifs intégrés déclarés</b> (un oméga-3 apportant 800 UI de vitamine D compte dans votre total de vitamine D). Les totaux renseignés sont confrontés aux limites intégrées ici — cela fonctionne <b>sans</b> profil — et aux fourchettes personnelles disponibles. Ce contrôle ne couvre pas tous les nutriments ou interactions. Deux magnésiums à 300 mg totalisent discrètement 600 mg face à une limite de 250 mg pour les compléments ; rien sur l'étiquette ne vous prévient, la routine si.</p>
    <p><b>Couverture partielle :</b> les multivitamines et complexes B contribuent uniquement aux quantités codées de vitamine D (D2 + D3), magnésium, zinc, vitamine C et folates. Les autres nutriments renseignés restent visibles dans le détail produit. Les quantités manquantes sont signalées et ne valent pas zéro.</p>
    <h4>Provenance (axe distinct, hors score santé)</h4>
    <p>Le repère géographique est une <b>estimation associée à la marque</b> (France / UE / hors UE). Il ne confirme pas le pays de fabrication d’un produit ou d’un lot particulier. Cette estimation reste distincte du score de composition.</p>
    <h4>Langue</h4>
    <p>L'interface suit la préférence linguistique de votre navigateur (français ou anglais) et vous pouvez en changer à tout moment avec le sélecteur dans l'en-tête — votre choix est mémorisé. Nous ne consultons jamais votre adresse IP pour deviner : cela reviendrait à transmettre votre adresse à un tiers, et répondrait de toute façon à la mauvaise question. À noter : les remarques éditoriales propres à chaque produit reprennent l'étiquette dans la langue où elle a été publiée.</p>
    <h3>Les plantes, en violet</h3>
    <p>Ashwagandha, maca, rhodiola et curcumine sont des extraits végétaux, pas des nutriments : aucun apport de référence, aucune limite supérieure EFSA, aucune allégation santé autorisée pour aucune d'elles. Elles sont affichées à part pour qu'un extrait ne soit jamais pris pour une vitamine, et notées selon exactement la même méthode — le palier de forme signifie <i>est-ce le matériau utilisé dans les essais</i> (extraits standardisés et brevetés vs poudre brute), le palier de dose est la plage réellement utilisée par ces essais. Quand une agence européenne en déconseille une, l'avertissement est imprimé là où la dose serait autrement : l'ashwagandha porte une interdiction danoise de 2023 et un avis de l'ANSES de 2024, et n'a pas de carton rouge uniquement parce qu'aucune de ces deux instances ne fait partie de la règle.</p>
    <p>Ce à quoi chaque complément sert vraiment — par besoin, noté sur les essais, avec l'allégation EFSA affichée à part — est sur la <a href="/compare/evidence/">page preuves</a>.</p>
    <p>Détails complets, tables de pénalités, sources et limites : <b>METHODOLOGY.md</b> dans le dépôt.</p>`,

  about: META => `
    <h2>À propos de n3gh.</h2>
    <p><b>n3gh.</b> rend les données de santé accessibles aux personnes en quête de conseils ou de recommandations. Le projet ouvre le code de ressources et de technologies fondées sur la science pour aider chacun à améliorer son bien-être — ce comparateur (p1) est le premier produit de cette feuille de route.</p>
    <h4>Pourquoi il existe</h4>
    <p>Le marketing des compléments vend des histoires ; les étiquettes disent la vérité. n3gh. lit l'étiquette pour vous : sous quelle forme se présente l'actif, si la dose est efficace, ce que contient d'autre la gélule, et ce que la marque prouve réellement par des tests tiers — puis chiffre le produit au gramme d'actif, et non au kilo de poudre.</p>
    <h4>Indépendance</h4>
    <p>Sans sponsors, sans liens affiliés, sans placements payants. Couvre ${META.n_products} produits UE/FR dans ${META.n_categories} catégories (relevé ${META.snapshot}). La <b>méthode de notation</b> — script et règles — est open source (MIT) pour pouvoir être auditée et contestée ; le <b>jeu de données et son historique quotidien de prix et d'étiquettes</b> restent privés, parce que cette archive qui s'accumule est ce qui rend n3gh difficile à répliquer. Si une marque conteste un score, le remède est le même pour tous : publier de meilleures preuves.</p>
    <h4>Feuille de route</h4>
    <p>p1 : ce comparateur, avec un contrôle de dosage personnalisé sur chaque produit. p2, <b>routine</b>, y est intégré (bêta) : composez un panier toutes catégories confondues et il additionne les doses journalières cumulées — actifs intégrés compris — en alertant lorsque deux produits poussent discrètement un nutriment au-delà de sa limite européenne, et en montrant ce que les cibles de votre profil laissent découvert. Ensuite : le codage nutriment par nutriment des étiquettes de multivitamines (pour que les totaux cessent d'être des minorants), le pipeline automatisé de prix et d'étiquettes (l'audit des sources constitue la phase 1) et l'élargissement des catégories.</p>
    <p>L'archive quotidienne des prix et des étiquettes reste <b>privée</b>, et c'est délibéré — c'est l'actif, et la publier reviendrait à offrir à un aspirateur de données la seule chose qui a demandé des années d'accumulation. Le site montre le catalogue du jour ; l'historique reste derrière le mur.</p>
    <p style="margin-top:14px"><b>Ne constitue pas un avis médical.</b> Consultez toujours un professionnel de santé avant toute supplémentation.</p>`
}

};

/* ---------- language selection ---------- */
const LANG_KEY = "n3gh_lang";
function detectLang(){
  // A prerendered /fr/ or /en/ route pins its language: the URL is the promise the
  // crawler indexed, so it must win over both the stored choice and the browser.
  if (window.N3GH_FORCE_LANG === "fr" || window.N3GH_FORCE_LANG === "en")
    return window.N3GH_FORCE_LANG;
  try { const saved = localStorage.getItem(LANG_KEY); if (saved === "fr" || saved === "en") return saved; } catch(e){}
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
  return /^fr\b/i.test(nav) ? "fr" : "en";            // fr, fr-FR, fr-BE, fr-CA…
}
let LANG = detectLang();
// key lookup with English fallback, so a missing French string degrades instead of breaking
function T(path){
  const walk = o => path.split(".").reduce((v,k) => (v == null ? v : v[k]), o);
  const v = walk(I18N[LANG]);
  return v === undefined ? walk(I18N.en) : v;
}
