"""Proof dates cannot outlive changes to the identity or facts they support."""
import copy
import json
import unittest
from pathlib import Path

import audit_sources
import verification


class VerificationTests(unittest.TestCase):
    def setUp(self):
        self.product = {
            'id': 'example-magnesium', 'brand': 'Example', 'name': 'Magnésium Bisglycinate',
            'variant': '60 gélules', 'url': 'https://example.test/products/magnesium',
            'units_pack': 60, 'units_per_day': 1, 'price_eur': 12.9,
            'nutrients': {'magnesium': 100}, 'transparency': {},
        }
        binding = {key: self.product.get(key) for key in verification.IDENTITY_FIELDS}
        matched = {'name': 'Magnésium Bisglycinate 60 gélules', 'brand': 'Example'}
        self.source = {
            'source_url': self.product['url'], 'checked_on': '2026-10-05',
            'status': 'identity_verified', 'source_reachable': True,
            'identity_verified': True, 'price_verified': True,
            'observed_price_eur': 12.9, 'matched_product': matched,
            'product_identity': copy.deepcopy(binding),
            'identity_checks': audit_sources.identity(self.product, matched),
        }
        self.label = {
            'checked_on': '2026-10-05', 'source_url': self.product['url'],
            'scope': 'Nutriments indiqués et prise journalière.',
            'product_identity': copy.deepcopy(binding),
            'fields': {'nutrients': {'magnesium': 100}, 'units_per_day': 1},
        }
        self.price = {
            'checked_on': '2026-10-05', 'source_url': self.product['url'],
            'scope': 'Prix fabricant, hors livraison.', 'price_eur': 12.9,
            'variant': '60 gélules', 'product_identity': copy.deepcopy(binding),
        }

    def attached(self, sources=True, labels=True, manual_price=False):
        entries = {'label': self.label} if labels else {}
        if manual_price:
            entries['price'] = self.price
        # Entry-level date must never stand in for absent field-specific evidence.
        entries['checked_on'] = '2026-10-05'
        return verification.attach(self.product,
                                   {self.product['id']: self.source} if sources else {},
                                   {self.product['id']: entries})

    def test_intact_evidence_dates_only_supported_fields(self):
        result = self.attached()
        self.assertEqual(result['label_checked_on'], '2026-10-05')
        self.assertEqual(result['price_checked_on'], '2026-10-05')
        self.assertNotIn('verified', result)

    def test_changed_url_invalidates_source_label_and_manual_price(self):
        self.product['url'] = 'https://example.test/products/other'
        result = self.attached(manual_price=True)
        self.assertIsNone(result['checked_on'])
        self.assertFalse(result['source_reachable'])
        self.assertNotIn('label_checked_on', result)
        self.assertNotIn('price_checked_on', result)

    def test_changed_nutrient_invalidates_label_but_not_independent_pack_price(self):
        self.product['nutrients']['magnesium'] = 200
        result = self.attached()
        self.assertNotIn('label_checked_on', result)
        self.assertIn('price_checked_on', result)

    def test_changed_daily_units_invalidates_label(self):
        self.product['units_per_day'] = 2
        self.assertNotIn('label_checked_on', self.attached())

    def test_unchecked_field_change_does_not_expand_or_destroy_label_scope(self):
        self.product['notes'] = 'Description éditoriale modifiée.'
        result = self.attached()
        self.assertEqual(result['label_scope'], self.label['scope'])
        self.assertIn('label_checked_on', result)

    def test_any_different_price_never_gets_an_observation_date(self):
        for changed in (12.89, 12.9001, 13.9, float('inf'), float('nan'), True):
            with self.subTest(price=changed):
                self.product['price_eur'] = changed
                self.assertNotIn('price_checked_on', self.attached(manual_price=True))

    def test_changed_variant_invalidates_automatic_and_manual_price(self):
        self.product['variant'] = '90 gélules'
        result = self.attached(manual_price=True)
        self.assertNotIn('price_checked_on', result)
        self.assertNotIn('label_checked_on', result)
        self.assertEqual(result['source_status'], 'reachable_unverified')

    def test_changed_pack_invalidates_price_even_if_variant_text_is_stale(self):
        self.product['units_pack'] = 90
        self.assertNotIn('price_checked_on', self.attached(labels=False))

    def test_changed_pack_invalidates_manual_price_even_if_variant_text_is_stale(self):
        self.product['units_pack'] = 90
        self.assertNotIn('price_checked_on', self.attached(sources=False, manual_price=True))

    def test_changed_ean_invalidates_manual_fields(self):
        self.product['ean'] = '1234567890128'
        result = self.attached(sources=False, manual_price=True)
        self.assertNotIn('price_checked_on', result)
        self.assertNotIn('label_checked_on', result)

    def test_changed_brand_invalidates_proofs(self):
        self.product['brand'] = 'Other manufacturer'
        result = self.attached(manual_price=True)
        self.assertNotIn('label_checked_on', result)
        self.assertNotIn('price_checked_on', result)

    def test_missing_label_date_is_not_inferred_from_entry_or_source(self):
        self.label.pop('checked_on')
        self.assertNotIn('label_checked_on', self.attached())

    def test_missing_source_date_is_not_inferred_from_label(self):
        self.source.pop('checked_on')
        self.assertNotIn('price_checked_on', self.attached())

    def test_missing_manual_price_date_is_not_inferred_from_entry(self):
        self.price.pop('checked_on')
        self.assertNotIn('price_checked_on', self.attached(sources=False, manual_price=True))

    def test_invalid_date_is_not_exposed_as_proof(self):
        self.label['checked_on'] = '2026-99-99'
        self.source['checked_on'] = 'yesterday'
        result = self.attached()
        self.assertNotIn('label_checked_on', result)
        self.assertNotIn('price_checked_on', result)

    def test_reachable_page_and_equal_price_do_not_establish_exact_reference(self):
        self.source.update(status='reachable_unverified', identity_verified=False)
        self.assertNotIn('price_checked_on', self.attached(labels=False))

    def test_blocked_or_broken_source_cannot_prove_price(self):
        for status in ('blocked', 'broken_source', 'unavailable'):
            with self.subTest(status=status):
                self.source['status'] = status
                self.assertNotIn('price_checked_on', self.attached(labels=False))

    def test_missing_identity_binding_does_not_prove_automatic_price(self):
        self.source.pop('product_identity')
        self.assertNotIn('price_checked_on', self.attached(labels=False))

    def test_missing_identity_binding_does_not_prove_manual_fields(self):
        self.label.pop('product_identity')
        self.price.pop('product_identity')
        result = self.attached(sources=False, manual_price=True)
        self.assertNotIn('label_checked_on', result)
        self.assertNotIn('price_checked_on', result)

    def test_manufacturer_evidence_can_support_a_different_retailer_url(self):
        self.label['source_url'] = 'https://manufacturer.test/label.pdf'
        self.price['source_url'] = 'https://manufacturer.test/direct-shop'
        result = self.attached(sources=False, manual_price=True)
        self.assertEqual(result['label_source_url'], self.label['source_url'])
        self.assertEqual(result['price_source_url'], self.price['source_url'])

    def test_same_gtin_with_missing_flavour_text_retains_bound_identity(self):
        self.product.update(ean='1234567890128', variant='Nature · 60 gélules')
        self.source.update(matched_product={'name':'Magnésium Bisglycinate', 'gtin13':'1234567890128'},
                           product_identity={key:self.product.get(key) for key in verification.IDENTITY_FIELDS})
        self.source['identity_checks'] = audit_sources.identity(self.product, self.source['matched_product'])
        self.assertIn('price_checked_on', self.attached(labels=False))
        self.product['variant'] = 'Citron · 60 gélules'
        self.assertNotIn('price_checked_on', self.attached(labels=False))

    def test_certification_warning_is_not_an_unearned_certificate_date(self):
        self.product['transparency']['coa_published'] = True
        result = self.attached()
        self.assertTrue(any('documents de lot' in text for text in result['pending_fields']))
        self.assertNotIn('certificate_checked_on', result)


class CatalogueEvidenceRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        raw = (root/'data.js').read_text().split('= ', 1)[1].rstrip().rstrip(';')
        cls.products = {p['id']: p for p in json.loads(raw)['products']}
        cls.sources, cls.labels = verification.load()

    def test_adam_folate_mass_is_not_replaced_by_dfe_and_d2_is_not_d3(self):
        product = copy.deepcopy(self.products['now-adam'])
        self.assertEqual(product['nutrients']['folate'], 400)
        self.assertEqual(product['nutrients']['vitamin_d2'], 1000)
        self.assertNotIn('vitamin_d3', product['nutrients'])
        self.assertIn('label_checked_on', verification.attach(product, self.sources, self.labels))
        product['nutrients']['folate'] = 680  # DFE printed alongside 400 µg folic acid.
        self.assertNotIn('label_checked_on', verification.attach(product, self.sources, self.labels))

    def test_reported_pack_mismatches_and_generic_pages_never_acquire_price_dates(self):
        for product_id in ('on-gold-standard-whey',
                           'arkopharma-arkorelax-sommeil-fort-8h-30-comprimes-bicouches',
                           'pileje-lactibiane-reference-30-gelules'):
            with self.subTest(product=product_id):
                result = verification.attach(self.products[product_id], self.sources, self.labels)
                self.assertNotIn('price_checked_on', result)

    def test_every_automatic_price_date_has_equal_current_price_and_identity_binding(self):
        for product in self.products.values():
            result = verification.attach(product, self.sources, {})
            if result.get('price_checked_on'):
                with self.subTest(product=product['id']):
                    source = self.sources[product['id']]
                    self.assertEqual(product['price_eur'], source['observed_price_eur'])
                    self.assertEqual(source['product_identity'],
                                     {key:product.get(key) for key in verification.IDENTITY_FIELDS})
                    self.assertTrue(source['identity_verified'])


if __name__ == '__main__':
    unittest.main()
