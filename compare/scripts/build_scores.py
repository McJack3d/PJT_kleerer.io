#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 kleerer.
#
# This file is part of the kleerer scoring engine and collection pipeline.
# Licensed under the GNU Affero General Public License v3.0 ONLY; see LICENSE.
# A separate commercial licence is available for parties who cannot accept the
# AGPL's obligations: hello@kleerer.com. The commercial licence covers this code
# only -- it conveys NO right in the collected archive, which is unpublished and
# all rights reserved. See NOTICE.md.

"""
kleerer. — Health & Compo Score builder (v1.1)

Reads the curated v1 dataset (data/products_raw.json, already coded) AND the
French-market agent datasets (data/fr/*.json, free-text labels), normalizes the
latter through scripts/autotag.py (the same module the pipeline uses), scores
everything on one code path, and writes data.js.

Every rule mirrors METHODOLOGY.md. Change one, change both.
"""
import json, os, sys, datetime, hashlib, glob, re
import autotag, review, alert

HERE = os.path.dirname(os.path.abspath(__file__))
V1   = os.path.join(HERE, "..", "data", "products_raw.json")
FRDIR= os.path.join(HERE, "..", "data", "fr")
# Brick-and-mortar-only products (guidelines §5.1 item 3). These have no online
# listing, so no crawler will ever reach them — their price is observed in a shop
# by a human and recorded by scripts/instore.py. They are scored on exactly the
# same code path as everything else: a product that is hard to collect is not a
# product that deserves a softer standard.
INSTORE = os.path.join(HERE, "..", "data", "instore")
OUT  = os.path.join(HERE, "..", "data.js")

# --------------------------------------------------------------------------- #
#  v1.2 purity penalties. Mirrors METHODOLOGY.md §2.
#  Heavier penalties for the most evidence-backed harms; sugar > any sweetener.
#  "banned" carries no penalty here — it is a RED CARD handled in main() (score→0).
# --------------------------------------------------------------------------- #
PURITY_PENALTIES = {
    "hydrogenated_fat": 25,     # fully hydrogenated (saturated); partial = trans = red card
    "undisclosed_doses": 10, "proprietary_blend": 10,
    "severe_antioxidant": 10,   # BHA/BHT — IARC 2B / endocrine suspicion
    "added_sugar": 8,           # strongest harm evidence of any additive here
    "sweetener_d": 6,           # sucralose, erythritol, xylitol — mechanistic/CV signal
    "sweetener_c": 4,           # aspartame, acesulfame-K — cohort cancer/CVD signal
    "artificial_colour": 3,     # azo dyes needing the EU child-attention warning
    "sweetener_b": 2,           # saccharin, cyclamate — reassuring but not natural
    "polyol": 2, "synthetic_carrier": 2, "artificial_flavour": 2,
    "lecithin": 2, "thickener": 2, "bulking_filler": 2, "anticaking": 2, "coating": 2,
    "preservative": 2,          # E200-E203 sorbates/benzoates — approved, no harm signal
    # --- the -1 band (v1.3) -------------------------------------------------
    # Two things were being forced into -2-or-nothing that deserve neither.
    #
    # "undisclosed_minor" is a TRANSPARENCY deduction, not a harm claim: a label
    # saying "support comprimé standard" or a bare "arômes" has declared that
    # something is there without saying what. That is materially different from
    # an undisclosed blend of ACTIVES (proprietary_blend, -10) — you can still
    # assess the product, you just cannot audit its excipients — and different
    # again from a named additive with an evidence base behind its penalty.
    #
    # "acidity_regulator" covers trace pH and leavening agents. The method
    # already calls citric acid neutral; -1 says "an added technological
    # ingredient" without pretending a pH adjuster carries a health signal.
    "undisclosed_minor": 1,
    "acidity_regulator": 1,
    "banned": 0,                # red card handled separately in main()
    # There is deliberately NO "unknown" penalty any more. An unreadable
    # ingredient used to cost 2 points and ship; a -2 is a claim that the worst
    # case is mild, which is precisely what we do not know. Unrecognised strings
    # now withhold the product until a human rules on them — see review.py and
    # guidelines §5.2. If "unknown" ever reaches purity_score again, it raises.
}

def purity_score(tags):
    total = 0
    for t in tags:
        base = next((k for k in PURITY_PENALTIES if t.startswith(k)), None)
        if base is None:
            raise ValueError(f"Unknown purity tag: {t}")
        total += PURITY_PENALTIES[base]
    return max(0, 30 - total)

def transparency_score(t):
    s = 0
    if t.get("coa_published"): s += 12
    if t.get("third_party_cert"): s += 10
    if t.get("branded_ingredient"): s += 4
    if t.get("full_label"): s += 4
    return s

# --------------------------------------------------------------------------- #
#  Dose scores. Categories with entry-level logic carry a pre-computed
#  dose_tier (multivitamin from v1; zinc/vitamin_c/collagen/probiotics/
#  melatonin from normalize). The rest are formula-scored here.
# --------------------------------------------------------------------------- #
def dose_score(p):
    if "dose_tier" in p:
        return p["dose_tier"]
    c = p["category"]
    if c == "whey":
        d = p["active_per_100g"]; return 20 if d>=80 else 17 if d>=75 else 14 if d>=70 else 10
    if c == "creatine":
        g = p["active_per_serving_g"]; return 20 if 3<=g<=5 else 12
    if c == "vitamin_d3":
        iu = p["active_per_unit"]*p["units_per_day"]
        if iu>4000: return 8
        if 800<=iu<=2000: return 20
        if 400<=iu<800: return 14
        if 200<=iu<400: return 10
        return 6
    if c == "magnesium":
        mg = p["active_per_unit"]*p["units_per_day"]
        if 100<=mg<=250: return 20
        if 250<mg<=400: return 17
        if mg<100: return 8
        return 12
    if c == "omega3":
        mg = p["active_per_unit"]*p["units_per_day"]
        return 20 if mg>=1000 else 17 if mg>=500 else 12 if mg>=250 else 8
    raise ValueError(f"No dose rule for {c}")

# --------------------------------------------------------------------------- #
#  Value metrics — normalised to a standard daily dose per category. §Value.
# --------------------------------------------------------------------------- #
STD = {
    "whey":        {"amount": 25,   "label": "€ / 25 g protein"},
    "creatine":    {"amount": 3,    "label": "€ / 3 g creatine"},
    "vitamin_d3":  {"amount": 1000, "label": "€ / 1000 IU"},
    "magnesium":   {"amount": 300,  "label": "€ / 300 mg Mg"},
    "omega3":      {"amount": 500,  "label": "€ / 500 mg EPA+DHA"},
    "multivitamin":{"amount": None, "label": "€ / day"},
    "zinc":        {"amount": 15,   "label": "€ / 15 mg Zn"},
    "vitamin_c":   {"amount": 1000, "label": "€ / 1000 mg C"},
    "collagen":    {"amount": 10,   "label": "€ / 10 g collagen"},
    "probiotics":  {"amount": None, "label": "€ / day"},
    "melatonin":   {"amount": None, "label": "€ / day"},
    # Botanicals (v1.4). Not nutrients: no reference intake, no EFSA limit, and
    # no authorised health claim. They are scored on the SAME code path because a
    # plant extract is still a label with a form, a dose and an additives list —
    # the evidence behind each is on /compare/evidence/, graded separately.
    "ashwagandha": {"amount": 600,  "label": "€ / 600 mg extract"},
    "maca":        {"amount": 3000, "label": "€ / 3 g maca"},
    "rhodiola":    {"amount": 400,  "label": "€ / 400 mg extract"},
    "curcumin":    {"amount": 500,  "label": "€ / 500 mg curcuminoids"},
    # Vitamins batch (v1.5)
    "vitamin_b12": {"amount": 500,  "label": "€ / 500 µg B12"},
    "vitamin_k2":  {"amount": 100,  "label": "€ / 100 µg MK-7"},
    "b_complex":   {"amount": None, "label": "€ / day"},
    "biotin":      {"amount": None, "label": "€ / day"},
    "folate":      {"amount": 400,  "label": "€ / 400 µg folate"},
    # Sold to raise testosterone (v1.5). Shown in their own colour, because the
    # evidence page's honest summary of the group is "mostly no". Scored on the
    # same method — which is exactly why they land low: form is "the extract the
    # trials used", and for tribulus no dose has ever raised testosterone in men.
    "tribulus":    {"amount": None, "label": "€ / day"},
    "fenugreek":   {"amount": 600,  "label": "€ / 600 mg extract"},
    # ZMA is scored on its zinc (the only component with a testosterone claim,
    # and only in deficiency); magnesium and B6 ride along as secondary actives.
    "zma":         {"amount": None, "label": "€ / day"},
    # Minerals + vitamin E (v1.6). The standard dose is the EU nutrient reference
    # value (Reg. 1169/2011, Annex XIII) — for these there is no single "trial
    # dose" that applies to everyone, and the NRV is the figure printed on the
    # label as 100 %, so a shopper can check the maths against the pack.
    "iron":        {"amount": 14,   "label": "€ / 14 mg iron (NRV)"},
    "calcium":     {"amount": 800,  "label": "€ / 800 mg calcium (NRV)"},
    "iodine":      {"amount": 150,  "label": "€ / 150 µg iodine (NRV)"},
    "selenium":    {"amount": 55,   "label": "€ / 55 µg selenium (NRV)"},
    "chromium":    {"amount": 40,   "label": "€ / 40 µg chromium (NRV)"},
    "potassium":   {"amount": 2000, "label": "€ / 2000 mg potassium (NRV)"},
    "vitamin_e":   {"amount": 12,   "label": "€ / 12 mg vitamin E (NRV)"},
}

# Categories shown apart on the site: plant extracts with pharmacological
# effects, not nutrients. The list lives here so the UI, the value table and the
# evidence page all agree on what a "botanical" is.
BOTANICALS = ["ashwagandha", "maca", "rhodiola", "curcumin"]
BOOSTERS = ["tribulus", "fenugreek", "zma"]

def value_metrics(p):
    c, price = p["category"], p["price_eur"]
    std = STD[c]
    if "pack_g" in p:                                   # gram-based
        total_active = p["pack_g"] * p["active_per_100g"] / 100.0
        servings = p["pack_g"] / p["serving_g"]
        cost_day = price / servings
        value_std = price / total_active * std["amount"]
        days = servings
    else:                                               # unit-based
        days = p["units_pack"] / p["units_per_day"]
        cost_day = price / days
        if std["amount"] is None:
            value_std = cost_day
        else:
            total_active = p["units_pack"] * p["active_per_unit"]
            value_std = price / total_active * std["amount"]
    return round(cost_day, 3), round(value_std, 3), round(days), std["label"]

def grade(s):
    return "A" if s>=80 else "B" if s>=65 else "C" if s>=50 else "D" if s>=35 else "E"

# --------------------------------------------------------------------------- #
#  Provenance (v1.2). Country of MANUFACTURE per brand + a proximity malus.
#  IMPORTANT: this malus is kept OUT of the Health & Compo Score — a clean
#  German product is not "less healthy" than a French one. It is shown as a
#  separate, transparent axis (kleerer has a French-market focus). See
#  METHODOLOGY.md. Zones: FR (made in France) · EU (EU/EEA) · EXTRA_EU (outside).
# --------------------------------------------------------------------------- #
ZONE_MALUS = {"FR": 0, "EU": 1, "EXTRA_EU": 3, "UNKNOWN": 0}
PROVENANCE = {  # accent-free lowercase brand key -> (country, zone)
    "myprotein": ("United Kingdom", "EXTRA_EU"), "optimum nutrition": ("USA/UK", "EXTRA_EU"),
    "esn": ("Germany", "EU"), "bulk": ("United Kingdom", "EXTRA_EU"),
    "nutrimuscle": ("Belgium", "EU"), "prozis": ("Portugal", "EU"),
    "nutripure": ("France", "FR"), "nutri&co": ("France", "FR"), "nutri&co ": ("France", "FR"),
    "sunday natural": ("Germany", "EU"), "solgar": ("USA", "EXTRA_EU"),
    "now foods": ("USA", "EXTRA_EU"), "mivolis": ("Germany", "EU"),
    "novoma": ("France", "FR"), "whc": ("Belgium", "EU"), "norsan": ("Norway", "EU"),
    "foodspring": ("Germany", "EU"), "eiyolab": ("France", "FR"),
    "eric favre": ("France", "FR"), "protealpes": ("France", "FR"),
    "superphysique": ("France", "FR"), "am nutrition": ("France", "FR"),
    "yam nutrition": ("France", "FR"), "dynveo": ("France", "FR"), "unae": ("France", "FR"),
    "argalys": ("France", "FR"), "mium lab": ("France", "FR"), "biocyte": ("France", "FR"),
    "vitavea": ("France", "FR"), "onatera": ("France", "FR"), "d-lab": ("France", "FR"),
    "granions": ("France", "FR"), "forte pharma": ("France", "FR"), "juvamine": ("France", "FR"),
    "lescuyer": ("France", "FR"), "arkopharma": ("France", "FR"), "aroma-zone": ("France", "FR"),
    "aime": ("France", "FR"), "holidermie": ("France", "FR"), "colnatur": ("Spain", "EU"),
    "epycure": ("France", "FR"), "cuure": ("France", "FR"), "pileje": ("France", "FR"),
    "dijo": ("France", "FR"), "apyforme": ("France", "FR"), "sanofi": ("France", "FR"),
    "zzzquil": ("EU", "EU"),
    # botanicals batch (v1.4)
    "nat&form": ("France", "FR"), "nat form": ("France", "FR"), "biotechusa": ("Hungary", "EU"),
    "inshape": ("France", "FR"), "tibo inshape": ("France", "FR"), "nutriandco": ("France", "FR"),
    "pure am nutrition": ("France", "FR"),
}

def provenance_for(brand):
    n = autotag._norm(brand or "")
    for key, (country, zone) in PROVENANCE.items():
        if key.strip() and key.strip() in n:
            return {"country": country, "zone": zone, "malus": ZONE_MALUS[zone]}
    return {"country": None, "zone": "UNKNOWN", "malus": 0}

def price_tier(value_std, mean, std):
    """1–5 affordability band within a category (1 = cheapest per standard dose,
    5 = priciest), from the z-score of the normalized €/dose. Shown separately
    from the health score."""
    if std < 1e-9:
        return 3
    z = (value_std - mean) / std
    return 1 if z < -0.9 else 2 if z < -0.3 else 3 if z <= 0.3 else 4 if z <= 0.9 else 5

def slug(*parts):
    s = "-".join(parts).lower()
    s = re.sub(r"[àâä]", "a", s); s = re.sub(r"[éèêë]", "e", s)
    s = re.sub(r"[îï]", "i", s); s = re.sub(r"[ôö]", "o", s); s = re.sub(r"[ûü]", "u", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s

# --------------------------------------------------------------------------- #
#  Normalize an agent (free-text) entry into the unified scored schema, using
#  the same autotag module the pipeline uses.
# --------------------------------------------------------------------------- #
MULTI_FORM = {"bioactive": (20, "Bioactive / chelated forms."),
              "standard": (12, "Standard vitamin/mineral forms."),
              "cheap": (8, "Cheap forms (oxides, cyanocobalamin, retinol).")}
MULTI_DOSE = {"physiological": (20, "Physiological ~100% NRV coverage."),
              "mixed": (15, "Mixed dosing."),
              "megadose_b": (12, "B-vitamin megadosing far above NRV."),
              "gaps": (10, "Notable gaps (missing minerals or low vitamin D).")}

def normalize(entry):
    c = entry["category"]
    p = dict(entry)
    p["id"] = slug(entry["brand"], entry["name"], entry.get("variant",""))
    # form tier
    if c in ("multivitamin", "b_complex"):
        p["form_tier"], p["form_note"] = MULTI_FORM.get(entry.get("form_quality","standard"))
        p["dose_tier"], p["dose_note"] = MULTI_DOSE.get(entry.get("dose_style","mixed"))
    else:
        p["form_tier"], p["form_note"] = autotag.infer_form_tier(c, entry.get("form",""), entry)
    # collagen daily dose for dosing/value
    if c == "collagen":
        if entry.get("format") == "powder" or "pack_g" in entry:
            p["collagen_g_day"] = entry.get("active_per_serving_g")
        else:
            p["collagen_g_day"] = entry.get("active_per_unit",0) * entry.get("units_per_day",1)
    # dose tier for override categories
    if c in ("zinc","vitamin_c","collagen","probiotics","melatonin",
             "ashwagandha","maca","rhodiola","curcumin",
             "vitamin_b12","vitamin_k2","biotin","folate","tribulus","fenugreek","zma",
             "iron","calcium","iodine","selenium","chromium","potassium"):
        p["dose_tier"], p["dose_note"] = autotag.infer_dose_tier(c, p)
    # purity (v1.2: also returns red-card substances + unrecognised items to review)
    p["purity_tags"], p["additives_detail"], p["banned"], p["review_flags"] = \
        autotag.tags_from_additives(entry.get("additives"))
    # transparency
    p["transparency"] = {
        "coa_published": bool(entry.get("coa_published")),
        "third_party_cert": bool(entry.get("third_party_cert")),
        "branded_ingredient": entry.get("branded_ingredient"),
        "full_label": bool(entry.get("full_label", True)),
    }
    p.setdefault("flags", [])
    p.setdefault("notes", "")
    return p

def label_hash(p):
    """Stable fingerprint of the label facts we score. The pipeline diffs this
    across daily snapshots to detect silent reformulations."""
    basis = {
        "form": p.get("form"), "additives": sorted(p.get("additives_detail", [])),
        "certifications": sorted(p.get("certifications", [])),
        "active_per_serving_g": p.get("active_per_serving_g"),
        "active_per_100g": p.get("active_per_100g"),
        "active_per_unit": p.get("active_per_unit"),
        "units_per_day": p.get("units_per_day"),
    }
    return hashlib.sha1(json.dumps(basis, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:12]

# --------------------------------------------------------------------------- #
def main():
    with open(V1, encoding="utf-8") as f:
        v1 = json.load(f)
    snapshot = v1["snapshot"]

    products = []
    for p in v1["products"]:
        p.setdefault("id", slug(p["brand"], p["name"], p.get("variant","")))
        products.append(p)
    for path in sorted(glob.glob(os.path.join(FRDIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            for entry in json.load(f):
                products.append(normalize(entry))
    # In-store observations, same schema plus `price_provenance`. Absent
    # directory is normal — the catalogue is online-only until the first shop
    # visit is recorded.
    for path in sorted(glob.glob(os.path.join(INSTORE, "*.json"))):
        with open(path, encoding="utf-8") as f:
            for entry in json.load(f):
                p = normalize(entry)
                p.setdefault("url", None)
                products.append(p)

    ledger = review.load()
    errors, seen = [], {}
    for p in products:
        if p["id"] in seen:
            errors.append(f"duplicate id: {p['id']}")
        seen[p["id"]] = True
        # Re-tag EVERY product from its additives list through the ONE v1.2 tagger,
        # so curated (v1) and scraped (FR) products are scored identically and the
        # new registry (red cards, sweetener tiers, review) applies uniformly.
        src_additives = p.get("additives_detail") or p.get("additives") or []
        p["purity_tags"], p["additives_detail"], p["banned"], p["review_flags"] = \
            autotag.tags_from_additives(src_additives)

        # §5.2 gate. Strings the tagger could not read are looked up in the
        # review ledger. Ruled-on strings score as whatever they were ruled to
        # be; anything still pending withholds the whole product from the site.
        resolved_tags, resolved_banned, pending = review.resolve(p["review_flags"], ledger)
        p["purity_tags"] = [t for t in p["purity_tags"] if t != "unknown"] + resolved_tags
        p["banned"] = sorted(set(p["banned"]) | set(resolved_banned))
        p["review_pending"] = pending

        # On a product that ships, every once-unknown string has been ruled on by
        # a human. Carry the rulings, not the flags: "we could not read this" and
        # "someone read this and decided" are opposite claims, and the card used
        # to make the first one about products in the second state.
        p["reviewed"] = review.rulings_for(p["review_flags"], ledger)
        p.pop("review_flags", None)

        p["provenance"] = provenance_for(p.get("brand"))

        form = p["form_tier"]; dose = dose_score(p)
        pur = purity_score(p["purity_tags"]); tra = transparency_score(p["transparency"])
        for name, v, mx in (("form",form,20),("dose",dose,20),("purity",pur,30),("transparency",tra,30)):
            if not (0 <= v <= mx):
                errors.append(f"{p['id']}: {name} score {v} out of range 0–{mx}")
        red_card = bool(p["banned"])
        total = 0 if red_card else form + dose + pur + tra
        g = "E" if red_card else grade(total)
        cost_day, value_std, days, vlabel = value_metrics(p)
        p["scores"] = {"form":form,"dose":dose,"purity":pur,"transparency":tra,
                       "total":total,"grade":g,"red_card":red_card,
                       "banned_substances":p["banned"]}
        p["value"] = {"cost_per_day":cost_day,"std":value_std,"std_label":vlabel,"days_per_pack":days}
        p["label_hash"] = label_hash(p)
    if errors:
        sys.exit("SCORING ERRORS:\n" + "\n".join(errors))

    # ----------------------------------------------------------------------- #
    #  §5.2 — the gate. Anything with an unresolved ingredient string does not
    #  reach data.js at all. Not greyed out, not flagged on the card: absent.
    #  A card that says "we could not read this label" is still a published
    #  score for a product we cannot vouch for.
    #
    #  The split happens BEFORE ranking, so ranks and price tiers are computed
    #  over the products that actually ship — otherwise the site would show
    #  "3rd of 12" in a category displaying nine.
    # ----------------------------------------------------------------------- #
    withheld = [p for p in products if p["review_pending"]]
    products = [p for p in products if not p["review_pending"]]

    # what the last build was holding, so we can say what this build released
    prior = review.load_queue() or {}
    prior_ids = {w["id"] for w in prior.get("withheld_products", [])}
    released = len(prior_ids - {p["id"] for p in withheld})

    queue = review.write_queue([
        {"id": p["id"], "brand": p.get("brand"), "name": p.get("name"),
         "category": p.get("category"), "pending": p["review_pending"]}
        for p in withheld
    ])

    cats = {}
    for p in products:
        cats.setdefault(p["category"], []).append(p)
    for items in cats.values():
        items.sort(key=lambda x:(-x["scores"]["total"], x["value"]["std"]))
        for i,it in enumerate(items,1):
            it["rank_in_category"] = i
        # price tier 1–5, per category, from the €/standard-dose distribution
        vals = [it["value"]["std"] for it in items]
        mean = sum(vals)/len(vals)
        var = sum((v-mean)**2 for v in vals)/len(vals)
        std = var ** 0.5
        for it in items:
            it["value"]["price_tier"] = price_tier(it["value"]["std"], mean, std)

    n_red = sum(1 for p in products if p["scores"]["red_card"])
    payload = {
        "meta": {"snapshot":snapshot,"region":"EU/FR","currency":"EUR",
                 "generated":datetime.date.today().isoformat(),
                 "n_products":len(products),"n_categories":len(cats),
                 "n_red_cards":n_red,
                 "n_withheld_for_review":len(withheld),
                 "botanical_categories":BOTANICALS,
                 "booster_categories":BOOSTERS,
                 "methodology_version":"1.2"},
        "products": products,
    }
    js = ("// kleerer. dataset — generated by scripts/build_scores.py (v1.2). Do not edit by hand.\n"
          "// Sources of truth: data/products_raw.json + data/fr/*.json + METHODOLOGY.md\n"
          "//\n"
          "// SPDX-License-Identifier: CC-BY-NC-SA-4.0\n"
          "// Copyright (C) 2026 kleerer. Licence: LICENSE-DATA.md\n"
          "// https://creativecommons.org/licenses/by-nc-sa/4.0/\n"
          "//\n"
          "// This catalogue is a protected database (Dir. 96/9/EC; CPI art. L.341-1 ff.).\n"
          "// A single price is a fact and is free to quote; extraction or re-utilisation\n"
          "// of a SUBSTANTIAL PART is reserved. Text-and-data-mining rights reserved\n"
          "// (Dir. (EU) 2019/790 art. 4(3); CPI art. L.122-5-3) — see /.well-known/tdmrep.json.\n"
          "//\n"
          "// This file is ONE SCORED SNAPSHOT, published as proof of method. It is not the\n"
          "// historical archive, which is unpublished and all rights reserved. Nothing here\n"
          "// grants any right in that archive.\n"
          "const KLEERER_DATA = " + json.dumps(payload, ensure_ascii=False, indent=1) + ";\n")
    with open(OUT,"w",encoding="utf-8") as f:
        f.write(js)

    print(f"{len(products)} products across {len(cats)} categories → {os.path.relpath(OUT, os.path.join(HERE,'..'))}")
    if withheld:
        print(f"{len(withheld)} product(s) WITHHELD pending review — not written to data.js")
    for cat in sorted(cats):
        items = cats[cat]
        print(f"\n[{cat}]  ({len(items)})")
        for it in items:
            s = it["scores"]
            print(f"  {s['grade']} {s['total']:>3}  F{s['form']:>2} D{s['dose']:>2} P{s['purity']:>2} T{s['transparency']:>2}"
                  f"  {it['value']['std']:>8.3f} {it['value']['std_label']:<18} {it['brand']} — {it['name']}")

    # The last leg of §5.2: tell the owner. Withholding is the safe failure, but
    # a silent safe failure is how a catalogue quietly empties out.
    alert.cleared(released)
    alert.review_needed(queue)

if __name__ == "__main__":
    main()
