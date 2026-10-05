// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// Copyright (C) 2026 n3gh. Licence: ../LICENSE-DATA.md
//
// n3gh. — evidence dataset. What the trials actually show, by need.
//
// EVERY NUMBER HERE POINTS AT A SOURCE. If a figure has no citation it does not
// go in. Grades are for the OUTCOME on this row, not for the supplement — the
// same molecule can be A for one thing and D for another, and usually is.
//
// The EFSA line is deliberately separate from the trial evidence. An EFSA
// authorised claim (Reg. 1924/2006) is regulator-approved WORDING about a
// nutrient's physiological role; it is not a trial showing an outcome improved.
// "Magnesium contributes to normal psychological function" is an authorised
// claim; "magnesium improves your sleep" has low-certainty evidence. Both facts
// are shown, side by side, so nobody has to confuse them.
const t = (en, fr) => ({ en, fr });

const EVIDENCE = {
  version: "1.0", updated: "2026-09-06",

  grades: {
    A: { label: t("strong", "solide"),
         def: t("Several large randomised trials or meta-analyses totalling more than ~1,000 participants, a consistent direction, and an effect large enough to notice.",
                "Plusieurs grands essais randomisés ou méta-analyses totalisant plus de ~1 000 participants, une direction cohérente et un effet assez grand pour être perceptible.") },
    B: { label: t("moderate", "modérée"),
         def: t("Meta-analyses of smaller trials, or a few hundred to ~1,000 participants; consistent but modest — or strong only in a defined group, such as people who are deficient.",
                "Méta-analyses d'essais plus petits, ou quelques centaines à ~1 000 participants ; effet cohérent mais modeste — ou solide seulement dans un groupe défini, comme les personnes carencées.") },
    C: { label: t("limited", "limitée"),
         def: t("Few or small trials, low-certainty grading, inconsistent results, or a high risk of bias — including trials funded by the ingredient's manufacturer.",
                "Essais peu nombreux ou petits, certitude faible, résultats inconstants ou risque de biais élevé — y compris des essais financés par le fabricant de l'ingrédient.") },
    D: { label: t("not supported", "non étayée"),
         def: t("Null in large trials for this outcome, or only observational or animal data. Not the same as harmful — it means the claim has been tested and did not hold up.",
                "Résultat nul dans de grands essais pour ce critère, ou seulement des données observationnelles ou animales. Pas synonyme de nocif : la promesse a été testée et n'a pas tenu.") },
  },

  // The supplement registry. `cat` links to a comparator category; `kind`
  // decides the colour — botanicals are not nutrients and are shown apart.
  supplements: {
    melatonin:    { name: t("melatonin", "mélatonine"),          cat: "melatonin",    kind: "nutrient" },
    magnesium:    { name: t("magnesium", "magnésium"),           cat: "magnesium",    kind: "nutrient" },
    creatine:     { name: t("creatine", "créatine"),             cat: "creatine",     kind: "nutrient" },
    whey:         { name: t("whey / protein", "whey / protéines"), cat: "whey",       kind: "nutrient" },
    vitamin_d3:   { name: t("vitamin D3", "vitamine D3"),        cat: "vitamin_d3",   kind: "nutrient" },
    omega3:       { name: t("omega-3 (EPA/DHA)", "oméga-3 (EPA/DHA)"), cat: "omega3", kind: "nutrient" },
    vitamin_c:    { name: t("vitamin C", "vitamine C"),          cat: "vitamin_c",    kind: "nutrient" },
    zinc:         { name: t("zinc", "zinc"),                     cat: "zinc",         kind: "nutrient" },
    probiotics:   { name: t("probiotics", "probiotiques"),       cat: "probiotics",   kind: "nutrient" },
    collagen:     { name: t("collagen peptides", "peptides de collagène"), cat: "collagen", kind: "nutrient" },
    multivitamin: { name: t("multivitamin", "multivitamines"),   cat: "multivitamin", kind: "nutrient" },
    ashwagandha:  { name: t("ashwagandha", "ashwagandha"),       cat: "ashwagandha",  kind: "botanical" },
    maca:         { name: t("maca", "maca"),                     cat: "maca",         kind: "botanical" },
    rhodiola:     { name: t("rhodiola", "rhodiola"),             cat: "rhodiola",     kind: "botanical" },
    curcumin:     { name: t("curcumin (turmeric)", "curcumine (curcuma)"), cat: "curcumin", kind: "botanical" },
    vitamin_b12:  { name: t("vitamin B12", "vitamine B12"),          cat: "vitamin_b12", kind: "nutrient" },
    folate:       { name: t("folic acid / folate (B9)", "acide folique / folate (B9)"), cat: "folate", kind: "nutrient" },
    vitamin_k2:   { name: t("vitamin K2 (MK-7)", "vitamine K2 (MK-7)"), cat: "vitamin_k2", kind: "nutrient" },
    vitamin_e:    { name: t("vitamin E", "vitamine E"),              cat: null, kind: "nutrient" },
    beta_carotene:{ name: t("beta-carotene (pro-vitamin A)", "bêta-carotène (pro-vitamine A)"), cat: null, kind: "nutrient" },
    biotin:       { name: t("biotin (B8)", "biotine (B8)"),          cat: "biotin", kind: "nutrient" },
    // Sold to raise testosterone. A third colour, because the honest summary
    // of this group is "mostly no", and a reader should see that coming.
    tribulus:     { name: t("tribulus terrestris", "tribulus terrestris"), cat: "tribulus", kind: "booster" },
    fenugreek:    { name: t("fenugreek", "fenugrec"),                cat: "fenugreek", kind: "booster" },
    tongkat_ali:  { name: t("tongkat ali (Eurycoma longifolia)", "tongkat ali (Eurycoma longifolia)"), cat: null, kind: "booster" },
    daa:          { name: t("D-aspartic acid", "acide D-aspartique"), cat: null, kind: "booster" },
    turkesterone: { name: t("turkesterone", "turkestérone"),         cat: null, kind: "booster" },
    ecdysterone:  { name: t("ecdysterone", "ecdystérone"),           cat: null, kind: "booster" },
    zma:          { name: t("ZMA (zinc + magnesium + B6)", "ZMA (zinc + magnésium + B6)"), cat: "zma", kind: "booster" },
    boron:        { name: t("boron", "bore"),                        cat: null, kind: "booster" },
    dhea:         { name: t("DHEA", "DHEA"),                         cat: null, kind: "booster" },
  },

  needs: [
  // ------------------------------------------------------------------ sleep
  { id: "sleep", name: t("sleep", "sommeil"),
    blurb: t("The most-searched need and the one with the widest gap between what is sold and what is shown. Effects here are measured in minutes, not hours.",
             "Le besoin le plus recherché, et celui où l'écart est le plus grand entre ce qui se vend et ce qui se démontre. Les effets se mesurent ici en minutes, pas en heures."),
    entries: [
      { sup: "melatonin", grade: "B",
        effect: t("Falls asleep about 7 minutes sooner; sleeps about 8 minutes longer. Real, consistent, and small. Best evidence is for sleep onset and jet lag; in adults with plain insomnia the newer analysis found no significant effect.",
                  "Endormissement environ 7 minutes plus tôt ; sommeil environ 8 minutes plus long. Réel, cohérent et petit. Les meilleures preuves concernent l'endormissement et le décalage horaire ; chez l'adulte souffrant d'insomnie simple, l'analyse la plus récente ne trouve pas d'effet significatif."),
        dose: t("0.5–1.9 mg, 30–60 min before bed. 1.9 mg is the French ceiling for supplements.", "0,5–1,9 mg, 30–60 min avant le coucher. 1,9 mg est le plafond français pour les compléments."),
        studies: [
          { ref: "Ferracioli-Oda et al., PLoS One 2013", n: 1683, design: t("meta-analysis, 19 RCTs", "méta-analyse, 19 ECR"),
            finding: t("sleep onset −7.1 min (95% CI 4.4–9.8); total sleep +8.3 min", "endormissement −7,1 min (IC 95 % 4,4–9,8) ; sommeil total +8,3 min"),
            url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0063773" },
          { ref: "Sleep Medicine Reviews 2022", n: null, design: t("systematic review, 24 RCTs in chronic insomnia", "revue systématique, 24 ECR dans l'insomnie chronique"),
            finding: t("significant in children and adolescents; in adults with non-comorbid insomnia, not significant for onset, total sleep or efficiency", "significatif chez l'enfant et l'adolescent ; chez l'adulte sans comorbidité, non significatif sur l'endormissement, la durée ou l'efficacité"),
            url: "https://pubmed.ncbi.nlm.nih.gov/36179487/" },
        ],
        efsa: t("Authorised: \"contributes to the reduction of time taken to fall asleep\" (1 mg before bed) and \"alleviation of subjective feelings of jet lag\" (0.5 mg).",
                "Autorisée : « contribue à réduire le temps d'endormissement » (1 mg avant le coucher) et « atténuation des effets du décalage horaire » (0,5 mg)."),
        caveats: t("Timing matters more than dose. Longer trials and higher doses showed larger effects, but the whole effect is still under ten minutes.", "Le moment de la prise compte plus que la dose. Les essais plus longs et les doses plus élevées montrent des effets plus grands, mais l'effet total reste inférieur à dix minutes.") },

      { sup: "magnesium", grade: "C",
        effect: t("The popular claim, and the evidence does not carry it. Three small trials in older adults found sleep onset ~17 minutes sooner, at low-to-very-low certainty; a 2025 review of all adult trials concluded it should not be a routine insomnia treatment.",
                  "La promesse populaire, et les preuves ne la portent pas. Trois petits essais chez des adultes âgés trouvent un endormissement ~17 minutes plus tôt, avec une certitude faible à très faible ; une revue 2025 de tous les essais adultes conclut qu'il ne doit pas être un traitement de routine de l'insomnie."),
        dose: t("Trials used 320–500 mg/day elemental Mg. EFSA supplemental limit: 250 mg/day.", "Les essais ont utilisé 320–500 mg/j de Mg élémentaire. Limite EFSA pour les compléments : 250 mg/j."),
        studies: [
          { ref: "Mah & Pitre, BMC Complement Med Ther 2021", n: 151, design: t("meta-analysis, 3 RCTs, older adults", "méta-analyse, 3 ECR, adultes âgés"),
            finding: t("sleep onset −17.4 min; total sleep +16 min not significant; all trials moderate-to-high risk of bias", "endormissement −17,4 min ; sommeil total +16 min non significatif ; tous les essais à risque de biais modéré à élevé"),
            url: "https://link.springer.com/article/10.1186/s12906-021-03297-z" },
          { ref: "Systematic review of adult RCTs, 2025", n: null, design: t("systematic review", "revue systématique"),
            finding: t("certainty low to very low; modest benefit on some subjective outcomes, inconsistent; not supported as routine treatment", "certitude faible à très faible ; bénéfice modeste sur certains critères subjectifs, inconstant ; non étayé comme traitement de routine"),
            url: "https://pubmed.ncbi.nlm.nih.gov/42661485/" },
        ],
        efsa: t("No authorised sleep claim. Authorised: normal psychological function, reduction of tiredness and fatigue, normal muscle and nervous-system function.",
                "Aucune allégation sommeil autorisée. Autorisées : fonctions psychologiques normales, réduction de la fatigue, fonctions musculaire et nerveuse normales."),
        caveats: t("If you are actually low in magnesium — common with low intake, alcohol, some diuretics — correcting it can plausibly help. That is not the same as magnesium being a sleep aid for everyone.",
                   "Si vous manquez réellement de magnésium — fréquent avec un faible apport, l'alcool, certains diurétiques — corriger la carence peut aider. Ce n'est pas la même chose qu'un somnifère pour tout le monde.") },

      { sup: "ashwagandha", grade: "C",
        effect: t("A small-to-moderate improvement in sleep scores, strongest in people diagnosed with insomnia, at ≥600 mg/day for ≥8 weeks. Five small trials, mostly from Indian sites with links to extract manufacturers.",
                  "Amélioration petite à modérée des scores de sommeil, la plus nette chez les personnes diagnostiquées insomniaques, à ≥600 mg/j pendant ≥8 semaines. Cinq petits essais, surtout de sites indiens liés aux fabricants d'extraits."),
        dose: t("300–600 mg/day standardised root extract.", "300–600 mg/j d'extrait de racine standardisé."),
        studies: [
          { ref: "Cheah et al., PLoS One 2021", n: 400, design: t("meta-analysis, 5 RCTs", "méta-analyse, 5 ECR"),
            finding: t("overall sleep SMD −0.59 (−0.75 to −0.42), I² 62%; larger in insomnia, ≥600 mg, ≥8 weeks", "sommeil global DMS −0,59 (−0,75 à −0,42), I² 62 % ; plus marqué dans l'insomnie, ≥600 mg, ≥8 semaines"),
            url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0257843" },
        ],
        efsa: null,
        safety: "ashwagandha",
        caveats: t("Read the safety note before the dose.", "Lisez la note de sécurité avant la dose.") },
    ] },

  // --------------------------------------------------------- stress & anxiety
  { id: "stress", name: t("stress & anxiety", "stress & anxiété"),
    blurb: t("Where botanicals have their best evidence — and their loudest safety warnings.", "Là où les plantes ont leurs meilleures preuves — et leurs avertissements de sécurité les plus forts."),
    entries: [
      { sup: "ashwagandha", grade: "B",
        effect: t("Consistent reductions in perceived stress, anxiety scores and morning cortisol across a dozen trials. Effect sizes are moderate. Trials are short (30–90 days), mostly Indian, and often supported by the extract's manufacturer.",
                  "Réductions cohérentes du stress perçu, des scores d'anxiété et du cortisol matinal dans une douzaine d'essais. Effets modérés. Essais courts (30–90 jours), surtout indiens, souvent soutenus par le fabricant de l'extrait."),
        dose: t("300–600 mg/day standardised root extract (KSM-66, Sensoril, Shoden are the studied ones).", "300–600 mg/j d'extrait de racine standardisé (KSM-66, Sensoril, Shoden sont ceux étudiés)."),
        studies: [
          { ref: "Akhgarjand et al., Phytotherapy Research 2022", n: 1002, design: t("meta-analysis, 12 RCTs", "méta-analyse, 12 ECR"),
            finding: t("significant reduction in anxiety and stress scores", "réduction significative des scores d'anxiété et de stress"),
            url: "https://pubmed.ncbi.nlm.nih.gov/36017529/" },
          { ref: "Systematic review & meta-analysis, 2024", n: 558, design: t("meta-analysis, 9 RCTs", "méta-analyse, 9 ECR"),
            finding: t("perceived stress −4.7 points, anxiety −2.2, serum cortisol reduced; 125–600 mg/day for 30–90 days", "stress perçu −4,7 points, anxiété −2,2, cortisol sérique réduit ; 125–600 mg/j pendant 30–90 jours"),
            url: "https://pubmed.ncbi.nlm.nih.gov/39348746/" },
        ],
        efsa: t("None. Botanical claims are on hold under Reg. 1924/2006 — no ashwagandha claim is authorised.", "Aucune. Les allégations sur les plantes sont en attente sous le règlement 1924/2006 — aucune allégation ashwagandha n'est autorisée."),
        safety: "ashwagandha",
        caveats: t("The best-evidenced botanical on this page is also the one two European agencies have moved against. Both things are true.", "La plante la mieux étayée de cette page est aussi celle contre laquelle deux agences européennes ont agi. Les deux sont vrais.") },

      { sup: "magnesium", grade: "C",
        effect: t("Suggestive but poor-quality evidence for subjective anxiety. The authorised EFSA claim on \"psychological function\" describes a nutrient's role, not an anxiolytic effect.",
                  "Preuves suggestives mais de mauvaise qualité sur l'anxiété subjective. L'allégation EFSA autorisée sur les « fonctions psychologiques » décrit le rôle d'un nutriment, pas un effet anxiolytique."),
        dose: t("Trials: 75–360 mg/day.", "Essais : 75–360 mg/j."),
        studies: [
          { ref: "Boyle, Lawton & Dye, Nutrients 2017", n: null, design: t("systematic review, 18 studies", "revue systématique, 18 études"),
            finding: t("\"suggestive of a beneficial effect… the quality of the existing evidence is poor\"", "« suggère un effet bénéfique… la qualité des preuves existantes est mauvaise »"),
            url: "https://www.mdpi.com/2072-6643/9/5/429" },
        ],
        efsa: t("Authorised: \"contributes to normal psychological function\".", "Autorisée : « contribue à des fonctions psychologiques normales »."),
        caveats: null },

      { sup: "rhodiola", grade: "C",
        effect: t("Eleven small trials on physical and mental fatigue and stress; several positive, but two used no validated fatigue measure and the review declined to draw a conclusion.",
                  "Onze petits essais sur la fatigue physique et mentale et le stress ; plusieurs positifs, mais deux n'utilisaient aucune mesure validée de la fatigue et la revue a refusé de conclure."),
        dose: t("200–600 mg/day extract standardised to ~3% rosavins / 1% salidroside.", "200–600 mg/j d'extrait standardisé à ~3 % rosavines / 1 % salidroside."),
        studies: [
          { ref: "Ishaque et al., BMC Complement Altern Med 2012", n: 446, design: t("systematic review, 11 trials", "revue systématique, 11 essais"),
            finding: t("contradictory results, methodological limitations; no definite conclusion", "résultats contradictoires, limites méthodologiques ; aucune conclusion définitive"),
            url: "https://link.springer.com/article/10.1186/1472-6882-12-70" },
        ],
        efsa: null,
        caveats: t("Products vary enormously in standardisation; a trial's extract and a shelf product may share a name and little else.", "Les produits varient énormément en standardisation ; l'extrait d'un essai et un produit en rayon peuvent partager un nom et pas grand-chose d'autre.") },
    ] },

  // -------------------------------------------------------- muscle & strength
  { id: "muscle", name: t("muscle & strength", "muscle & force"),
    blurb: t("The best-evidenced corner of the whole supplement market. Two things work, both only with training.", "Le coin le mieux étayé de tout le marché des compléments. Deux choses marchent, toutes deux uniquement avec l'entraînement."),
    entries: [
      { sup: "creatine", grade: "A",
        effect: t("Around 1.1–1.4 kg more lean mass and measurably more strength than training alone, replicated across dozens of trials in young and old. Monohydrate is the studied form; nothing else has earned a premium.",
                  "Environ 1,1–1,4 kg de masse maigre en plus et davantage de force que l'entraînement seul, répliqué dans des dizaines d'essais chez jeunes et âgés. Le monohydrate est la forme étudiée ; aucune autre n'a mérité de surcoût."),
        dose: t("3–5 g/day, every day, no loading needed.", "3–5 g/j, chaque jour, sans phase de charge."),
        studies: [
          { ref: "Chilibeck et al., Open Access J Sports Med 2017", n: 721, design: t("meta-analysis, 22 RCTs, older adults", "méta-analyse, 22 ECR, adultes âgés"),
            finding: t("+1.37 kg lean tissue mass vs placebo, plus greater chest- and leg-press strength", "+1,37 kg de masse maigre vs placebo, plus de force au développé couché et à la presse"),
            url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5679696" },
          { ref: "Kreider et al., ISSN position stand, JISSN 2017", n: null, design: t("position stand", "position officielle"),
            finding: t("creatine monohydrate is the most effective ergogenic supplement available for high-intensity exercise capacity and lean mass", "le monohydrate de créatine est le complément ergogène le plus efficace disponible pour la capacité en effort intense et la masse maigre"),
            url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z" },
        ],
        efsa: t("Authorised: \"increases physical performance in successive bursts of short-term, high-intensity exercise\" (3 g/day).", "Autorisée : « augmente les performances physiques lors d'efforts répétés de haute intensité et de courte durée » (3 g/j)."),
        caveats: t("Cognition is an emerging use — small trials, promising, not yet at the level of the muscle evidence.", "La cognition est un usage émergent — petits essais, prometteurs, pas encore au niveau des preuves musculaires.") },

      { sup: "whey", grade: "A",
        effect: t("Adds about 2.5 kg to a one-rep max and 0.3 kg of fat-free mass on top of resistance training. Benefits flatten around 1.6 g/kg/day total protein and shrink with age.",
                  "Ajoute environ 2,5 kg à un maximum sur une répétition et 0,3 kg de masse maigre en plus de l'entraînement en résistance. Le bénéfice plafonne vers 1,6 g/kg/j de protéines totales et diminue avec l'âge."),
        dose: t("Enough to reach ~1.6 g/kg/day total; ~20–40 g per serving.", "De quoi atteindre ~1,6 g/kg/j au total ; ~20–40 g par prise."),
        studies: [
          { ref: "Morton et al., Br J Sports Med 2018", n: 1863, design: t("meta-analysis & meta-regression, 49 RCTs", "méta-analyse et méta-régression, 49 ECR"),
            finding: t("1RM +2.49 kg, fat-free mass +0.30 kg; plateau ~1.6 g/kg/day; effect reduced with age", "1RM +2,49 kg, masse maigre +0,30 kg ; plateau ~1,6 g/kg/j ; effet réduit avec l'âge"),
            url: "https://pubmed.ncbi.nlm.nih.gov/28698222/" },
        ],
        efsa: t("Authorised: \"protein contributes to growth and maintenance of muscle mass\".", "Autorisée : « les protéines contribuent au développement et au maintien de la masse musculaire »."),
        caveats: t("It is protein that works, not whey specifically. Whey is a convenient, complete, fast source — food gets you the same place.", "C'est la protéine qui agit, pas la whey en particulier. La whey est une source pratique, complète et rapide — l'alimentation mène au même endroit.") },
    ] },

  // -------------------------------------------------------------------- bone
  { id: "bone", name: t("bone", "os"),
    blurb: t("The vitamin D story is the clearest example of \"deficiency correction works, blanket supplementation does not\".", "L'histoire de la vitamine D est l'exemple le plus clair de « corriger une carence marche, supplémenter tout le monde non »."),
    entries: [
      { sup: "vitamin_d3", grade: "D",
        effect: t("In 25,871 generally healthy adults not selected for deficiency, 2,000 IU/day for five years did not reduce fractures — total, hip or otherwise. For people who are actually deficient, correcting it remains standard care.",
                  "Chez 25 871 adultes globalement en bonne santé non sélectionnés pour carence, 2 000 UI/j pendant cinq ans n'ont pas réduit les fractures — totales, de hanche ou autres. Chez les personnes réellement carencées, corriger la carence reste la règle."),
        dose: t("800–2,000 IU/day if low; 4,000 IU is the EFSA upper limit. Test before you dose.", "800–2 000 UI/j si taux bas ; 4 000 UI est la limite supérieure EFSA. Dosez avant de supplémenter."),
        studies: [
          { ref: "LeBoff et al., NEJM 2022 (VITAL)", n: 25871, design: t("RCT, 5.3 years median", "ECR, 5,3 ans en médiane"),
            finding: t("no lower risk of total, non-vertebral or hip fractures vs placebo", "pas de risque réduit de fractures totales, non vertébrales ou de hanche vs placebo"),
            url: "https://www.nejm.org/doi/full/10.1056/NEJMoa2202106" },
        ],
        efsa: t("Authorised: normal bones and teeth, normal calcium absorption, normal muscle function, normal immune function.", "Autorisées : ossature et dents normales, absorption normale du calcium, fonction musculaire normale, fonction immunitaire normale."),
        caveats: t("The grade is for fracture prevention in the general population. Deficiency itself is common in France in winter, and its correction is a different — well-supported — question.", "La note porte sur la prévention des fractures en population générale. La carence est fréquente en France l'hiver, et sa correction est une autre question — bien étayée.") },

      { sup: "vitamin_k2", grade: "C",
        effect: t("Pooled trials show a modest gain in lumbar-spine bone density, mostly in Japanese postmenopausal women on high-dose MK-4. Fracture data are thin, and the popular \"K2 keeps calcium out of your arteries\" claim failed its randomised tests.",
                  "Les essais poolés montrent un gain modeste de densité osseuse lombaire, surtout chez des Japonaises ménopausées sous MK-4 à forte dose. Les données sur les fractures sont minces, et la promesse populaire « la K2 garde le calcium hors des artères » a échoué à ses tests randomisés."),
        dose: t("Trials: 45 mg/day MK-4 (a pharmaceutical dose) or 90–375 µg/day MK-7.", "Essais : 45 mg/j de MK-4 (dose pharmaceutique) ou 90–375 µg/j de MK-7."),
        studies: [
          { ref: "Frontiers in Public Health 2022", n: 6425, design: t("meta-analysis, 16 RCTs, postmenopausal women", "méta-analyse, 16 ECR, femmes ménopausées"),
            finding: t("lumbar-spine BMD significantly improved; fracture reduction not established", "DMO lombaire significativement améliorée ; réduction des fractures non établie"),
            url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9403798/" },
          { ref: "Diederichsen et al., Circulation 2022", n: null, design: t("RCT, K2 + D vs placebo, aortic valve calcification, 2 years", "ECR, K2 + D vs placebo, calcification valvulaire aortique, 2 ans"),
            finding: t("no significant effect on calcification progression", "aucun effet significatif sur la progression de la calcification"),
            url: "https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.121.057008" },
        ],
        efsa: t("Authorised: \"vitamin K contributes to the maintenance of normal bones\" and \"to normal blood clotting\".", "Autorisées : « la vitamine K contribue au maintien d'une ossature normale » et « à une coagulation sanguine normale »."),
        caveats: t("Anyone on a vitamin-K antagonist (warfarin, fluindione) must not take this without their prescriber.", "Toute personne sous antivitamine K (warfarine, fluindione) ne doit pas en prendre sans son prescripteur.") },
    ] },

  // ------------------------------------------------------------ heart & lipids
  { id: "heart", name: t("heart & blood pressure", "cœur & tension"),
    blurb: t("Prescription-dose EPA did something; supplement-dose fish oil, in the largest trial ever run, did not.", "L'EPA à dose pharmaceutique a fait quelque chose ; l'huile de poisson à dose complément, dans le plus grand essai jamais mené, non."),
    entries: [
      { sup: "omega3", grade: "C",
        effect: t("Triglyceride lowering is robust and dose-dependent — that part is settled. Cardiovascular events are not: 4 g/day of purified EPA cut events by 25% in high-risk patients (REDUCE-IT), while EPA+DHA at similar doses (STRENGTH) and 1 g/day fish oil in the general population (VITAL) did nothing. Shelf products are VITAL-dose products.",
                  "La baisse des triglycérides est robuste et dose-dépendante — ce point est tranché. Les événements cardiovasculaires non : 4 g/j d'EPA purifié ont réduit les événements de 25 % chez des patients à haut risque (REDUCE-IT), tandis qu'EPA+DHA à dose similaire (STRENGTH) et 1 g/j d'huile de poisson en population générale (VITAL) n'ont rien fait. Les produits en rayon sont des produits à dose VITAL."),
        dose: t("250 mg/day EPA+DHA meets the EFSA heart claim; 2 g/day for the triglyceride claim.", "250 mg/j d'EPA+DHA satisfont l'allégation cœur EFSA ; 2 g/j pour l'allégation triglycérides."),
        studies: [
          { ref: "Bhatt et al., NEJM 2019 (REDUCE-IT)", n: 8179, design: t("RCT, icosapent ethyl 4 g/day, high-risk patients", "ECR, icosapent éthyl 4 g/j, patients à haut risque"),
            finding: t("major cardiovascular events −25% relative; mineral-oil placebo since debated", "événements cardiovasculaires majeurs −25 % en relatif ; placebo à l'huile minérale contesté depuis"),
            url: "https://www.nejm.org/doi/full/10.1056/NEJMoa1812792" },
          { ref: "Nicholls et al., JAMA 2020 (STRENGTH)", n: 13078, design: t("RCT, EPA+DHA carboxylic acid 4 g/day", "ECR, EPA+DHA acide carboxylique 4 g/j"),
            finding: t("no reduction in cardiovascular events; stopped for futility", "pas de réduction des événements cardiovasculaires ; arrêté pour futilité"),
            url: "https://jamanetwork.com/journals/jama/fullarticle/2773120" },
          { ref: "Manson et al., NEJM 2019 (VITAL)", n: 25871, design: t("RCT, 1 g/day fish oil, general population", "ECR, 1 g/j d'huile de poisson, population générale"),
            finding: t("no reduction in major cardiovascular events or cancer", "pas de réduction des événements cardiovasculaires majeurs ni du cancer"),
            url: "https://www.nejm.org/doi/full/10.1056/NEJMoa1811403" },
        ],
        efsa: t("Authorised: EPA+DHA \"contribute to the normal function of the heart\" (250 mg/day), \"maintenance of normal blood triglyceride levels\" (2 g/day), \"normal blood pressure\" (3 g/day).", "Autorisées : EPA+DHA « contribuent au fonctionnement normal du cœur » (250 mg/j), « maintien d'une triglycéridémie normale » (2 g/j), « pression artérielle normale » (3 g/j)."),
        caveats: t("The one positive trial used a pharmaceutical, not a supplement, and its placebo is still argued about. Buying fish oil for your heart is buying the VITAL result.", "Le seul essai positif utilisait un médicament, pas un complément, et son placebo est encore débattu. Acheter de l'huile de poisson pour son cœur, c'est acheter le résultat VITAL.") },

      { sup: "magnesium", grade: "C",
        effect: t("A real but small blood-pressure reduction — about 2 mmHg systolic — across 34 trials.", "Une baisse de tension réelle mais petite — environ 2 mmHg systolique — sur 34 essais."),
        dose: t("Trials: median ~370 mg/day for ~3 months.", "Essais : médiane ~370 mg/j pendant ~3 mois."),
        studies: [
          { ref: "Zhang et al., Hypertension 2016", n: 2028, design: t("meta-analysis, 34 RCTs", "méta-analyse, 34 ECR"),
            finding: t("systolic −2.0 mmHg, diastolic −1.8 mmHg", "systolique −2,0 mmHg, diastolique −1,8 mmHg"),
            url: "https://www.ahajournals.org/doi/10.1161/HYPERTENSIONAHA.116.07664" },
        ],
        efsa: t("Authorised: \"contributes to electrolyte balance\".", "Autorisée : « contribue à l'équilibre électrolytique »."),
        caveats: t("Two millimetres is real and is also less than a brisk walk.", "Deux millimètres, c'est réel, et c'est aussi moins qu'une marche rapide.") },

      { sup: "multivitamin", grade: "D",
        effect: t("Fourteen thousand physicians, eleven years, a daily multivitamin: no effect on major cardiovascular events at all.", "Quatorze mille médecins, onze ans, une multivitamine quotidienne : aucun effet sur les événements cardiovasculaires majeurs."),
        dose: null,
        studies: [
          { ref: "Sesso et al., JAMA 2012 (Physicians' Health Study II)", n: 14641, design: t("RCT, 11.2 years", "ECR, 11,2 ans"),
            finding: t("major cardiovascular events HR 1.01 (0.91–1.10)", "événements cardiovasculaires majeurs HR 1,01 (0,91–1,10)"),
            url: "https://jamanetwork.com/journals/jama/fullarticle/1389615" },
        ],
        efsa: null, caveats: null },
    ] },

  // ------------------------------------------------------ immunity & infections
  { id: "immunity", name: t("immunity & colds", "immunité & rhumes"),
    blurb: t("\"Supports immunity\" is an authorised phrase for several nutrients. Whether you get fewer or shorter colds is a separate, and mostly disappointing, question.", "« Soutient l'immunité » est une formule autorisée pour plusieurs nutriments. Avoir moins de rhumes, ou des rhumes plus courts, est une autre question — et surtout décevante."),
    entries: [
      { sup: "vitamin_d3", grade: "C",
        effect: t("The 2017 pooled analysis found ~12% fewer people with at least one respiratory infection, strongest in those who were deficient and dosed daily. The 2025 update with newer trials found the overall effect had shrunk to non-significance.",
                  "L'analyse poolée de 2017 trouvait ~12 % de personnes en moins avec au moins une infection respiratoire, surtout chez les carencés dosés quotidiennement. La mise à jour 2025 avec de nouveaux essais trouve un effet global rétréci jusqu'à la non-significativité."),
        dose: t("Daily 800–2,000 IU if low. Bolus doses showed no benefit.", "800–2 000 UI/j si taux bas. Les doses massives espacées n'ont montré aucun bénéfice."),
        studies: [
          { ref: "Martineau et al., BMJ 2017", n: 11321, design: t("individual-participant-data meta-analysis, 25 RCTs", "méta-analyse sur données individuelles, 25 ECR"),
            finding: t("odds of ≥1 acute respiratory infection −12%; NNT 33; greatest benefit in the deficient and with daily/weekly dosing", "risque d'au moins 1 infection respiratoire aiguë −12 % ; NNT 33 ; bénéfice maximal chez les carencés et en prise quotidienne/hebdomadaire"),
            url: "https://www.bmj.com/content/356/bmj.i6583" },
          { ref: "Jolliffe et al., Lancet Diabetes Endocrinol 2025", n: null, design: t("updated meta-analysis, stratified aggregate data", "méta-analyse actualisée, données agrégées stratifiées"),
            finding: t("overall protective effect no longer statistically significant", "effet protecteur global plus statistiquement significatif"),
            url: "https://www.thelancet.com/journals/landia/article/PIIS2213-8587(24)00348-6/fulltext" },
        ],
        efsa: t("Authorised: \"contributes to the normal function of the immune system\".", "Autorisée : « contribue au fonctionnement normal du système immunitaire »."),
        caveats: null },

      { sup: "vitamin_c", grade: "C",
        effect: t("Taking it every day does not stop you catching colds. It shortens them slightly — 8% in adults, 14% in children. Starting it once the cold has begun does nothing consistent.",
                  "En prendre chaque jour n'empêche pas d'attraper des rhumes. Cela les raccourcit légèrement — 8 % chez l'adulte, 14 % chez l'enfant. Commencer une fois le rhume déclaré ne fait rien de cohérent."),
        dose: t("≥200 mg/day, regularly. Above ~1 g/day, absorption falls and the EFSA limit is 1,000 mg supplemental.", "≥200 mg/j, régulièrement. Au-delà de ~1 g/j l'absorption chute, et la limite EFSA est de 1 000 mg en complément."),
        studies: [
          { ref: "Hemilä & Chalker, Cochrane 2013", n: 11306, design: t("Cochrane review, 29 trial comparisons", "revue Cochrane, 29 comparaisons"),
            finding: t("no effect on incidence in the general population; duration −8% adults, −14% children with regular use", "aucun effet sur l'incidence en population générale ; durée −8 % adultes, −14 % enfants en prise régulière"),
            url: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD000980.pub4/full" },
        ],
        efsa: t("Authorised: normal immune function, reduction of tiredness and fatigue, normal collagen formation, increases iron absorption.", "Autorisées : fonction immunitaire normale, réduction de la fatigue, formation normale de collagène, augmente l'absorption du fer."),
        caveats: t("The exception in the Cochrane data: people under heavy physical stress (marathoners, soldiers in the cold) halved their cold incidence. Everyone else did not.", "L'exception dans les données Cochrane : les personnes sous stress physique intense (marathoniens, soldats au froid) ont divisé par deux l'incidence. Pas les autres.") },

      { sup: "zinc", grade: "C",
        effect: t("Lozenges at ≥75 mg/day, started within 24 hours, shortened colds by about a third in seven trials. The 2024 Cochrane review is more cautious: maybe two days shorter, low certainty, and more nausea and bad taste.",
                  "Les pastilles à ≥75 mg/j, commencées sous 24 h, ont raccourci les rhumes d'environ un tiers dans sept essais. La revue Cochrane 2024 est plus prudente : peut-être deux jours de moins, certitude faible, et plus de nausées et de mauvais goût."),
        dose: t("Lozenges only, for the duration of the cold. The 25 mg/day EFSA limit is for long-term intake — not for a 5-day lozenge course.", "Pastilles uniquement, le temps du rhume. La limite EFSA de 25 mg/j vaut pour la prise au long cours — pas pour 5 jours de pastilles."),
        studies: [
          { ref: "Hemilä, Open Forum Infect Dis 2017", n: null, design: t("individual-patient meta-analysis, 7 RCTs, zinc acetate/gluconate lozenges", "méta-analyse sur données individuelles, 7 ECR, pastilles d'acétate/gluconate de zinc"),
            finding: t("cold duration −33% (95% CI 21–45%) at >75 mg/day", "durée du rhume −33 % (IC 95 % 21–45 %) à >75 mg/j"),
            url: "https://academic.oup.com/ofid/article/4/2/ofx059/3098578" },
          { ref: "Nault et al., Cochrane 2024", n: null, design: t("Cochrane review", "revue Cochrane"),
            finding: t("may shorten colds by ~2 days; low-certainty; more adverse events", "raccourcit peut-être le rhume de ~2 jours ; certitude faible ; plus d'effets indésirables"),
            url: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.cd014914.pub2/full" },
        ],
        efsa: t("Authorised: normal immune function, normal cognitive function, normal fertility and reproduction, maintenance of normal testosterone levels, normal skin, hair and nails.", "Autorisées : fonction immunitaire normale, fonction cognitive normale, fertilité et reproduction normales, maintien d'un taux normal de testostérone, peau, cheveux et ongles normaux."),
        caveats: t("A zinc capsule swallowed daily is a different product from a lozenge dissolved in the mouth, and only the lozenge has cold evidence.", "Une gélule de zinc avalée chaque jour est un autre produit qu'une pastille dissoute en bouche, et seule la pastille a des preuves sur le rhume.") },

      { sup: "probiotics", grade: "B",
        effect: t("For one specific thing — diarrhoea caused by antibiotics — the evidence is good: about a third fewer cases in adults, and in children the Cochrane review calls it moderate-certainty. For \"immunity\" in general, no.",
                  "Pour une chose précise — la diarrhée causée par les antibiotiques — les preuves sont bonnes : environ un tiers de cas en moins chez l'adulte, et chez l'enfant la revue Cochrane parle de certitude modérée. Pour « l'immunité » en général, non."),
        dose: t("Trials mostly used ≥5–10 billion CFU/day, started with the antibiotic. Strain matters.", "Les essais ont surtout utilisé ≥5–10 milliards d'UFC/j, commencés avec l'antibiotique. La souche compte."),
        studies: [
          { ref: "Goodman et al., BMJ Open 2021", n: null, design: t("meta-analysis, adults", "méta-analyse, adultes"),
            finding: t("antibiotic-associated diarrhoea risk −37% with co-administration", "risque de diarrhée associée aux antibiotiques −37 % en co-administration"),
            url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8362734/" },
          { ref: "Guo et al., Cochrane 2019", n: 6352, design: t("Cochrane review, 33 studies, children", "revue Cochrane, 33 études, enfants"),
            finding: t("moderate-certainty evidence that probiotics reduce antibiotic-associated diarrhoea", "preuves de certitude modérée que les probiotiques réduisent la diarrhée associée aux antibiotiques"),
            url: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD004827.pub5/full" },
        ],
        efsa: t("None. No probiotic health claim has been authorised in the EU; the word \"probiotic\" itself is treated as an implied claim in several member states.", "Aucune. Aucune allégation probiotique n'a été autorisée dans l'UE ; le mot « probiotique » lui-même est traité comme une allégation implicite dans plusieurs États membres."),
        caveats: null },
    ] },

  // ------------------------------------------------------------- mood & mind
  { id: "mind", name: t("memory & mood", "mémoire & humeur"),
    blurb: t("Thin ground. One genuinely large, well-run trial programme, and it is the one most people would not expect.", "Terrain mince. Un seul programme d'essais vraiment grand et bien mené, et c'est celui que peu de gens attendraient."),
    entries: [
      { sup: "multivitamin", grade: "C",
        effect: t("In COSMOS, two years of a daily multivitamin improved episodic memory in adults over 60 — a small effect, from a single trial programme, with the product supplied by its manufacturer. Interesting, not yet settled.",
                  "Dans COSMOS, deux ans de multivitamine quotidienne ont amélioré la mémoire épisodique chez des adultes de plus de 60 ans — petit effet, un seul programme d'essais, produit fourni par son fabricant. Intéressant, pas encore tranché."),
        dose: null,
        studies: [
          { ref: "Vyas et al., Am J Clin Nutr 2024 (COSMOS)", n: 21442, design: t("RCT; clinic subcohort 573 + meta-analysis of 3 COSMOS cognitive substudies", "ECR ; sous-cohorte clinique 573 + méta-analyse de 3 sous-études cognitives COSMOS"),
            finding: t("episodic memory significantly improved vs placebo over 2 years", "mémoire épisodique significativement améliorée vs placebo sur 2 ans"),
            url: "https://ajcn.nutrition.org/article/S0002-9165(23)66342-7/fulltext" },
        ],
        efsa: null,
        caveats: t("Note the contrast with the heart row: the same kind of product, a decade earlier, did nothing for cardiovascular events in 14,641 men.", "Notez le contraste avec la ligne cœur : le même type de produit, dix ans plus tôt, n'a rien fait sur les événements cardiovasculaires chez 14 641 hommes.") },

      { sup: "creatine", grade: "C",
        effect: t("Small trials suggest modest gains in memory and processing speed, more so in older adults and under sleep deprivation. Promising and early.", "De petits essais suggèrent des gains modestes de mémoire et de vitesse de traitement, surtout chez les adultes âgés et en privation de sommeil. Prometteur et précoce."),
        dose: t("3–5 g/day, same as for muscle.", "3–5 g/j, comme pour le muscle."),
        studies: [],
        efsa: null,
        caveats: t("No large trial yet. Listed because the direction is consistent and the cost of being wrong is a few grams of a very safe powder.", "Aucun grand essai encore. Listé parce que la direction est cohérente et que le coût d'une erreur est quelques grammes d'une poudre très sûre.") },
    ] },

  // ------------------------------------------------------------ joints & pain
  { id: "joints", name: t("joints & pain", "articulations & douleur"),
    blurb: t("Curcumin is the botanical with the best trial base for a specific complaint — and a specific safety history to go with it.", "La curcumine est la plante avec la meilleure base d'essais pour une plainte précise — et un historique de sécurité précis qui va avec."),
    entries: [
      { sup: "curcumin", grade: "B",
        effect: t("Across 23 trials in knee osteoarthritis, curcumin lowered pain and stiffness scores versus placebo. Trials are short (8–12 weeks), formulations differ wildly, and several are small or industry-linked.",
                  "Sur 23 essais dans l'arthrose du genou, la curcumine a réduit les scores de douleur et de raideur vs placebo. Essais courts (8–12 semaines), formulations très variables, plusieurs petits ou liés à l'industrie."),
        dose: t("Plain 95% extract: 1,000–1,500 mg curcuminoids/day. Enhanced-absorption forms (Meriva, BCM-95, Turmipure) use their own studied doses, usually 250–500 mg.", "Extrait simple à 95 % : 1 000–1 500 mg de curcuminoïdes/j. Les formes à absorption améliorée (Meriva, BCM-95, Turmipure) utilisent leurs propres doses étudiées, généralement 250–500 mg."),
        studies: [
          { ref: "Bayesian network meta-analysis, J Ethnopharmacology 2023", n: 2175, design: t("network meta-analysis, 23 studies, 7 countries", "méta-analyse en réseau, 23 études, 7 pays"),
            finding: t("VAS pain and total WOMAC significantly lower than placebo", "douleur EVA et WOMAC total significativement plus bas que le placebo"),
            url: "https://www.sciencedirect.com/science/article/pii/S0378874123013636" },
        ],
        efsa: null,
        safety: "curcumin",
        caveats: t("Raw turmeric powder is not the product the trials used. Absorption of plain curcumin is poor; every branded form exists to fix that, and each has its own — usually manufacturer-run — trial.", "La poudre de curcuma brute n'est pas le produit des essais. L'absorption de la curcumine simple est mauvaise ; chaque forme brevetée existe pour y remédier, avec son propre essai — généralement mené par le fabricant.") },

      { sup: "collagen", grade: "C",
        effect: t("A handful of small trials report less activity-related joint pain at 5–10 g/day. Mostly manufacturer-funded; the skin-row funding pattern applies here too.", "Une poignée de petits essais rapportent moins de douleurs articulaires liées à l'activité à 5–10 g/j. Surtout financés par les fabricants ; le schéma de financement de la ligne peau s'applique ici aussi."),
        dose: t("5–10 g/day hydrolysed peptides.", "5–10 g/j de peptides hydrolysés."),
        studies: [],
        efsa: null, caveats: null },
    ] },

  // -------------------------------------------------------------------- skin
  { id: "skin", name: t("skin", "peau"),
    blurb: t("A textbook case of why funding is a variable, not a footnote.", "Un cas d'école montrant pourquoi le financement est une variable, pas une note de bas de page."),
    entries: [
      { sup: "collagen", grade: "C",
        effect: t("Pooled, 26 trials say hydration and elasticity improve. Re-analysed by who paid: in trials without industry funding, and in the higher-quality trials, the effect disappears. Two meta-analyses, two years apart, and the second one changes the answer.",
                  "Poolés, 26 essais disent que l'hydratation et l'élasticité s'améliorent. Réanalysés selon qui a payé : dans les essais sans financement industriel, et dans les essais de meilleure qualité, l'effet disparaît. Deux méta-analyses à deux ans d'écart, et la seconde change la réponse."),
        dose: t("2.5–10 g/day in the trials.", "2,5–10 g/j dans les essais."),
        studies: [
          { ref: "Indian J Dermatol Venereol Leprol 2023", n: 1721, design: t("meta-analysis, 26 RCTs", "méta-analyse, 26 ECR"),
            finding: t("hydration and elasticity significantly improved vs placebo", "hydratation et élasticité significativement améliorées vs placebo"),
            url: "https://ijdvl.com/effects-of-collagen-based-supplements-on-skins-hydration-and-elasticity-a-systematic-review-and-meta-analysis/" },
          { ref: "Am J Med 2025", n: 1474, design: t("meta-analysis, 23 RCTs, stratified by funding and quality", "méta-analyse, 23 ECR, stratifiée par financement et qualité"),
            finding: t("overall benefit; NO effect in non-industry-funded trials; NO effect in high-quality trials", "bénéfice global ; AUCUN effet dans les essais sans financement industriel ; AUCUN effet dans les essais de haute qualité"),
            url: "https://www.amjmed.com/article/S0002-9343(25)00283-9/abstract" },
        ],
        efsa: t("None authorised for collagen. Vitamin C carries \"normal collagen formation for the normal function of skin\".", "Aucune autorisée pour le collagène. La vitamine C porte « formation normale de collagène pour la fonction normale de la peau »."),
        caveats: null },

      { sup: "biotin", grade: "D",
        effect: t("Every published case of biotin helping hair or nails involved a person with an underlying deficiency or disorder. In healthy people there is no randomised trial showing anything. Meanwhile the 5–10 mg doses sold for hair — hundreds of times the reference intake — falsify common blood tests.",
                  "Chaque cas publié où la biotine a aidé cheveux ou ongles concernait une personne avec une carence ou une pathologie sous-jacente. Chez les personnes en bonne santé, aucun essai randomisé ne montre quoi que ce soit. Pendant ce temps, les doses de 5–10 mg vendues pour les cheveux — des centaines de fois l'apport de référence — faussent des analyses sanguines courantes."),
        dose: t("Reference intake 40 µg/day. Hair products sell 5,000–10,000 µg.", "Apport de référence 40 µg/j. Les produits « cheveux » en vendent 5 000–10 000."),
        studies: [
          { ref: "Patel et al., Skin Appendage Disorders 2017", n: null, design: t("systematic review of case reports and RCTs", "revue systématique des cas rapportés et ECR"),
            finding: t("18 cases, all with an underlying pathology; no RCT in healthy individuals", "18 cas, tous avec une pathologie sous-jacente ; aucun ECR chez des sujets sains"),
            url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5582478/" },
        ],
        efsa: t("Authorised: \"contributes to the maintenance of normal hair\" and \"normal skin\" — maintenance claims, true in deficiency.", "Autorisées : « contribue au maintien de cheveux normaux » et « d'une peau normale » — allégations de maintien, vraies en cas de carence."),
        safety: "biotin",
        caveats: null },
    ] },

  // --------------------------------------------------------------------- gut
  { id: "gut", name: t("gut", "intestin"),
    blurb: t("Probiotics are the rare category where \"it depends on the strain\" is a literal finding, not a hedge.", "Les probiotiques sont la rare catégorie où « ça dépend de la souche » est un résultat littéral, pas une esquive."),
    entries: [
      { sup: "probiotics", grade: "C",
        effect: t("For IBS, 53 trials show a modest improvement in global symptoms, with heterogeneity above 90% — meaning the average hides strains that work and strains that do not. See the immunity row for the one strong probiotic use.",
                  "Pour le SII, 53 essais montrent une amélioration modeste des symptômes globaux, avec une hétérogénéité au-delà de 90 % — l'average cache des souches qui marchent et d'autres non. Voir la ligne immunité pour le seul usage probiotique solide."),
        dose: t("Strain-specific; a product should name its strains with codes, not just species.", "Spécifique à la souche ; un produit doit nommer ses souches avec leurs codes, pas seulement l'espèce."),
        studies: [
          { ref: "Ford et al., Aliment Pharmacol Ther 2018", n: 5545, design: t("meta-analysis, 53 RCTs, IBS", "méta-analyse, 53 ECR, SII"),
            finding: t("modest benefit on global symptoms, pain and bloating; which strains is unclear", "bénéfice modeste sur les symptômes globaux, la douleur et le ballonnement ; quelles souches, on ne sait pas"),
            url: "https://pubmed.ncbi.nlm.nih.gov/30294792/" },
          { ref: "Network meta-analysis, 2024", n: 5531, design: t("network meta-analysis, 43 RCTs", "méta-analyse en réseau, 43 ECR"),
            finding: t("outcome-specific efficacy differs by strain and mixture; I² > 90%", "efficacité par critère différente selon souche et mélange ; I² > 90 %"),
            url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10490209/" },
        ],
        efsa: null, caveats: null },
    ] },

  // ------------------------------------------------------------ energy & fatigue
  { id: "energy", name: t("energy & fatigue", "énergie & fatigue"),
    blurb: t("\"Reduces tiredness and fatigue\" is one of the most-printed authorised claims. It describes what a deficiency does, and if you are not deficient it describes nothing.", "« Réduit la fatigue » est l'une des allégations autorisées les plus imprimées. Elle décrit ce que fait une carence ; si vous n'êtes pas carencé, elle ne décrit rien."),
    entries: [
      { sup: "magnesium", grade: "C",
        effect: t("The claim is authorised; the trials in people who are not deficient are not there. The honest sentence is: if your intake is low, fixing it helps; if it is not, this is not an energy supplement.", "L'allégation est autorisée ; les essais chez les non-carencés n'existent pas. La phrase honnête : si votre apport est bas, le corriger aide ; sinon, ce n'est pas un complément énergie."),
        dose: null, studies: [],
        efsa: t("Authorised: \"contributes to a reduction of tiredness and fatigue\".", "Autorisée : « contribue à réduire la fatigue »."),
        caveats: t("The supplements that actually fix fatigue when a cause is found are iron and vitamin B12 — after a blood test, not before. Neither is a guessing-game purchase.", "Les compléments qui corrigent réellement la fatigue quand une cause est trouvée sont le fer et la vitamine B12 — après une prise de sang, pas avant. Aucun des deux ne s'achète à l'aveugle.") },

      { sup: "vitamin_b12", grade: "B",
        effect: t("For people who are actually low — vegans, older adults with poor absorption, long-term metformin or acid-suppressant users — oral B12 works, and works as well as injections. For everyone else it does nothing measurable: trials in adults with only marginal levels found no cognitive or neurological benefit.",
                  "Pour les personnes réellement carencées — véganes, personnes âgées à absorption réduite, prise longue de metformine ou d'antiacides — la B12 orale marche, et aussi bien que les injections. Pour les autres, rien de mesurable : les essais chez des adultes aux taux seulement limites ne trouvent aucun bénéfice cognitif ou neurologique."),
        dose: t("Vegans: 50–100 µg/day or 2,000 µg/week. Reference intake 4 µg/day.", "Véganes : 50–100 µg/j ou 2 000 µg/semaine. Apport de référence 4 µg/j."),
        studies: [
          { ref: "Niklewicz et al., Nutrition Bulletin 2024", n: null, design: t("meta-analysis, functional B12 status in adult vegans", "méta-analyse, statut fonctionnel en B12 chez les véganes adultes"),
            finding: t("vegans show lower serum B12 and holotranscobalamin and higher methylmalonic acid and homocysteine than omnivores — functional deficiency, not just low intake", "les véganes ont une B12 sérique et une holotranscobalamine plus basses, un acide méthylmalonique et une homocystéine plus élevés que les omnivores — carence fonctionnelle, pas seulement apport bas"),
            url: "https://onlinelibrary.wiley.com/doi/full/10.1111/nbu.12712" },
          { ref: "Dangour et al., Am J Clin Nutr 2015", n: 201, design: t("RCT, older adults with moderately low B12, 12 months", "ECR, adultes âgés à B12 modérément basse, 12 mois"),
            finding: t("no effect on neurological or cognitive function", "aucun effet sur la fonction neurologique ou cognitive"),
            url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4548176/" },
        ],
        efsa: t("Authorised: normal energy-yielding metabolism, normal red blood cell formation, reduction of tiredness and fatigue, normal psychological function, normal nervous-system function.", "Autorisées : métabolisme énergétique normal, formation normale des globules rouges, réduction de la fatigue, fonctions psychologiques normales, fonction nerveuse normale."),
        caveats: t("The one vitamin on this page where a vegan reader should stop reading and buy it. Cyanocobalamin and methylcobalamin both work; the cheap one is fine.", "La seule vitamine de cette page où une personne végane devrait arrêter de lire et l'acheter. Cyanocobalamine et méthylcobalamine marchent toutes deux ; la moins chère convient.") },

      { sup: "rhodiola", grade: "C",
        effect: t("See the stress row: 11 small trials, several positive, methodologically weak.", "Voir la ligne stress : 11 petits essais, plusieurs positifs, méthodologiquement faibles."),
        dose: t("200–600 mg/day standardised extract.", "200–600 mg/j d'extrait standardisé."),
        studies: [
          { ref: "Ishaque et al., BMC Complement Altern Med 2012", n: 446, design: t("systematic review, 11 trials", "revue systématique, 11 essais"),
            finding: t("3 of 5 mental-fatigue trials positive; two used no validated measure", "3 des 5 essais sur la fatigue mentale positifs ; deux sans mesure validée"),
            url: "https://link.springer.com/article/10.1186/1472-6882-12-70" },
        ],
        efsa: null, caveats: null },
    ] },

  // ------------------------------------------------------------- testosterone
  { id: "testosterone", name: t("testosterone", "testostérone"),
    blurb: t("The best-funded corner of the market and the worst-evidenced. Most of what is sold here has been tested and did not raise testosterone; the two that moved a blood value did so in small, mostly manufacturer-linked trials, and none has shown a change in muscle, strength or libido that a reader would notice.",
             "Le coin du marché le mieux financé et le moins étayé. La plupart de ce qui se vend ici a été testé et n'a pas augmenté la testostérone ; les deux qui ont déplacé une valeur sanguine l'ont fait dans de petits essais souvent liés au fabricant, et aucun n'a montré un changement de muscle, de force ou de libido perceptible."),
    entries: [
      { sup: "tribulus", grade: "D",
        effect: t("The most-sold \"testosterone herb\" does not raise testosterone in humans. A 2014 systematic review found the marketing claims unsubstantiated; the effect exists in animal studies and in combination products, never for tribulus alone in men.",
                  "La « plante à testostérone » la plus vendue n'augmente pas la testostérone chez l'humain. Une revue systématique de 2014 juge les promesses marketing infondées ; l'effet existe chez l'animal et dans des produits combinés, jamais pour le tribulus seul chez l'homme."),
        dose: null,
        studies: [
          { ref: "Qureshi et al., J Dietary Supplements 2014", n: null, design: t("systematic review", "revue systématique"),
            finding: t("\"ineffective for increasing testosterone levels in humans, thus marketing claims are unsubstantiated\"", "« inefficace pour augmenter la testostérone chez l'humain ; les promesses marketing sont infondées »"),
            url: "https://www.tandfonline.com/doi/abs/10.3109/19390211.2014.887602" },
          { ref: "Nutrients 2025, systematic review of clinical trials", n: null, design: t("systematic review, erectile function and testosterone", "revue systématique, fonction érectile et testostérone"),
            finding: t("no consistent effect on testosterone; some signal on erectile scores in small trials", "aucun effet cohérent sur la testostérone ; un signal sur les scores érectiles dans de petits essais"),
            url: "https://www.mdpi.com/2072-6643/17/7/1275" },
        ],
        efsa: null, caveats: null },

      { sup: "fenugreek", grade: "C",
        effect: t("Four small trials, pooled, show a rise in total testosterone. Most used one branded extract (Testofen) and were run or funded by its maker; whether the rise changes anything a person feels is not established.",
                  "Quatre petits essais, poolés, montrent une hausse de la testostérone totale. La plupart utilisent un extrait breveté (Testofen) et ont été menés ou financés par son fabricant ; que cette hausse change quelque chose de ressenti n'est pas établi."),
        dose: t("500–600 mg/day standardised seed extract in the trials.", "500–600 mg/j d'extrait de graines standardisé dans les essais."),
        studies: [
          { ref: "Mansoori et al., Phytotherapy Research 2020", n: null, design: t("meta-analysis, 4 trials", "méta-analyse, 4 essais"),
            finding: t("significant effect on serum total testosterone", "effet significatif sur la testostérone totale sérique"),
            url: "https://pubmed.ncbi.nlm.nih.gov/32048383/" },
        ],
        efsa: null,
        caveats: t("Four trials is a thin base for a hormonal claim, and the funding pattern matters here as much as it does for collagen.", "Quatre essais, c'est une base mince pour une promesse hormonale, et le schéma de financement compte ici autant que pour le collagène.") },

      { sup: "tongkat_ali", grade: "C",
        effect: t("A 2022 meta-analysis found a significant rise in total testosterone, in both healthy and hypogonadal men. The trials are small, short, and several come from the same research groups in Malaysia. It is the best-supported plant in this section — and that is a low bar.",
                  "Une méta-analyse de 2022 trouve une hausse significative de la testostérone totale, chez des hommes sains et hypogonadiques. Les essais sont petits, courts, et plusieurs viennent des mêmes équipes malaisiennes. C'est la plante la mieux étayée de cette section — et la barre est basse."),
        dose: t("200–400 mg/day standardised root extract in the trials.", "200–400 mg/j d'extrait de racine standardisé dans les essais."),
        studies: [
          { ref: "Leisegang et al., Medicina 2022", n: null, design: t("meta-analysis of clinical trials", "méta-analyse d'essais cliniques"),
            finding: t("significant increase in total testosterone (random-effects model)", "hausse significative de la testostérone totale (modèle à effets aléatoires)"),
            url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9415500" },
        ],
        efsa: null, caveats: null },

      { sup: "daa", grade: "D",
        effect: t("The classic \"D-AA raises testosterone\" result came from untrained men. In resistance-trained men — the people who buy it — 3 g did nothing and 6 g lowered testosterone; a three-month trial confirmed no effect on hormones or training outcomes.",
                  "Le résultat classique « le D-AA augmente la testostérone » vient d'hommes non entraînés. Chez des hommes entraînés en résistance — ceux qui l'achètent — 3 g n'ont rien fait et 6 g ont abaissé la testostérone ; un essai de trois mois confirme l'absence d'effet sur les hormones et l'entraînement."),
        dose: null,
        studies: [
          { ref: "Melville et al., J Int Soc Sports Nutr 2015", n: 24, design: t("RCT, 3 g vs 6 g vs placebo, 2 weeks", "ECR, 3 g vs 6 g vs placebo, 2 semaines"),
            finding: t("3 g: no change; 6 g: total and free testosterone DEcreased", "3 g : aucun changement ; 6 g : testostérone totale et libre en BAISSE"),
            url: "https://pubmed.ncbi.nlm.nih.gov/25844073/" },
          { ref: "Melville et al., PLoS One 2017", n: 22, design: t("RCT, 3 months of training", "ECR, 3 mois d'entraînement"),
            finding: t("no effect on testosterone, strength or lean mass", "aucun effet sur la testostérone, la force ou la masse maigre"),
            url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0182630" },
        ],
        efsa: null, caveats: null },

      { sup: "turkesterone", grade: "D",
        effect: t("The internet's favourite \"natural anabolic\" has one human trial: four weeks at 500 mg/day, no difference in lean mass, fat mass or body weight versus placebo. Everything else is cell culture, insects and marketing.",
                  "L'« anabolisant naturel » préféré d'Internet a un seul essai humain : quatre semaines à 500 mg/j, aucune différence de masse maigre, de masse grasse ou de poids vs placebo. Tout le reste, ce sont des cellules, des insectes et du marketing."),
        dose: null,
        studies: [
          { ref: "Harris et al., Research in Health and Medicine 2024", n: null, design: t("RCT, 4 weeks, 500 mg/day, DXA", "ECR, 4 semaines, 500 mg/j, DXA"),
            finding: t("no significant difference in body mass, lean mass, fat mass or body-fat % vs placebo — the only human study to date", "aucune différence significative de poids, de masse maigre, de masse grasse ou de % de graisse vs placebo — la seule étude humaine à ce jour"),
            url: "https://researchdirects.com/index.php/healthsciences/article/view/126" },
        ],
        efsa: null,
        caveats: t("Often confused with ecdysterone, below. They are different molecules with different evidence, and products routinely blur the two.", "Souvent confondue avec l'ecdystérone, ci-dessous. Molécules différentes, preuves différentes, et les produits entretiennent le flou.") },

      { sup: "ecdysterone", grade: "C",
        effect: t("One well-run trial in 46 young men found about 2 kg more lean mass over ten weeks of training. The catch, from the same group: the commercial product they tested contained a fraction of the ecdysterone on its label — so nobody knows what dose did it, and shelf products may not contain it either.",
                  "Un essai bien mené chez 46 jeunes hommes trouve environ 2 kg de masse maigre en plus sur dix semaines d'entraînement. Le hic, par la même équipe : le produit commercial testé contenait une fraction de l'ecdystérone annoncée — personne ne sait donc quelle dose a agi, et les produits en rayon peuvent ne pas en contenir non plus."),
        dose: t("Unknown — the trial's labelled dose did not match its content.", "Inconnue — la dose annoncée de l'essai ne correspondait pas au contenu."),
        studies: [
          { ref: "Isenmann et al., Archives of Toxicology 2019", n: 46, design: t("RCT, 10 weeks of strength training", "ECR, 10 semaines de musculation"),
            finding: t("~2 kg greater lean-mass gain in the high-dose group; no liver or kidney toxicity markers", "gain de masse maigre ~2 kg supérieur dans le groupe forte dose ; aucun marqueur de toxicité hépatique ou rénale"),
            url: "https://link.springer.com/article/10.1007/s00204-019-02490-x" },
          { ref: "J Int Soc Sports Nutr 2025 — \"How reliable is the labeling of a commercial phytosteroid product?\"", n: null, design: t("12-week RCT + product analysis", "ECR 12 semaines + analyse du produit"),
            finding: t("labelled ecdysterone content not matched by measured content", "teneur en ecdystérone annoncée non retrouvée à l'analyse"),
            url: "https://www.tandfonline.com/doi/full/10.1080/15502783.2025.2540408" },
        ],
        efsa: null,
        caveats: t("WADA has had ecdysterone on its monitoring list since 2020. A supplement that works by being a mild anabolic is a different kind of product from a vitamin.", "L'AMA surveille l'ecdystérone depuis 2020. Un complément qui agit comme un anabolisant léger est un autre genre de produit qu'une vitamine.") },

      { sup: "zma", grade: "D",
        effect: t("The only positive ZMA trial (a 33 % rise in free testosterone, 2000) was funded by the patent holder. The independent replication in 2004 found no change in total or free testosterone, IGF-1, growth hormone, strength or body composition.",
                  "Le seul essai ZMA positif (+33 % de testostérone libre, 2000) a été financé par le détenteur du brevet. La réplication indépendante de 2004 ne trouve aucun changement de testostérone totale ou libre, d'IGF-1, d'hormone de croissance, de force ou de composition corporelle."),
        dose: null,
        studies: [
          { ref: "Wilborn et al., J Int Soc Sports Nutr 2004", n: null, design: t("RCT, resistance-trained men, 8 weeks", "ECR, hommes entraînés, 8 semaines"),
            finding: t("no significant effect on any hormonal, strength or body-composition outcome", "aucun effet significatif sur les hormones, la force ou la composition corporelle"),
            url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2129161" },
        ],
        efsa: t("Zinc: \"contributes to the maintenance of normal testosterone levels in the blood\" — a maintenance claim, true in deficiency, not a boosting claim.", "Zinc : « contribue au maintien d'un taux normal de testostérone dans le sang » — une allégation de maintien, vraie en cas de carence, pas une promesse d'augmentation."),
        caveats: t("If you are short of zinc, correcting it normalises testosterone. If you are not, more zinc does nothing to it — and 25 mg/day is the EFSA ceiling.", "Si vous manquez de zinc, le corriger normalise la testostérone. Sinon, plus de zinc n'y fait rien — et 25 mg/j est le plafond EFSA.") },

      { sup: "boron", grade: "D",
        effect: t("Two trials, 19 and 8 participants. The larger found no effect on testosterone, lean mass or strength; the smaller reported a free-testosterone rise after one week in eight men. That is the entire evidence base.",
                  "Deux essais, 19 et 8 participants. Le plus grand ne trouve aucun effet sur la testostérone, la masse maigre ou la force ; le plus petit rapporte une hausse de testostérone libre après une semaine chez huit hommes. C'est toute la base de preuves."),
        dose: null,
        studies: [
          { ref: "Ferrando & Green, Int J Sport Nutr 1993", n: 19, design: t("RCT, bodybuilders, 7 weeks", "ECR, culturistes, 7 semaines"),
            finding: t("no significant effect on testosterone, lean mass or strength", "aucun effet significatif sur la testostérone, la masse maigre ou la force"),
            url: "https://pubmed.ncbi.nlm.nih.gov/8508192/" },
        ],
        efsa: null, caveats: null },

      { sup: "dhea", grade: "D",
        effect: t("Not a supplement in France: DHEA is a prescription-only hormone, prepared by a pharmacist. Anything sold as DHEA on a French website or under the counter is illegal, and its content is anyone's guess.",
                  "Pas un complément en France : la DHEA est une hormone délivrée uniquement sur ordonnance, préparée en pharmacie. Tout ce qui se vend comme DHEA sur un site français ou sous le manteau est illégal, et son contenu est une inconnue."),
        dose: null, studies: [], efsa: null,
        caveats: t("Listed so the reader who searched for it gets an answer rather than a product.", "Listée pour que la personne qui l'a cherchée obtienne une réponse plutôt qu'un produit.") },
    ] },

  // -------------------------------------------------------------- pregnancy
  { id: "pregnancy", name: t("pregnancy", "grossesse"),
    blurb: t("One of the strongest results in all of nutrition science, and one that has to be taken before most people know they are pregnant.", "L'un des résultats les plus solides de toute la science nutritionnelle, et qui doit être pris avant que la plupart des personnes sachent qu'elles sont enceintes."),
    entries: [
      { sup: "folate", grade: "A",
        effect: t("Daily folic acid around conception cuts the risk of neural-tube defects by roughly 70 %. This is settled, replicated, and the basis of public-health policy worldwide. The timing is the whole point: the neural tube closes in the first four weeks.",
                  "L'acide folique quotidien autour de la conception réduit le risque d'anomalies du tube neural d'environ 70 %. C'est établi, répliqué, et à la base de politiques de santé publique dans le monde entier. Le moment est tout : le tube neural se ferme dans les quatre premières semaines."),
        dose: t("400 µg/day from before conception through the first trimester; higher doses on medical advice after a previous NTD.", "400 µg/j dès avant la conception et pendant le premier trimestre ; doses plus élevées sur avis médical après un antécédent."),
        studies: [
          { ref: "De-Regil et al., Cochrane 2015", n: null, design: t("Cochrane review, 5 trials", "revue Cochrane, 5 essais"),
            finding: t("neural-tube defects RR 0.28 (95% CI 0.15–0.52) with periconceptional folic acid", "anomalies du tube neural RR 0,28 (IC 95 % 0,15–0,52) avec acide folique périconceptionnel"),
            url: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD007950.pub3/full" },
        ],
        efsa: t("Authorised: \"supplemental folic acid intake increases maternal folate status; low maternal folate status is a risk factor in the development of neural tube defects\" (400 µg/day, from at least one month before conception).", "Autorisée : « l'apport supplémentaire d'acide folique augmente le statut en folates de la mère ; un faible statut est un facteur de risque d'anomalies du tube neural » (400 µg/j, dès au moins un mois avant la conception)."),
        caveats: t("Ashwagandha, curcumin concentrates and most botanicals on this site carry a pregnancy warning — the plant section is not for this need.", "L'ashwagandha, la curcumine concentrée et la plupart des plantes de ce site portent un avertissement grossesse — la section plantes n'est pas pour ce besoin.") },
    ] },

  // ------------------------------------------------- cancer prevention
  { id: "cancer", name: t("cancer prevention", "prévention du cancer"),
    blurb: t("Where the large trials have been most brutal to the intuition that \"antioxidants\" protect. Two of the three below caused harm.", "Là où les grands essais ont été les plus brutaux pour l'intuition que les « antioxydants » protègent. Deux des trois ci-dessous ont causé un préjudice."),
    entries: [
      { sup: "vitamin_e", grade: "D",
        effect: t("In 35,533 healthy men, 400 IU/day of vitamin E for seven years did not prevent prostate cancer — it increased it by 17 %. A supplement dose most shelves still carry.",
                  "Chez 35 533 hommes en bonne santé, 400 UI/j de vitamine E pendant sept ans n'ont pas prévenu le cancer de la prostate — ils l'ont augmenté de 17 %. Une dose que la plupart des rayons proposent encore."),
        dose: t("The EFSA reference intake is 12 mg/day (~18 IU). Food covers it.", "L'apport de référence EFSA est de 12 mg/j (~18 UI). L'alimentation le couvre."),
        studies: [
          { ref: "Klein et al., JAMA 2011 (SELECT)", n: 35533, design: t("RCT, 400 IU/day, 7 years", "ECR, 400 UI/j, 7 ans"),
            finding: t("prostate cancer HR 1.17 vs placebo — 76 vs 65 cases per 1,000 men", "cancer de la prostate HR 1,17 vs placebo — 76 contre 65 cas pour 1 000 hommes"),
            url: "https://jamanetwork.com/journals/jama/fullarticle/1104493" },
        ],
        efsa: t("Authorised: \"contributes to the protection of cells from oxidative stress\" — the sentence that sells it, and that SELECT tested.", "Autorisée : « contribue à protéger les cellules contre le stress oxydatif » — la phrase qui le vend, et que SELECT a testée."),
        caveats: null },

      { sup: "beta_carotene", grade: "D",
        effect: t("In smokers, 20–30 mg/day of beta-carotene increased lung cancer (+18 % in ATBC, +28 % in CARET) and overall mortality. Both trials were stopped early. Carotenoids from food carry no such signal.",
                  "Chez les fumeurs, 20–30 mg/j de bêta-carotène ont augmenté le cancer du poumon (+18 % dans ATBC, +28 % dans CARET) et la mortalité globale. Les deux essais ont été arrêtés avant terme. Les caroténoïdes alimentaires ne portent aucun signal de ce type."),
        dose: null,
        studies: [
          { ref: "ATBC Study Group, NEJM 1994", n: 29133, design: t("RCT, male smokers, 20 mg/day, 5–8 years", "ECR, fumeurs, 20 mg/j, 5–8 ans"),
            finding: t("lung cancer +18 %, all-cause mortality +8 % in the beta-carotene arm", "cancer du poumon +18 %, mortalité toutes causes +8 % dans le bras bêta-carotène"),
            url: "https://academic.oup.com/jnci/article/96/23/1729/2521106" },
          { ref: "Omenn et al., NEJM 1996 (CARET)", n: 18314, design: t("RCT, smokers and asbestos workers, 30 mg + 25,000 IU retinol", "ECR, fumeurs et travailleurs de l'amiante, 30 mg + 25 000 UI de rétinol"),
            finding: t("lung cancer +28 %, mortality +17 %; stopped 21 months early", "cancer du poumon +28 %, mortalité +17 % ; arrêté 21 mois avant terme"),
            url: "https://www.nejm.org/doi/pdf/10.1056/NEJM199605023341801" },
        ],
        efsa: null,
        caveats: t("Check multivitamins: many still include beta-carotene, and the harm signal is specific to smokers and ex-smokers.", "Vérifiez les multivitamines : beaucoup contiennent encore du bêta-carotène, et le signal de risque est spécifique aux fumeurs et anciens fumeurs.") },

      { sup: "vitamin_d3", grade: "D",
        effect: t("VITAL: 2,000 IU/day for five years in 25,871 adults did not reduce invasive cancer incidence. A lower cancer death rate appeared in secondary analyses and remains a hypothesis, not a result.",
                  "VITAL : 2 000 UI/j pendant cinq ans chez 25 871 adultes n'ont pas réduit l'incidence des cancers invasifs. Une mortalité par cancer plus basse apparaît en analyse secondaire et reste une hypothèse, pas un résultat."),
        dose: null,
        studies: [
          { ref: "Manson et al., NEJM 2019 (VITAL)", n: 25871, design: t("RCT, 2,000 IU/day, 5.3 years", "ECR, 2 000 UI/j, 5,3 ans"),
            finding: t("invasive cancer HR 0.96 (not significant); no effect on major cardiovascular events", "cancer invasif HR 0,96 (non significatif) ; aucun effet sur les événements cardiovasculaires majeurs"),
            url: "https://www.nejm.org/doi/full/10.1056/NEJMoa1809944" },
        ],
        efsa: null, caveats: null },
    ] },

  // ---------------------------------------------------- sexual health & fertility
  { id: "sexual", name: t("libido & fertility", "libido & fertilité"),
    blurb: t("The category with the most confident marketing and the fewest participants.", "La catégorie au marketing le plus assuré et au plus petit nombre de participants."),
    entries: [
      { sup: "maca", grade: "C",
        effect: t("Four small trials in 2010, two in 2023 — that is the whole randomised evidence base. Some show more desire or better erectile scores; the reviews say the numbers are too small to conclude anything firm.",
                  "Quatre petits essais en 2010, deux en 2023 — c'est toute la base d'essais randomisés. Certains montrent plus de désir ou de meilleurs scores érectiles ; les revues disent que les effectifs sont trop petits pour conclure fermement."),
        dose: t("1.5–3 g/day powder in the trials, 6–12 weeks.", "1,5–3 g/j de poudre dans les essais, 6–12 semaines."),
        studies: [
          { ref: "Shin et al., BMC Complement Altern Med 2010", n: null, design: t("systematic review, 4 RCTs", "revue systématique, 4 ECR"),
            finding: t("limited evidence; number of trials, sample size and quality too limited for firm conclusions", "preuves limitées ; nombre d'essais, effectifs et qualité trop limités pour conclure"),
            url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2928177/" },
          { ref: "J Men's Health 2023, erectile dysfunction", n: null, design: t("systematic review, 2 RCTs", "revue systématique, 2 ECR"),
            finding: t("limited evidence of benefit; more rigorous studies warranted", "preuves limitées de bénéfice ; des études plus rigoureuses sont nécessaires"),
            url: "https://www.jomh.org/articles/10.22514/jomh.2023.003" },
        ],
        efsa: null,
        caveats: t("Maca is safe and cheap, which is a reasonable basis for trying it and an unreasonable basis for the claims on the box.", "La maca est sûre et peu chère, ce qui est une base raisonnable pour essayer et une base déraisonnable pour les promesses de la boîte.") },

      { sup: "zinc", grade: "C",
        effect: t("Authorised claims on fertility and testosterone maintenance reflect zinc's role in deficiency. Supplementing replete men has not been shown to raise testosterone.", "Les allégations autorisées sur la fertilité et le maintien de la testostérone reflètent le rôle du zinc en cas de carence. Supplémenter des hommes non carencés n'a pas montré d'élévation de la testostérone."),
        dose: t("8–11 mg/day meets the reference intake; 25 mg/day is the EFSA limit.", "8–11 mg/j couvrent l'apport de référence ; 25 mg/j est la limite EFSA."),
        studies: [],
        efsa: t("Authorised: \"contributes to normal fertility and reproduction\", \"maintenance of normal testosterone levels in the blood\".", "Autorisées : « contribue à une fertilité et une reproduction normales », « maintien d'un taux normal de testostérone dans le sang »."),
        caveats: null },
    ] },
  ],

  // Safety notes referenced by `safety:` on an entry. Written to be shown
  // prominently, above the dose, because a reader who stops at the grade
  // should still have seen them.
  safety: {
    ashwagandha: {
      title: t("Two European agencies have moved against ashwagandha", "Deux agences européennes ont agi contre l'ashwagandha"),
      body: t("Denmark banned it in food and supplements in 2023, citing possible effects on thyroid and sex hormones and a possible abortifacient effect. In April 2024 ANSES (France) advised people with thyroid, liver or heart conditions or hyperandrogenism, pregnant or breastfeeding women, people on sedatives, and anyone under 18 not to take it. Case reports of liver injury exist, including one requiring transplant, and an EU food-safety working group has recommended a formal Article 8 safety review. n3gh does not red-card it — Denmark and ANSES are not among the three bodies in the red-card rule — but this is the strongest safety signal of any product on the site.",
               "Le Danemark l'a interdit dans les aliments et compléments en 2023, citant de possibles effets sur la thyroïde et les hormones sexuelles et un possible effet abortif. En avril 2024, l'ANSES a déconseillé sa consommation aux personnes atteintes de pathologies thyroïdiennes, hépatiques ou cardiaques ou d'hyperandrogénie, aux femmes enceintes ou allaitantes, aux personnes sous sédatifs et aux moins de 18 ans. Des cas d'atteinte hépatique existent, dont un ayant nécessité une greffe, et un groupe de travail européen a recommandé une procédure formelle de l'article 8. n3gh ne lui met pas de carton rouge — le Danemark et l'ANSES ne font pas partie des trois instances de la règle — mais c'est le signal de sécurité le plus fort de tout le site."),
      urls: [
        { label: "ANSES, avis 2021-SA-0077 du 19 avril 2024 (PDF)", url: "https://www.anses.fr/fr/system/files/NUT2021SA0077.pdf" },
        { label: "Regulatory roundup — Denmark, ANSES, EU Article 8", url: "https://www.nutritioninsight.com/news/regulatory-update-spotlight-on-international-authorities-response-to-ashwagandha-safety-concerns.html" },
        { label: "NIH ODS fact sheet", url: "https://ods.od.nih.gov/factsheets/Ashwagandha-HealthProfessional/" },
        { label: "Lancet Gastroenterol Hepatol 2024 — herbal hepatotoxicity", url: "https://www.thelancet.com/journals/langas/article/PIIS2468-1253(24)00324-8/fulltext" },
      ] },
    biotin: {
      title: t("High-dose biotin falsifies blood tests", "La biotine à forte dose fausse les analyses sanguines"),
      body: t("The FDA has warned since 2017 that biotin at the doses sold for hair and nails interferes with immunoassays — including cardiac troponin, the test used to diagnose a heart attack, which it can push falsely low. One death has been reported. Thyroid panels are affected too. Stop it several days before any blood test, and tell whoever orders the test.",
               "La FDA avertit depuis 2017 que la biotine aux doses vendues pour cheveux et ongles interfère avec les dosages immunologiques — dont la troponine cardiaque, le test qui diagnostique l'infarctus, qu'elle peut abaisser à tort. Un décès a été rapporté. Les bilans thyroïdiens sont aussi touchés. Arrêtez-la plusieurs jours avant toute prise de sang, et prévenez la personne qui prescrit l'analyse."),
      urls: [ { label: "FDA safety communication, updated 2019", url: "https://www.fda.gov/medical-devices/in-vitro-diagnostics/biotin-interference-troponin-lab-tests-assays-subject-biotin-interference" } ] },
    curcumin: {
      title: t("High-absorption curcumin and the liver", "Curcumine à haute absorption et foie"),
      body: t("In 2019 the Italian Ministry of Health issued a warning after a cluster of hepatitis cases linked to curcuma supplements, and case reports have continued with enhanced-bioavailability formulations. Plain turmeric in food carries no such signal. Anyone with liver disease, or on medication metabolised by the liver, should treat concentrated curcumin as a drug, not a spice.",
               "En 2019, le ministère italien de la Santé a émis un avertissement après une série de cas d'hépatite liés à des compléments de curcuma, et des cas continuent d'être rapportés avec les formulations à biodisponibilité améliorée. Le curcuma alimentaire ne porte aucun signal de ce type. Toute personne atteinte d'une maladie hépatique, ou sous médicament métabolisé par le foie, doit considérer la curcumine concentrée comme un médicament, pas une épice."),
      urls: [] },
  },
};
