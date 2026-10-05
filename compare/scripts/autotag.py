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
n3gh. — auto-tagger / normalization core (v1.1)

Turns a free-text supplement label (additives list + form description, FR or EN)
into the coded fields the Health & Compo Score needs:
  - purity_tags        (penalty tags, see METHODOLOGY.md)
  - additives_detail   (cleaned human-readable list)
  - form_tier          (0–20 form-quality score, per category)
  - form_note

This same module is imported by the collection pipeline (pipeline/), so a scraped
product and a hand-curated one go through EXACTLY the same normalization. That is
the point: the rules live in one auditable place.
"""
import re, unicodedata

# ----------------------------------------------------------------------------- #
#  v1.2 additive classification.
#
#  A free-text ingredient string maps to ONE tag. Tags fall in three buckets:
#    • RED-CARD substances   -> classify_additive returns "banned:<name>"; the
#      scorer forces the whole product to 0 (grade E). Basis: banned/withdrawn
#      by at least one of EU-EFSA / US-FDA / WHO (strictest-guideline-wins).
#    • penalty tags          -> subtract from the 30-pt purity base (see
#      build_scores.PURITY_PENALTIES).
#    • "unknown"             -> not silently ignored: small provisional penalty
#      AND surfaced on the product card for human review.
#  Sweetener tiers (A→D) encode strength-of-evidence-of-harm from recent
#  independent cohorts/RCTs — see METHODOLOGY.md. Sugar is penalised MORE than
#  any sweetener because the evidence for added-sugar harm is stronger.
# ----------------------------------------------------------------------------- #

CAPSULE_HINTS = ["gelule", "capsule", "tunique", "k-caps", "kcaps", "drcaps",
                 "pullulan", "hpmc vegetal", "gelatine", "gelatin", "softgel",
                 "enveloppe", "vegecaps"]

# Red-card: banned / authorisation-withdrawn / restricted by EU, FDA or WHO.
BANNED = [
    ("titanium_dioxide",   ["dioxyde de titane", "titanium dioxide", "e171"]),
    ("trans_fat",          ["partiellement hydrogen", "partially hydrogen",
                            "graisse trans", "trans fat", "acides gras trans"]),
    ("brominated_veg_oil", ["huile vegetale bromee", "brominated vegetable", "bvo"]),
    ("potassium_bromate",  ["bromate de potassium", "potassium bromate", "e924"]),
    ("red_3_erythrosine",  ["erythrosine", "e127", "red 3", "red no. 3", "rouge 3"]),
    ("propylparaben",      ["propylparaben", "propylparabene", "e216", "e217"]),
]

# Order matters: first match wins (worst offenders first).
RULES = [
    ("hydrogenated_fat", ["hydrogen", "hydrogene"]),   # FULLY hydrogenated = saturated (partial caught by BANNED above)
    ("added_sugar",      ["sirop de glucose", "glucose syrup", "sucre", "sugar",
                          "saccharose", "sirop de", "dextrose"]),
    ("severe_antioxidant",["e320", "e321", "bha", "bht", "butylhydroxy",
                          "hydroxyanisole", "hydroxytoluene"]),
    ("proprietary_blend",["blend without", "without individual dose", "proprietary blend",
                          "melange proprietaire", "non detaille", "non precis",
                          "undisclosed", "not disclosed", "excipients non"]),
    # sweeteners, tiered by evidence of harm (strongest signal first)
    ("sweetener_d",      ["sucralose", "erythritol", "erythritol", "xylitol"]),
    ("sweetener_c",      ["aspartame", "acesulfame", "acesulphame", "ace-k", "ace k"]),
    ("sweetener_b",      ["saccharin", "saccharinate", "cyclamate"]),
    ("polyol",           ["maltitol", "sorbitol", "polyol", "isomalt", "mannitol"]),
    # stevia / monk fruit = Tier A (natural, no harm signal) -> handled as neutral
    ("artificial_colour",["azoique", "e102", "e104", "e110", "e122", "e124", "e129",
                          "tartrazine", "sunset yellow", "allura", "ponceau",
                          "carmoisine", "azorubine", "quinoline", "colorant azo"]),
    ("synthetic_carrier",["polyethylene glycol", "peg ", "(peg)", "polyethylene-glycol"]),
    ("artificial_flavour",["arome artificiel", "artificial flavour",
                           "artificial flavor", "aromatisant artificiel"]),
    ("lecithin",         ["lecithine", "lecithin"]),
    ("thickener",        ["gomme xanthane", "xanthan", "gomme guar", "guar",
                          "gomme gellane", "gellan", "carraghenane", "carrageenan"]),
    ("bulking_filler",   ["maltodextrine", "maltodextrin", "amidon", "starch",
                          "cellulose microcristalline", "microcrystalline cellulose",
                          "cellulose", "croscarmellose", "phosphate dicalcique",
                          "phosphate tricalcique", "dicalcium phosphate", "gomme d'acacia",
                          "gomme arabique", "acacia", "caroube", "carob", "citrate de calcium"]),
    ("anticaking",       ["stearate de magnesium", "magnesium stearate",
                          "sels de magnesium d'acides gras", "acide stearique",
                          "stearic", "dioxyde de silicium", "silicon dioxide",
                          "silice", "silica", "talc", "carbonate de magnesium"]),
    ("coating",          ["enrobage", "coating", "cire de carnauba", "carnauba",
                          "shellac", "e903", "e904", "carbonate de calcium",
                          "hydroxypropylcellulose", "hydroxypropylmethylcellulose"]),
    # Acidity regulators and raising agents — the -1 band (METHODOLOGY §2d).
    #
    # MUST STAY LAST in RULES. Mineral citrates and carbonates are ACTIVES or
    # already-classified excipients: "citrate de calcium" is a bulking filler,
    # "carbonate de magnesium" is anti-caking, "carbonate de calcium" is a
    # coating, and magnesium/zinc/potassium citrate are the product itself.
    # Every one of those is matched by an earlier rule, and first match wins, so
    # ordering is what keeps this rule from taxing a chelated mineral for the
    # crime of being a citrate. Keywords below are either an explicit label ROLE
    # ("correcteur d'acidité :") or an acidulant that is never an active.
    ("acidity_regulator", ["correcteur d'acidite", "acidity regulator",
                           "poudre a lever", "raising agent",
                           "acide citrique", "citric acid",
                           "citrate de sodium", "sodium citrate",
                           "acide malique", "malic acid",
                           "acide tartrique", "tartaric acid",
                           "hydroxyde de potassium", "potassium hydroxide",
                           "carbonate de soude", "carbonate de sodium",
                           "sodium carbonate"]),
]

# Explicitly recognised as NON-penalised (incl. Tier-A natural sweeteners and the
# clean E171 replacement, calcium carbonate — already neutral via 'coating' path).
NEUTRAL_KEYWORDS = [
    "eau", "water", "glycerine", "glycerin", "glycerol",
    "huile de colza", "huile d'olive", "huile de coco", "huile mct", "mct",
    "huile de tournesol", "huile vegetale", "triglycerides a chaine moyenne",
    "tocopherol", "tocopherols", "vitamine e", "romarin", "rosemary",
    # citric acid / sodium citrate moved to the acidity_regulator rule (-1),
    # so the same chemistry no longer scores differently depending on which
    # acidifier a brand happened to choose (METHODOLOGY §2d).
    "arome naturel",
    "natural flavour", "natural flavor", "lactase", "tolerase", "sel", "salt",
    "betterave", "spiruline", "carthame", "carotte", "sureau", "curcuma",
    "concentres de", "jus de", "bioflavonoide", "flavonoide", "microbiomex",
    "inuline", "fos", "fructo-oligosaccharide", "prebiotique", "son de riz",
    "amidon de riz", "riz", "antioxydant naturel", "ascorbyl", "e300",
    "extrait de romarin", "poudre de fruit", "cacao", "vitamine", "vitamin",
    "b8", "b12", "b6", "saccharomyces", "acides gras",
    "stevia", "steviol", "glycosides de steviol", "monk fruit", "luo han",
    # English benign ingredients (curated v1 labels are in English)
    "olive oil", "sunflower oil", "rapeseed oil", "coconut oil", "mct oil",
    "fish oil", "fish-gelatine", "fish gelatin", "bovine gelatine", "gelatine",
    "glycerol", "glycerine", "glycerin", "natural flavour", "natural orange flavour",
    "natural flavor", "antioxidant", "rosemary", "tocopherol", "vitamin e",
    "salt", "water", "declared", "none", "rice", "acacia gum (prebiotic",
    "prebiotic", "lactase", "enteric coating", "functional enteric",
    "pectine", "pectin", "chlorure de sodium", "huile essentielle", "citrate de",
]

# Strings the curator/scraper has explicitly marked benign, or that describe the
# ABSENCE/replacement of a banned substance (must never trip the red card).
NEUTRAL_MARKERS = ["(neutral", "neutral)", "e171 replacement", "e171-replacement"]
NEGATION_NEAR_BANNED = ["replacement", "remplac", "sans ", "-free", " free",
                        "free)", "alternative", "instead of", "substitut", "no titanium"]


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return s.lower().strip()


def classify_additive(raw: str):
    """Map an ingredient string to a tag:
       "banned:<name>"  -> red card (force score to 0)
       "<penalty_tag>"  -> purity penalty (see build_scores.PURITY_PENALTIES)
       "unknown"        -> unrecognised, flag for human review (+ small penalty)
       None             -> neutral / benign."""
    n = _norm(raw)
    # annotator-marked benign / "free of X" strings never trip a penalty or red card
    if any(m in n for m in NEUTRAL_MARKERS):
        return None
    negated = any(w in n for w in NEGATION_NEAR_BANNED)
    for name, keys in BANNED:                       # red card checked first
        if any(k in n for k in keys) and not negated:
            return "banned:" + name
    # capsule / shell material → neutral (but not if it also names a filler/anti-caking)
    if any(h in n for h in CAPSULE_HINTS) and not any(
        k in n for k in ["stearate", "silice", "silica", "dioxyde", "maltodextrine"]
    ):
        return None
    # natural Tier-A sweeteners are benign — short-circuit before generic matches
    if any(k in n for k in ["stevia", "steviol", "monk fruit", "luo han"]):
        return None
    for tag, keys in RULES:
        if any(k in n for k in keys):
            return tag
    if any(k in n for k in NEUTRAL_KEYWORDS):
        return None
    return "unknown"                                # never silently ignored


def tags_from_additives(additives):
    """additives -> (purity_tags, additives_detail, banned[list], review[list]).
       banned  = red-card substance names found (force score 0)
       review  = ingredient strings the tagger couldn't classify (needs a human)"""
    tags, detail, banned, review = [], [], [], []
    for a in additives or []:
        t = classify_additive(a)
        detail.append(a)
        if t is None:
            continue
        if t.startswith("banned:"):
            banned.append(t.split(":", 1)[1])
            tags.append("banned")
        elif t == "unknown":
            review.append(a)
            tags.append("unknown")
        else:
            tags.append(t)
    return tags, detail, banned, review


# ----------------------------------------------------------------------------- #
#  Form-quality tiers per category (0–20). Encodes METHODOLOGY.md §1a.
# ----------------------------------------------------------------------------- #
def infer_form_tier(cat, form, entry=None):
    f = _norm(form or "")
    entry = entry or {}

    if cat == "whey":
        if "native" in f and ("isolat" in f or "isolate" in f): return 20, "Native isolate — the top milk-protein form."
        if "native" in f: return 20, "Native whey from milk, not a cheese by-product."
        if "isolat" in f or "isolate" in f or "wpi" in f: return 18, "Isolate-led."
        if "blend" in f or ("concentr" in f and "isolat" in f): return 15, "Concentrate/isolate blend."
        return 14, "Standard whey concentrate."

    if cat == "creatine":
        return (20, "Documented-purity Creapure® monohydrate.") if "creapure" in f \
            else (16, "Monohydrate is the gold-standard form; generic source.")

    if cat == "vitamin_d3":
        if "d2" in f or "ergocalciferol" in f: return 14, "D2 (ergocalciferol) — less potent than D3."
        if "lichen" in f or "lanolin" in f or "lanoline" in f: return 20, "Documented D3 source (lichen or lanolin)."
        return 16, "D3 with undocumented sourcing."

    if cat == "magnesium":
        if "magshape" in f: return 10, "Blend dominated by micro-encapsulated oxide (marketed 'liposomal')."
        if any(k in f for k in ["bisglycinate", "glycinate", "malate", "pidolate", "taurate"]):
            return 20, "Chelated magnesium — high bioavailability."
        if "citrate" in f: return 16, "Citrate — good bioavailability, possible laxative effect."
        if "algue" in f or "algae" in f or "lithothamne" in f: return 16, "Algae-sourced mineral."
        if "marin" in f or "marine" in f or "oxyde" in f or "oxide" in f:
            return 4, "Oxide (incl. seawater 'marine') — lowest bioavailability."
        return 10, "Unspecified magnesium form."

    if cat == "omega3":
        if "rtg" in f or "re-ester" in f or "re-ester" in f or "ré-ester" in _norm(form) or "reesterifi" in f: return 20, "Re-esterified triglycerides (rTG) — best absorbed."
        if "algue" in f or "algae" in f or "algal" in f: return 18, "Algae triglycerides — vegan, low contaminants."
        if "ethyl" in f or "ester ethyl" in f or " ee" in f: return 10, "Ethyl esters (EE) — cheapest, less well absorbed."
        if "tg" in f or "triglycer" in f or "naturelle" in f: return 16, "Natural triglycerides (TG)."
        return 12, "Oil form not clearly declared."

    if cat == "zinc":
        if "bisglycinate" in f or "glycinate" in f: return 20, "Bisglycinate — well-absorbed chelate."
        if "picolinate" in f: return 20, "Picolinate — well-absorbed form."
        if "citrate" in f: return 16, "Citrate — decent bioavailability."
        if "gluconate" in f: return 14, "Gluconate — modest bioavailability."
        if "liposom" in f: return 12, "'Liposomal' — undefined salt, unproven benefit for a mineral."
        if "oxyde" in f or "oxide" in f: return 4, "Oxide — poorly absorbed."
        return 14, "Unspecified zinc form."

    if cat == "vitamin_c":
        if "liposom" in f: return 20, "Liposomal — enhanced absorption evidence."
        if any(k in f for k in ["ester-c", "ester c", "acerola", "acerola", "pureway"]): return 18, "Buffered/whole-food vitamin C, gentle on the stomach."
        return 16, "Plain ascorbic acid — effective, standard form."

    if cat == "collagen":
        if "tripeptide" in f: return 20, "Low-MW tripeptides — high bioavailability."
        if any(k in f for k in ["peptan", "naticol", "verisol", "collactive", "aquacol", "cartidyss"]):
            return 20, "Branded hydrolysed peptides with clinical backing."
        if any(k in f for k in ["membrane", "coquille", "eggshell", "dermeon"]):
            return 12, "Eggshell-membrane collagen — different matrix, very low dose."
        if "hydrolys" in f or "peptide" in f: return 16, "Generic hydrolysed peptides."
        return 14, "Unspecified collagen form."

    if cat == "probiotics":
        coded = entry.get("strains_coded"); gastro = entry.get("gastro_resistant")
        if coded and gastro: return 20, "Strain-coded and gastro-resistant delivery."
        if coded: return 17, "Strain-coded (documented strains)."
        if gastro: return 14, "Gastro-resistant but strains not coded on label."
        return 10, "Strains not coded, no gastro-resistant delivery."

    if cat == "melatonin":
        return (20, "Prolonged/bi-layer release — supports sleep maintenance.") \
            if entry.get("release") == "prolonged" \
            else (16, "Immediate release — supports sleep onset.")


    # ---------------------------------------------------------------------
    # Botanicals (v1.4). "Form" for a plant extract means: is it the material
    # the trials actually used? Standardisation and branded extracts are not
    # marketing here — they are the only way a shelf product and a trial share
    # anything beyond a name.
    # ---------------------------------------------------------------------
    if cat == "ashwagandha":
        branded = any(k in f for k in ["ksm-66", "ksm66", "sensoril", "shoden"])
        # "100 % racine sans feuille" / "leaf-free" is a claim of the OPPOSITE;
        # strip negated mentions before looking for leaf.
        f_leaf = re.sub(r"(sans|no|without|zero|0 ?%)\s+(de\s+)?(feuilles?|leaf|leaves)|(feuilles?|leaf)[- ]free", " ", f)
        if any(k in f_leaf for k in ["feuille", "leaf", "leaves"]):
            # Leaf is checked BEFORE the branded list. Shoden is branded and has
            # its own trials, and it is a root-AND-leaf extract; ANSES and the
            # pharmacopoeia retain the root alone (withaferin A). Both facts are
            # true, so the tier sits between "studied" and "not the material".
            if branded:
                return 12, "Branded and studied, but a root-and-leaf extract — regulators retain the root alone (withaferin A)."
            return 8, "Contains leaf — higher withaferin A; not the material the trials used."
        if branded:
            return 20, "Clinically studied branded root extract with standardised withanolides."
        if "withanolide" in f and any(k in f for k in ["%", "titr", "standard"]):
            # A declared titre is only worth the tier if it is a real one. KSM-66
            # and its peers sit at 5%; a mass-market extract on maltodextrin can
            # declare 1.5% and read, to a shopper, as "standardised" too.
            # Only the percentage attached to "withanolide" counts: "27,7 % de la
            # gélule, titré à 1,5 % de withanolides" must read as 1.5, not 27.7.
            pcts = [float(x.replace(",", ".")) for x in
                    re.findall(r"(\d+(?:[.,]\d+)?)\s*%\s*(?:min\.?\s*)?(?:de\s+|en\s+)?withanolide", f)
                    + re.findall(r"withanolides?(?:\s+glycosides)?\s*[:(]?\s*(\d+(?:[.,]\d+)?)\s*%", f)]
            if pcts and max(pcts) < 2.5:
                return 12, f"Standardised, but only to {max(pcts):g}% withanolides — well below the 5% the trials used."
            return 17, "Standardised extract with declared withanolide content."
        if "extrait" in f or "extract" in f:
            return 14, "Root extract, standardisation not declared."
        return 10, "Whole root powder — not what the trials used."

    if cat == "maca":
        if any(k in f for k in ["gelatin", "gelatinis", "extrait", "extract", "concentr"]) or re.search(r"\d+\s*:\s*1", f):
            return 18, "Gelatinised or concentrated — the digestible form the trials used."
        if any(k in f for k in ["noire", "black", "rouge", "red"]):
            return 16, "Coloured ecotype; trial evidence is for standard yellow/mixed maca."
        return 14, "Raw maca powder."

    if cat == "rhodiola":
        if "rosavin" in f and "salidroside" in f:
            return 20, "Double-standardised (rosavins + salidroside) — the profile the trials used."
        if "rosavin" in f or "salidroside" in f:
            return 16, "Single-marker standardisation."
        if "extrait" in f or "extract" in f:
            return 12, "Extract, standardisation not declared."
        return 8, "Unstandardised root powder."

    if cat == "curcumin":
        if any(k in f for k in ["meriva", "bcm-95", "bcm95", "longvida", "novasol", "turmipure",
                                "theracurmin", "curcuwin", "cavacurmin", "curcugreen"]):
            return 20, "Enhanced-absorption formulation with its own clinical trials."
        # Powder is checked BEFORE piperine: "poudre de curcuma + poivre" is a
        # spice mix, not a 95% extract with an absorption enhancer, and the
        # pepper does not turn 3% curcuminoids into 95%.
        if any(k in f for k in ["poudre", "powder", "rhizome en poudre"]):
            return 6, "Turmeric powder (~3% curcumin) — not the material the trials used."
        if any(k in f for k in ["liposom", "microencapsul", "micro-encapsul", "micellaire", "micelle"]):
            return 14, "Absorption-enhanced by encapsulation, but not a clinically named formulation."
        if any(k in f for k in ["piperine", "piperin", "poivre", "bioperine"]):
            return 16, "95% extract with piperine — absorbed better, but piperine interacts with drug metabolism."
        if "95" in f and "curcumino" in f:
            return 12, "Plain 95% curcuminoid extract — poorly absorbed on its own."
        return 10, "Curcumin form not clearly declared."


    # ---------------------------------------------------------------------
    # Vitamins batch (v1.5). For a vitamin, "form" is the chemical species —
    # and the honest ladder is flatter than the marketing suggests.
    # ---------------------------------------------------------------------
    if cat == "vitamin_b12":
        # Cyano-, methyl-, adenosyl- and hydroxocobalamin all correct deficiency;
        # the trials behind the B12 evidence used cyanocobalamin. "Liposomal"
        # and "sublingual" have no demonstrated advantage over swallowing it.
        if any(k in f for k in ["methylcobalamin", "methylcobalamine", "adenosylcobalamin", "hydroxocobalamin", "hydroxocobalamine"]):
            return 18, "Active cobalamin form — works; no proven edge over cyanocobalamin."
        if "cyanocobalamin" in f or "cyanocobalamine" in f:
            return 18, "Cyanocobalamin — the stable, best-studied form; the one the trials used."
        if "liposom" in f:
            return 14, "'Liposomal' B12 — premium form with no demonstrated advantage."
        if "cobalamin" in f or "b12" in f:
            return 12, "B12 form not specified."
        return 10, "Vitamin form not declared."

    if cat == "vitamin_k2":
        if any(k in f for k in ["mk-7", "mk7", "menaquinone-7", "menaquinone 7"]):
            if any(k in f for k in ["all-trans", "all trans", "forme trans", "% trans", "k2vital", "menaq7", "vitamk7"]):
                return 20, "MK-7, all-trans (branded) — the long-half-life form the MK-7 trials used."
            return 18, "MK-7 — long half-life; isomer purity not declared."
        if any(k in f for k in ["mk-4", "mk4", "menaquinone-4", "menatetrenone"]):
            return 14, "MK-4 — short half-life; the bone trials used a 45 mg pharmaceutical dose, not supplement amounts."
        if any(k in f for k in ["phylloquinone", "phytonadione", "k1"]):
            return 10, "Vitamin K1 — not a K2, and not what a 'K2' buyer is paying for."
        return 8, "Menaquinone form not declared."

    if cat == "biotin":
        return 18, "D-biotin — one form, no meaningful differences between products."

    if cat == "folate":
        # The neural-tube-defect evidence is for FOLIC ACID. Methylfolate is
        # well absorbed and reasonable, but it is not the form the trials used,
        # and the MTHFR argument for it is theoretical.
        if any(k in f for k in ["acide folique", "folic acid", "pteroylmonoglutam"]):
            return 20, "Folic acid — the form with the neural-tube-defect evidence."
        if any(k in f for k in ["methylfolate", "méthylfolate", "5-mthf", "mthf", "quatrefolic", "metafolin", "methyltetrahydrofolate", "l-methylfolate"]):
            return 18, "5-MTHF (methylfolate) — well absorbed; the NTD trials used folic acid."
        if any(k in f for k in ["folate", "folinique", "folinic"]):
            return 14, "Folate, form not specified."
        return 10, "Vitamin form not declared."

    # ---------------------------------------------------------------------
    # Sold to raise testosterone (v1.5)
    # ---------------------------------------------------------------------
    if cat == "tribulus":
        # No standardisation buys back the evidence: no tribulus dose has
        # raised testosterone in men. The ladder only rewards knowing what is
        # in the capsule.
        if any(k in f for k in ["saponin", "protodioscin"]) and "%" in f:
            return 14, "Standardised saponin/protodioscin content declared — no dose has raised testosterone in men."
        if "extrait" in f or "extract" in f:
            return 10, "Extract, standardisation not declared."
        return 8, "Fruit/plant powder, unstandardised."

    if cat == "fenugreek":
        # "non standardisé" / "non titré" must not read as "standardised".
        f = re.sub(r"\b(non|sans|pas)\s+(standardis\w*|titr\w*|titrage)", " ", f)
        if any(k in f for k in ["testofen", "furosap", "fenu-fg", "fenufg"]):
            return 20, "Branded seed extract — the material the (manufacturer-linked) testosterone trials used."
        if any(k in f for k in ["furostanol", "saponin", "titr", "standard"]):
            return 16, "Standardised seed extract."
        if "extrait" in f or "extract" in f:
            return 12, "Extract, standardisation not declared."
        return 8, "Seed powder — a spice, not the trial material."

    if cat == "zma":
        # The zinc is the only component with a testosterone claim, and only in
        # deficiency. The ladder ranks the zinc salt: the patented ZMA material
        # is zinc monomethionine + aspartate; bisglycinate is as well absorbed;
        # oxide is the cheap, poorly absorbed one.
        if any(k in f for k in ["optizinc", "monomethionine", "monomethionine", "methionine", "bisglycinate", "picolinate"]):
            return 16, "Chelated zinc (monomethionine / bisglycinate) — the ZMA trial material or an equivalent chelate."
        if any(k in f for k in ["aspartate", "citrate", "gluconate"]):
            return 14, "Organic zinc salt — well absorbed; not the patented ZMA form."
        if any(k in f for k in ["oxyde", "oxide", "sulfate", "sulphate"]):
            return 10, "Zinc oxide/sulfate — the cheapest and least absorbed form."
        return 8, "Zinc form not declared."

    # ---------------------------------------------------------------------
    # Minerals (v1.6). Ladders from the verified dossiers in METHODOLOGY §5c.
    # ---------------------------------------------------------------------
    if cat == "iron":
        # Scored on the iron SALT. A wrapper ("liposomal", "microencapsulated")
        # earns nothing by itself: no adult head-to-head absorption data exist
        # for it. A liposome around bisglycinate is still bisglycinate.
        if any(k in f for k in ["ultimine", "koji", "aspergillus"]):
            return 12, "Iron-enriched koji (Ultimine) — small, manufacturer-funded absorption data only."
        if "sucrosom" in f:
            return 12, "Sucrosomial ferric pyrophosphate — trials mostly in clinical groups; no absorption comparison with ferrous sulfate."
        if any(k in f for k in ["bisglycinate", "ferrochel", "lomachelate"]):
            return 20, "Ferrous bisglycinate — the best head-to-head evidence among supplement forms (haemoglobin and gut tolerance)."
        if any(k in f for k in ["sulfate ferreux", "sulfate de fer", "ferrous sulfate", "ferrous sulphate"]):
            return 20, "Ferrous sulfate — the reference form of the fatigue and dosing trials; more gut side effects."
        if any(k in f for k in ["fumarate"]):
            return 18, "Ferrous fumarate — absorbed like ferrous sulfate in stable-isotope work."
        if any(k in f for k in ["gluconate", "floradix"]):
            return 16, "Ferrous gluconate — a standard ferrous salt with no modern absorption comparison."
        if "liposom" in f or "micro-encaps" in f or "microencaps" in f:
            return 12, "'Liposomal' iron (usually ferric pyrophosphate) — no adult head-to-head absorption data."
        if any(k in f for k in ["pyrophosphate", "diphosphate"]):
            return 10, "Ferric pyrophosphate — poorly soluble; a food-fortification form."
        return 8, "Iron compound not declared."

    if cat == "potassium":
        if any(k in f for k in ["chlorure de potassium", "potassium chloride"]):
            return 20, "Potassium chloride — the form behind most of the blood-pressure trials (solid tablets can irritate the gut)."
        if "citrate" in f:
            return 18, "Potassium citrate — lowered blood pressure as well as the chloride in a head-to-head RCT."
        if any(k in f for k in ["bicarbonate", "hydrogenocarbonate", "gluconate"]):
            return 16, "Potassium bicarbonate/gluconate — well absorbed; few blood-pressure trials."
        return 8, "Potassium salt not declared."

    return 14, "Form not scored for this category."


# ----------------------------------------------------------------------------- #
#  Dose tiers for categories that need entry-level logic (0–20). §1b.
# ----------------------------------------------------------------------------- #
def infer_dose_tier(cat, entry):
    def daily():
        return entry["active_per_unit"] * entry["units_per_day"]

    if cat == "zinc":
        mg = daily()
        if mg > 25: return 12, f"{mg:g} mg/day — above the EFSA UL (25 mg)."
        if mg >= 5: return 20, f"{mg:g} mg elemental zinc/day — effective, within EFSA UL."
        return 12, f"{mg:g} mg/day — low."
    if cat == "vitamin_c":
        mg = daily()
        if mg >= 200: return 20, f"{mg:g} mg/day — saturating dose."
        if mg >= 80: return 17, f"{mg:g} mg/day — at/above NRV."
        return 12, f"{mg:g} mg/day — below NRV territory."
    if cat == "collagen":
        g = entry.get("collagen_g_day")
        if g is None:
            g = daily()
        if g >= 5: return 20, f"{g:g} g peptides/day — in the studied range."
        if g >= 2.5: return 16, f"{g:g} g/day — modest."
        if g >= 1: return 12, f"{g:g} g/day — below most trials."
        return 8, f"{g:g} g/day — token dose."
    if cat == "probiotics":
        cfu = daily()
        if cfu >= 20: return 20, f"{cfu:g} billion CFU/day — high potency."
        if cfu >= 10: return 18, f"{cfu:g} billion CFU/day — solid."
        if cfu >= 5: return 15, f"{cfu:g} billion CFU/day — moderate."
        if cfu >= 1: return 12, f"{cfu:g} billion CFU/day — low."
        return 8, f"{cfu:g} billion CFU/day — very low."
    if cat == "melatonin":
        mg = daily()
        if mg > 1.9: return 14, f"{mg:g} mg/day — above the French supplement ceiling (1.9 mg)."
        if mg >= 1: return 20, f"{mg:g} mg/day — EFSA sleep-onset dose, within the French ceiling."
        return 12, f"{mg:g} mg/day — below the 1 mg EFSA claim."

    # Botanicals (v1.4). Dose bands are the ranges the trials on /compare/evidence/
    # actually used — not a manufacturer's serving suggestion.
    if cat == "ashwagandha":
        mg = daily()
        if mg > 1200: return 12, f"{mg:g} mg/day — above the studied range; safety scales with dose, benefit does not."
        if mg >= 600: return 20, f"{mg:g} mg/day — the dose the stress and sleep trials used."
        if mg >= 300: return 16, f"{mg:g} mg/day — lower end of the studied range."
        return 10, f"{mg:g} mg/day — below the studied range."
    if cat == "maca":
        mg = daily() * (entry.get("extract_ratio") or 1)
        if mg >= 1500: return 20, f"{mg:g} mg powder-equivalent/day — in the studied 1.5–3 g range."
        if mg >= 750: return 15, f"{mg:g} mg/day — half the studied dose."
        return 10, f"{mg:g} mg/day — token dose."
    if cat == "rhodiola":
        mg = daily()
        if mg > 700: return 16, f"{mg:g} mg/day — above the studied range."
        if mg >= 200: return 20, f"{mg:g} mg/day — in the studied 200–600 mg range."
        if mg >= 100: return 14, f"{mg:g} mg/day — below most trials."
        return 10, f"{mg:g} mg/day — token dose."
    if cat == "curcumin":
        mg = daily()
        enhanced = (entry.get("form_tier") or 0) >= 20
        if enhanced:
            # Studied doses differ by formulation: Meriva ~200 mg curcuminoids/day
            # (1 g Meriva), TurmiPure Gold 90 mg (300 mg extract), BCM-95 150 mg.
            if mg >= 180: return 20, f"{mg:g} mg curcuminoids/day in an enhanced-absorption form — at or above the studied doses."
            if mg >= 90:  return 16, f"{mg:g} mg/day — within the range the formulation trials used."
            if mg >= 40:  return 12, f"{mg:g} mg/day — below the formulation's studied dose."
            return 8, f"{mg:g} mg/day — token dose."
        if mg >= 1000: return 20, f"{mg:g} mg curcuminoids/day — the plain-extract dose the osteoarthritis trials used."
        if mg >= 500: return 16, f"{mg:g} mg/day — lower end for a plain extract."
        return 10, f"{mg:g} mg/day — too little plain curcumin to expect absorption."

    # Vitamins batch (v1.5)
    if cat == "vitamin_b12":
        ug = daily()
        if ug > 2000: return 16, f"{ug:g} µg/day — far above any studied dose; harmless, but pointless."
        if ug >= 25:  return 20, f"{ug:g} µg/day — covers the 50–100 µg/day a vegan needs, or a weekly 2,000 µg."
        if ug >= 4:   return 12, f"{ug:g} µg/day — reference intake, but passive absorption at this dose is ~1 %."
        return 8, f"{ug:g} µg/day — below the reference intake."
    if cat == "vitamin_k2":
        ug = daily()
        if ug >= 200: return 17, f"{ug:g} µg/day MK-7 — the top of the trial range (375 µg for 3 years)."
        if ug >= 90:  return 20, f"{ug:g} µg/day MK-7 — the range the bone-density trials used."
        if ug >= 45:  return 16, f"{ug:g} µg/day — below most trials."
        return 10, f"{ug:g} µg/day — token dose."
    if cat == "biotin":
        # More is worse here. Nothing above the reference intake has evidence in
        # healthy people, and from ~1 mg the FDA-documented lab-test interference
        # starts to matter. The ladder points DOWN with dose, on purpose.
        ug = daily()
        if ug >= 2500: return 8, f"{ug:g} µg/day — a hair-product megadose with no trial behind it; falsifies troponin and thyroid tests."
        if ug > 300:   return 14, f"{ug:g} µg/day — above any need; lab interference possible from ~1,000 µg."
        if ug >= 40:   return 20, f"{ug:g} µg/day — covers the 40 µg reference intake."
        return 12, f"{ug:g} µg/day — below the reference intake."
    if cat == "folate":
        ug = daily()
        if ug > 1000: return 8, f"{ug:g} µg/day — above the EFSA upper limit for folic acid (1,000 µg); can mask a B12 deficiency."
        if ug >= 400: return 20, f"{ug:g} µg/day — the periconceptional dose the neural-tube-defect trials used."
        if ug >= 200: return 14, f"{ug:g} µg/day — reference intake, below the pregnancy dose."
        return 8, f"{ug:g} µg/day — token dose."
    if cat == "tribulus":
        mg = daily()
        return 8, f"{mg:g} mg/day — no tribulus dose has raised testosterone in men; scored as a token."
    if cat == "fenugreek":
        mg = daily()
        if mg > 1200: return 14, f"{mg:g} mg/day — above the studied range."
        if mg >= 500: return 20, f"{mg:g} mg/day — the 500–600 mg the testosterone trials used."
        if mg >= 300: return 15, f"{mg:g} mg/day — below the studied range."
        return 8, f"{mg:g} mg/day — token dose."
    if cat == "zma":
        # Zinc per day. The one positive ZMA trial used 30 mg — above the 25 mg
        # EFSA ceiling — and the independent replication found nothing at the
        # same dose, so the band stops at the ceiling, not at the trial.
        mg = daily()
        if mg > 25:  return 12, f"{mg:g} mg zinc/day — above the EFSA upper limit (25 mg); the ZMA trial dose, but the replication found nothing."
        if mg >= 10: return 20, f"{mg:g} mg zinc/day — covers the reference intake and stays under the 25 mg limit."
        if mg >= 5:  return 12, f"{mg:g} mg zinc/day — half the reference intake."
        return 8, f"{mg:g} mg zinc/day — token dose."
    # Minerals (v1.6)
    if cat == "iron":
        # EFSA (2024) set no UL, only a 40 mg/day "safe level" for TOTAL intake,
        # derived from trials where 20–25 mg of supplemental iron on top of food
        # caused no black stools. Treatment doses (60–100 mg) work in proven
        # deficiency, but belong with a blood test — so they score lower here.
        mg = daily()
        if mg > 65:  return 6,  f"{mg:g} mg iron/day — a treatment dose; needs a blood test and medical follow-up."
        if mg > 40:  return 10, f"{mg:g} mg iron/day — above EFSA's 40 mg/day safe level on its own."
        if mg > 25:  return 14, f"{mg:g} mg iron/day — with food, total intake passes EFSA's 40 mg/day safe level."
        if mg >= 14: return 20, f"{mg:g} mg iron/day — at or above the NRV, within the supplemental amount behind EFSA's safe level."
        if mg >= 5:  return 14, f"{mg:g} mg iron/day — a maintenance top-up below the 14 mg NRV."
        return 8, f"{mg:g} mg iron/day — too little to correct a deficiency."
    if cat == "potassium":
        # No EFSA UL. Band = the dose range of the pooled blood-pressure trials
        # (from 30 mmol ≈ 1,170 mg/day), capped where the benefit reversed and at
        # the 3,000 mg adult maximum of the 2024 ANSES-approved draft. The French
        # cap in force (80 mg/day, arrêté du 9 mai 2006) is regulatory, not a
        # toxicity threshold — so, as for melatonin above its 1.9 mg ceiling, it
        # caps the tier at 14 instead of zeroing it, and each product says why.
        mg = daily()
        if mg > 3000:  return 8,  f"{mg:g} mg potassium/day — above the 3,000 mg adult maximum of the 2024 draft; the blood-pressure benefit reverses."
        if mg >= 1170: return 14, f"{mg:g} mg potassium/day — the range of the blood-pressure trials, but above the 80 mg French maximum for supplements still in force."
        if mg >= 300:  return 12, f"{mg:g} mg potassium/day — below the lowest dose of the pooled blood-pressure trials."
        return 6, f"{mg:g} mg potassium/day — under 15 % of the 2,000 mg NRV."
    return None
