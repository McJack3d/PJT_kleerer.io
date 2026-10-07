#!/usr/bin/env python3
"""Offline evidence/identity regression fixtures, no merchant network requests."""
import unittest
import io
import tempfile
import time
from email.message import Message
from types import SimpleNamespace
import audit_sources as audit


class StructuredSourceTests(unittest.TestCase):
    def test_unicode_url_is_encoded_without_double_encoding(self):
        response = io.BytesIO(b'<title>Product</title>')
        response.status = 200
        response.headers = Message()
        response.headers['Content-Type'] = 'text/html; charset=utf-8'
        requested = []
        def opened(req, timeout):
            requested.append(req.full_url)
            return response
        with tempfile.TemporaryDirectory() as cache:
            client = audit.PoliteClient(0, 1, time.monotonic() + 10, cache)
            client.opener = SimpleNamespace(open=opened)
            result = client.request('https://example.test/products/®%20test')
        self.assertEqual(result['status'], 200)
        self.assertEqual(requested, ['https://example.test/products/%C2%AE%20test'])

    def test_graph_and_array_parsing_excludes_recommendations(self):
        page = '''<title> A &amp; B </title><script type="application/ld+json">
        {"@graph":[{"@type":"Product","name":"A","isRelatedTo":{"@type":"Product","name":"Not this product"},
        "offers":{"@type":"Offer","price":"29,90","priceCurrency":"EUR"}}]}</script>
        <script type="application/ld+json">[{"@type":"ProductGroup","hasVariant":[{"@type":"Product","name":"B"}]}]</script>'''
        result = audit.parse_page(page)
        self.assertEqual(result['title'], 'A & B')
        self.assertEqual([p['name'] for p in result['structured_products']], ['A', 'B'])
        self.assertEqual(result['structured_products'][0]['offers'][0]['price'], 29.9)

    def test_aggregate_offer_is_not_an_exact_price(self):
        result = audit.compact_product({'name':'Product', 'offers':{'@type':'AggregateOffer','lowPrice':'12','highPrice':'35'}})
        offer = result['offers'][0]
        self.assertTrue(offer['aggregate'])
        self.assertNotIn('price', offer)

    def test_members_only_offer_is_not_a_public_price(self):
        product = dict(self.product(), id="test", price_eur=20)
        page = '<title>Magnésium</title><script type="application/ld+json">' + \
            '{"@type":"Product","name":"Magnésium Bisglycinate 60 gélules","brand":"Marque",' + \
            '"offers":{"@type":"Offer","price":17,"priceCurrency":"EUR"}}</script>'
        for restriction in ("Cette offre est exclusivement réservée aux membres Prime.",
                            "This deal is exclusively for Prime members."):
            with self.subTest(restriction=restriction):
                client = SimpleNamespace(fetch=lambda url: {"status":200, "body":page + restriction})
                result = audit.audit_product(product, client, "2026-10-07")
                self.assertTrue(result["identity_verified"])
                self.assertFalse(result["price_verified"])
                self.assertIn("price_restriction", result)
        client = SimpleNamespace(fetch=lambda url: {"status":200, "body":page})
        self.assertTrue(audit.audit_product(product, client, "2026-10-07")["price_verified"])

    def test_decimal_pack_and_no_dose_confusion(self):
        self.assertEqual(audit.pack_values('0,5 kg / gélules 500 mg')['g'], {500})
        self.assertEqual(audit.pack_values('60 gélules 500 mg')['units'], {60})
        self.assertEqual(audit.pack_values('500 mg')['g'], set())

    def product(self):
        return {'name':'Magnésium Bisglycinate', 'brand':'Marque', 'variant':'60 gélules',
                'units_pack':60, 'url':'https://marque.example/products/magnesium', 'ean':None}

    def test_name_without_pack_is_not_verified(self):
        self.assertFalse(audit.identity(self.product(), {'name':'Magnésium Bisglycinate', 'brand':'Marque'})['exact'])

    def test_wrong_pack_is_not_verified(self):
        result = audit.identity(self.product(), {'name':'Magnésium Bisglycinate 90 gélules', 'brand':'Marque'})
        self.assertFalse(result['exact'])
        self.assertTrue(result['pack_conflict'])

    def test_matching_name_brand_pack_is_verified(self):
        self.assertTrue(audit.identity(self.product(), {'name':'Magnésium Bisglycinate 60 gélules', 'brand':'Marque'})['exact'])

    def test_flavour_must_be_explicit(self):
        product = {'name':'Whey Isolate', 'brand':'Marque', 'variant':'Chocolat · 1 kg', 'pack_g':1000,
                   'url':'https://marque.example/product'}
        self.assertFalse(audit.identity(product, {'name':'Whey Isolate 1 kg', 'brand':'Marque'})['exact'])
        self.assertTrue(audit.identity(product, {'name':'Whey Isolate chocolat 1 kg', 'brand':'Marque'})['exact'])

    def test_generic_name_cannot_conflate_strengths(self):
        product = dict(self.product(), name='Vitamine D3 naturelle végétale 1000 UI')
        node = {'name':'Vitamine D3 naturelle végétale 2000 UI 60 gélules', 'brand':'Marque'}
        result = audit.identity(product, node)
        self.assertTrue(result['name_match'])
        self.assertFalse(result['exact'])

    def test_explicit_conflicting_brand_is_not_overridden_by_domain(self):
        self.assertFalse(audit.identity(self.product(), {'name':'Magnésium Bisglycinate 60 gélules', 'brand':'Different'})['exact'])

    def test_common_french_name_on_retailer_without_brand_is_insufficient(self):
        product = dict(self.product(), name='Fer', url='https://pharmacie.example/product')
        self.assertFalse(audit.identity(product, {'name':'Fer 60 gélules'})['exact'])

    def test_conflicting_gtin_prevents_exact_verification(self):
        product = dict(self.product(), ean='1234567890128')
        node = {'name':'Magnésium Bisglycinate 60 gélules', 'brand':'Marque', 'gtin13':'1234567890999'}
        self.assertFalse(audit.identity(product, node)['exact'])

    def test_gtin_does_not_override_conflicting_pack(self):
        product = dict(self.product(), ean='1234567890128')
        self.assertFalse(audit.identity(product, {'name':'Magnesium 90 gélules','gtin13':'1234567890128'})['exact'])


if __name__ == '__main__':
    unittest.main()
