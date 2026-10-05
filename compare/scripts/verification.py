"""Attach dated, field-scoped evidence without upgrading an entire product."""
import datetime
import json
import math
from pathlib import Path

import audit_sources

DATA = Path(__file__).resolve().parent.parent / "data"
IDENTITY_FIELDS = ("brand", "name", "variant", "url", "pack_g", "units_pack", "ean")


def load():
    def read(name, default):
        path = DATA / name
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default
    sources = read("source-audit.json", {"products": []})
    labels = read("label-verifications.json", {"products": {}})
    return {p["product_id"]: p for p in sources["products"]}, labels["products"]


def _dated(evidence):
    """No check date is inherited from a build, an entry or a page visit."""
    checked = evidence.get("checked_on")
    if not isinstance(checked, str):
        return False
    try:
        datetime.date.fromisoformat(checked)
    except ValueError:
        return False
    return bool(evidence.get("source_url"))


def _identity_matches(product, evidence):
    binding = evidence.get("product_identity", {})
    return (isinstance(binding, dict)
            and all(key in binding and product.get(key) == binding[key] for key in IDENTITY_FIELDS))


def _same_price(current, observed):
    # A nearby float is not evidence for the displayed price. Values originate
    # from labels/offers, so no calculation tolerance or rounding is needed.
    return (type(current) in (int, float) and type(observed) in (int, float)
            and math.isfinite(current) and math.isfinite(observed)
            and current == observed)


def _offer_identity_matches(product, source):
    matched = source.get("matched_product")
    if (not isinstance(matched, dict) or not source.get("identity_verified")
            or not _identity_matches(product, source)):
        return False
    current = audit_sources.identity(product, matched)
    previous = source.get("identity_checks", {})
    # Re-run matching against the CURRENT record, and invalidate a changed pack
    # even when a GTIN remains copied onto it and the source omits its pack size.
    return (current["exact"]
            and current["expected_pack"] == previous.get("expected_pack"))


def attach(product, sources, labels):
    """Evidence must still match the current source, variant and observed values."""
    source = sources.get(product["id"], {})
    if source.get("source_url") != product.get("url"):
        source = {}
    current_source_identity = bool(source.get("identity_verified") and _offer_identity_matches(product, source))
    source_status = source.get("status", "not_checked")
    if source_status == "identity_verified" and not current_source_identity:
        source_status = "reachable_unverified" if source.get("source_reachable") else "not_checked"
    entry = labels.get(product["id"], {})
    result = {
        "checked_on": source.get("checked_on"),
        "source_status": source_status,
        "source_reachable": bool(source.get("source_reachable")),
        "review_notes": list(entry.get("review_notes", [])),
        "pending_fields": list(entry.get("pending_fields", [])),
    }
    label = entry.get("label", {})
    fields = label.get("fields", {})
    if (fields and _dated(label) and label.get("scope") and _identity_matches(product, label)
            and all(product.get(key) == value for key, value in fields.items())):
        result.update(label_checked_on=label["checked_on"],
                      label_scope=label["scope"], label_source_url=label["source_url"])
    elif fields:
        result["pending_fields"].append("Les données ou la preuve documentaire ont changé : contrôle à renouveler.")

    # A found offer is evidence of its own price, never of a different stored price.
    observed = source.get("observed_price_eur")
    if (source.get("price_verified") and source.get("source_reachable")
            and source.get("status") == "identity_verified" and _dated(source)
            and _same_price(product.get("price_eur"), observed)
            and current_source_identity):
        result.update(price_checked_on=source["checked_on"],
                      price_source_url=source.get("observed_offer_url") or source["source_url"],
                      price_scope="Offre en EUR pour la référence identifiée, hors livraison.",
                      availability=source.get("availability"))
    price = entry.get("price", {})
    if (price and _dated(price) and price.get("scope") and _identity_matches(product, price)
            and price.get("variant") == product.get("variant")
            and _same_price(price.get("price_eur"), product.get("price_eur"))):
        result.update(price_checked_on=price["checked_on"],
                      price_source_url=price["source_url"], price_scope=price["scope"])

    for mismatch in source.get("mismatch_candidates", []):
        if mismatch.get("field") == "price_eur":
            if not _same_price(product.get("price_eur"), mismatch.get("observed")):
                result["review_notes"].append(
                    f"Prix observé différent : {mismatch.get('observed')} € ; prix affiché à revoir.")
        elif mismatch.get("field") in ("variant", "pack", "units_pack", "pack_g"):
            result["pending_fields"].append("Le conditionnement de la source semble différent de cette fiche.")
    if product.get("transparency", {}).get("coa_published") or product.get("transparency", {}).get("third_party_cert"):
        result["pending_fields"].append("Certificats et analyses : documents de lot non revérifiés lors de cet audit.")
    result["pending_fields"] = list(dict.fromkeys(result["pending_fields"]))
    return result
