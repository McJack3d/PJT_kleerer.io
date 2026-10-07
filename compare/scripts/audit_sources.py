#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Bounded, polite source audit; this does not rewrite catalogue facts or prices.

Usage: python3 compare/scripts/audit_sources.py [--offline]
Network results are cached outside the repository in /tmp/n3gh-source-audit.
HTTP success only proves reachability. Exact identity additionally requires a
matching GTIN or a matched name, explicit pack and flavour in Product JSON-LD.
No generic page price, AggregateOffer lowPrice or recommendation is verification.
"""
import argparse
import collections
import concurrent.futures
import datetime
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import threading
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser

ROOT = Path(__file__).resolve().parents[1]
UA = 'n3gh-bot/0.1 (+https://n3gh.com/bot; supplement price & label transparency; contact: hello@n3gh.com)'
MAX_BYTES = 3_000_000
DEFAULT_DATE = '2026-10-05'


def clean(value, limit=180):
    if isinstance(value, dict):
        value = value.get('name') or value.get('value') or ''
    if not isinstance(value, (str, int, float)):
        return ''
    return re.sub(r'\s+', ' ', html.unescape(str(value))).strip()[:limit]


def normalized(value):
    return re.sub(r'[^a-z0-9]+', ' ', unicodedata.normalize('NFKD', clean(value, 2000)).encode('ascii', 'ignore').decode().lower()).strip()


def schema_type(node, expected):
    kinds = node.get('@type', [])
    if isinstance(kinds, str):
        kinds = [kinds]
    return any(str(k).rsplit('/', 1)[-1].lower() == expected.lower() for k in kinds)


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts, self.scripts, self.script_parts = [], [], []
        self.in_title = self.in_ld = False
        self.canonical = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title':
            self.in_title = True
        if tag == 'script' and attrs.get('type', '').lower().split(';')[0] == 'application/ld+json':
            self.in_ld = True
            self.script_parts = []
        if tag == 'link' and attrs.get('rel', '').lower() == 'canonical':
            self.canonical = attrs.get('href')

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        if tag == 'script' and self.in_ld:
            self.scripts.append(''.join(self.script_parts))
            self.in_ld = False

    def handle_data(self, text):
        if self.in_title:
            self.title_parts.append(text)
        if self.in_ld:
            self.script_parts.append(text)


def product_nodes(node):
    """Only top-level/graph/main entities and explicit variants, not related items."""
    if isinstance(node, list):
        for item in node:
            yield from product_nodes(item)
    elif isinstance(node, dict):
        if schema_type(node, 'Product'):
            yield node
        if schema_type(node, 'ProductGroup'):
            yield from product_nodes(node.get('hasVariant'))
        for key in ('@graph', 'mainEntity'):
            yield from product_nodes(node.get(key))


def number(value):
    try:
        s = str(value).replace('\u202f', '').replace(' ', '')
        if ',' in s and '.' in s:
            s = s.replace('.', '').replace(',', '.') if s.rfind(',') > s.rfind('.') else s.replace(',', '')
        else:
            s = s.replace(',', '.')
        return round(float(s), 4)
    except (TypeError, ValueError):
        return None


def compact_product(node):
    result = {key: clean(node.get(key)) for key in ('name', 'brand', 'sku', 'size', 'model') if clean(node.get(key))}
    for key in ('gtin', 'gtin8', 'gtin12', 'gtin13', 'gtin14'):
        if node.get(key):
            result[key] = clean(node[key])
    for key in ('weight', 'additionalProperty'):
        values = node.get(key, [])
        if not isinstance(values, list):
            values = [values]
        details = []
        for value in values[:12]:
            if isinstance(value, dict):
                details.append(' '.join(clean(value.get(k)) for k in ('name', 'value', 'unitText', 'unitCode') if clean(value.get(k))))
            elif isinstance(value, (str, int, float)):
                details.append(clean(value))
        if details:
            result[key] = details
    offers = node.get('offers', [])
    if isinstance(offers, dict):
        offers = [offers]
    result['offers'] = []
    for offer in offers[:20] if isinstance(offers, list) else []:
        if not isinstance(offer, dict):
            continue
        out = {key: clean(offer.get(key), 300 if key == 'url' else 180) for key in ('name', 'sku', 'url', 'priceCurrency', 'availability') if clean(offer.get(key))}
        if schema_type(offer, 'AggregateOffer') or 'lowPrice' in offer:
            out['aggregate'] = True
            out['lowPrice'] = number(offer.get('lowPrice'))
            out['highPrice'] = number(offer.get('highPrice'))
        else:
            price = number(offer.get('price'))
            if price is None and isinstance(offer.get('priceSpecification'), dict):
                price = number(offer['priceSpecification'].get('price'))
                out.setdefault('priceCurrency', clean(offer['priceSpecification'].get('priceCurrency')))
            if price is not None:
                out['price'] = price
        result['offers'].append(out)
    return result


def parse_page(body):
    parser = PageParser()
    parser.feed(body)
    products, seen = [], set()
    for script in parser.scripts:
        try:
            data = json.loads(script.strip())
        except (ValueError, TypeError):
            continue
        for node in product_nodes(data):
            product = compact_product(node)
            key = json.dumps(product, sort_keys=True)
            if key not in seen:
                seen.add(key)
                products.append(product)
    return {'title': clean(''.join(parser.title_parts)), 'canonical_url': parser.canonical,
            'structured_products': products[:20], 'structured_product_count': len(products)}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class PoliteClient:
    def __init__(self, delay, timeout, deadline, cache_dir, offline=False):
        self.delay, self.timeout, self.deadline = delay, timeout, deadline
        self.cache_dir, self.offline = Path(cache_dir), offline
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.opener = urllib.request.build_opener(NoRedirect())
        self.lock = threading.Lock()
        self.host_locks, self.policy_locks, self.last, self.robots, self.host_delays = {}, {}, {}, {}, {}

    def host_lock(self, host, policy=False):
        with self.lock:
            table = self.policy_locks if policy else self.host_locks
            return table.setdefault(host, threading.Lock())

    def request(self, url):
        parts = urllib.parse.urlparse(url)
        if parts.scheme not in ('https', 'http') or not parts.hostname:
            return {'status': 0, 'error': 'unsupported_url', 'url': url, 'body': ''}
        # urllib requires ASCII request targets; preserve existing %-escapes.
        parts = parts._replace(path=urllib.parse.quote(parts.path, safe="/%:@!$&'()*+,;=-._~"),
                               query=urllib.parse.quote(parts.query, safe="=&?/:;+,%@!$'()*-._~"))
        url = urllib.parse.urlunparse(parts)
        host = parts.netloc.lower()
        with self.host_lock(host):
            wait = max(0, max(self.delay, self.host_delays.get(host, 0)) - (time.monotonic() - self.last.get(host, 0)))
            if time.monotonic() + wait >= self.deadline:
                return {'status': 0, 'error': 'audit_deadline', 'url': url, 'body': ''}
            time.sleep(wait)
            self.last[host] = time.monotonic()
            timeout = min(self.timeout, max(.1, self.deadline - time.monotonic()))
            request = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.8'})
            try:
                with self.opener.open(request, timeout=timeout) as response:
                    chunks, remaining = [], MAX_BYTES + 1
                    while remaining and time.monotonic() < self.deadline:
                        chunk = response.read1(min(65536, remaining))
                        if not chunk:
                            break
                        chunks.append(chunk)
                        remaining -= len(chunk)
                    raw = b''.join(chunks)
                    if time.monotonic() >= self.deadline:
                        return {'status': 0, 'url': url, 'body': '', 'error': 'audit_deadline'}
                    charset = response.headers.get_content_charset() or 'utf-8'
                    return {'status': response.status, 'url': url, 'body': raw[:MAX_BYTES].decode(charset, 'replace'),
                            'truncated': len(raw) > MAX_BYTES, 'content_type': response.headers.get('Content-Type', '')}
            except urllib.error.HTTPError as error:
                return {'status': error.code, 'url': url, 'body': '', 'location': error.headers.get('Location'), 'error': 'http_error'}
            except Exception as error:
                return {'status': 0, 'url': url, 'body': '', 'error': clean(str(error), 150)}

    def allowed(self, url):
        parts = urllib.parse.urlparse(url)
        origin = parts.scheme + '://' + parts.netloc
        with self.host_lock(origin, policy=True):
            if origin not in self.robots:
                robot_url = origin + '/robots.txt'
                response = None
                for _ in range(4):
                    response = self.request(robot_url)
                    if response['status'] in (301, 302, 303, 307, 308) and response.get('location'):
                        robot_url = urllib.parse.urljoin(robot_url, response['location'])
                    else:
                        break
                status = response['status']
                if status == 200:
                    rp = urllib.robotparser.RobotFileParser()
                    rp.parse(response['body'].splitlines())
                    self.robots[origin] = (rp, 'robots_checked', robot_url)
                elif status in (404, 410):
                    self.robots[origin] = (True, 'robots_missing', robot_url)
                elif status in (401, 403):
                    self.robots[origin] = (False, 'robots_access_denied', robot_url)
                else:
                    self.robots[origin] = (False, 'robots_unavailable', robot_url)
            policy, reason, robot_url = self.robots[origin]
            if isinstance(policy, bool):
                allowed = policy
            else:
                allowed = policy.can_fetch(UA, url)
                crawl_delay = policy.crawl_delay(UA) or policy.crawl_delay('*')
                if crawl_delay:
                    with self.lock:
                        self.host_delays[parts.netloc.lower()] = max(self.delay, crawl_delay)
            return allowed, ('robots_disallowed' if not allowed and reason == 'robots_checked' else reason), robot_url

    def fetch(self, url):
        cache = self.cache_dir / (hashlib.sha256(url.encode()).hexdigest() + '.json')
        if cache.exists() and (self.offline or time.time() - cache.stat().st_mtime < 86400):
            cached = json.loads(cache.read_text())
            cached['cached'] = True
            return cached
        if self.offline:
            return {'status': 0, 'url': url, 'body': '', 'error': 'no_cached_response'}
        current, chain = url, []
        response = {}
        for _ in range(6):
            allowed, reason, robots_url = self.allowed(current)
            if not allowed:
                response = {'status': 0, 'url': current, 'body': '', 'blocked': True,
                            'error': reason, 'robots_url': robots_url}
                break
            response = self.request(current)
            response['robots'] = reason
            if response['status'] in (301, 302, 303, 307, 308) and response.get('location'):
                target = urllib.parse.urljoin(current, response['location'])
                chain.append({'status': response['status'], 'url': target})
                current = target
            else:
                break
        response['redirects'] = chain
        cache.write_text(json.dumps(response, ensure_ascii=False))
        return response


def pack_values(text):
    out = {'g': set(), 'ml': set(), 'units': set()}
    # Preserve decimal separators while removing accents from quantity units.
    text = unicodedata.normalize('NFKD', clean(text, 3000)).encode('ascii', 'ignore').decode().lower()
    for value, unit in re.findall(r'(?<![a-z0-9])(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|gelules?|capsules?|comprime\w*|caps|tablets?|softgels?|gummies|sticks?|sachets?|gouttes?|drops?)\b', text):
        value = number(value)
        if unit in ('kg', 'g'):
            out['g'].add(value * (1000 if unit == 'kg' else 1))
        elif unit in ('ml', 'l'):
            out['ml'].add(value * (1000 if unit == 'l' else 1))
        else:
            out['units'].add(value)
    return out


def identity(product, node):
    catalogue_ean = str(product.get('ean') or '').strip()
    gtins = [str(node[k]).strip() for k in ('gtin', 'gtin8', 'gtin12', 'gtin13', 'gtin14') if node.get(k)]
    ean_match = bool(catalogue_ean and catalogue_ean in gtins)
    gtin_conflict = bool(catalogue_ean and gtins and not ean_match)
    catalogue_name = set(normalized(product['name']).split()) - {'de', 'et', 'a', 'the', 'bio', 'en'}
    source_name = set(normalized(node.get('name', '')).split())
    name_match = bool(catalogue_name and len(catalogue_name & source_name) / len(catalogue_name) >= .75)
    brand = normalized(product['brand']).replace(' ', '')
    observed_brand = normalized(node.get('brand', '')).replace(' ', '')
    brand_match = bool(brand and (brand == observed_brand or brand in normalized(node.get('name', '')).replace(' ', '')))
    if not observed_brand and not brand_match:
        brand_match = brand in normalized(urllib.parse.urlparse(product.get('url', '')).hostname or '').replace(' ', '')
    variant = product.get('variant', '')
    expected = pack_values(variant)
    if product.get('pack_g'):
        expected['g'] = {float(product['pack_g'])}
    if product.get('units_pack') and not expected['ml'] and not product.get('pack_g'):
        expected['units'] = {float(product['units_pack'])}
    observed_text = ' '.join([node.get('name', ''), node.get('size', '')] + node.get('weight', []) + node.get('additionalProperty', []))
    observed = pack_values(observed_text)
    pack_match = any(values and values.intersection(observed[k]) for k, values in expected.items())
    pack_conflict = any(values and observed[k] and not values.intersection(observed[k]) for k, values in expected.items())
    # Powder/flavour differences can materially change ingredients and price.
    flavours = [('unflavoured', 'neutre', 'nature', 'sans arome', 'neutral', 'natural'),
                ('chocolate', 'chocolat', 'cacao'), ('vanilla', 'vanille'), ('strawberry', 'fraise'),
                ('framboise', 'raspberry'), ('cerise', 'cherry'), ('orange',)]
    nv, ns = normalized(variant), normalized(observed_text)
    required_flavours = [group for group in flavours if any(re.search(r'\b' + re.escape(word) + r'\b', nv) for word in group)]
    flavour_match = all(any(re.search(r'\b' + re.escape(word) + r'\b', ns) for word in group) for group in required_flavours)
    # A generic name overlap must not conflate 1000 IU and 2000 IU variants.
    required_numbers = {token for token in catalogue_name if token.isdigit()}
    strength_match = required_numbers.issubset(source_name)
    exact = not pack_conflict and not gtin_conflict and (ean_match or (name_match and brand_match and pack_match and flavour_match and strength_match))
    return {'exact': exact, 'gtin_match': ean_match, 'gtin_conflict': gtin_conflict, 'name_match': name_match, 'brand_match': brand_match,
            'pack_match': pack_match, 'pack_conflict': pack_conflict, 'flavour_match': flavour_match, 'strength_match': strength_match,
            'expected_pack': {k: sorted(v) for k, v in expected.items() if v},
            'observed_pack': {k: sorted(v) for k, v in observed.items() if v}}


def audit_product(product, client, date):
    url = product.get('url')
    result = {'product_id': product['id'], 'checked_on': date, 'source_url': url,
              'product_identity': {key: product.get(key) for key in ('brand', 'name', 'variant', 'url', 'pack_g', 'units_pack', 'ean')},
              'status': 'missing_source', 'source_reachable': False, 'identity_verified': False,
              'price_verified': False, 'mismatch_candidates': []}
    if not url:
        return result
    response = client.fetch(url)
    result.update(http_status=response['status'], final_url=response.get('url', url))
    if response.get('redirects'):
        result['redirects'] = response['redirects']
    if response.get('blocked') or response['status'] in (401, 403, 429):
        result['status'] = 'blocked'
        result['reason'] = response.get('error') or 'access_restricted'
        if response.get('robots_url'):
            result['robots_url'] = response['robots_url']
        return result
    if response['status'] in (404, 410):
        result['status'] = 'broken_source'
        result['mismatch_candidates'].append({'field': 'url', 'reason': 'source_http_' + str(response['status'])})
        return result
    if response['status'] != 200:
        result['status'] = 'unavailable'
        result['reason'] = response.get('error') or 'http_' + str(response['status'])
        return result
    result['source_reachable'] = True
    result['status'] = 'reachable_unverified'
    evidence = parse_page(response['body'])
    result['evidence'] = evidence
    if response.get('truncated'):
        evidence['response_truncated'] = True
    generic = urllib.parse.urlparse(result['final_url']).path.rstrip('/') in ('', '/fr', '/en', '/products', '/collections', '/fr-fr')
    title = normalized(evidence['title'])
    if generic or any(phrase in title for phrase in ('page introuvable', 'page not found', '404 not found', 'page inexistante')):
        result['mismatch_candidates'].append({'field': 'url', 'reason': 'generic_or_soft_404_page'})
        return result
    comparisons = [identity(product, node) for node in evidence['structured_products']]
    candidates = [(node, match) for node, match in zip(evidence['structured_products'], comparisons) if match['exact']]
    # Multiple different Product records often mean a listing or a variant selector.
    if len(candidates) == 1:
        node, match = candidates[0]
        result['matched_structured_product_index'] = evidence['structured_products'].index(node)
        result['matched_product'] = {key: value for key, value in node.items() if key != 'offers'}
        result['identity_verified'] = True
        result['identity_basis'] = 'matching_gtin' if match['gtin_match'] else 'structured_name_brand_pack_flavour'
        result['status'] = 'identity_verified'
        offers = node.get('offers', [])
        prices = {(offer.get('price'), offer.get('priceCurrency')) for offer in offers
                  if offer.get('price') is not None and not offer.get('aggregate')}
        # A schema.org offer can be a members-only price. Keep identity evidence,
        # but require manual review of the public one-off purchase option.
        page_text = html.unescape(re.sub(r'<[^>]*>', ' ', response['body'])).lower()
        page_text = re.sub(r'\s+', ' ', unicodedata.normalize('NFKD', page_text).encode('ascii', 'ignore').decode())
        members_only = any(phrase in page_text for phrase in (
            'cette offre est exclusivement reservee aux membres prime',
            'this deal is exclusively for prime members'))
        if members_only:
            result['price_restriction'] = 'members_only_offer_requires_manual_review'
        if not members_only and len(offers) == 1 and len(prices) == 1 and next(iter(prices))[1] == 'EUR':
            price, currency = next(iter(prices))
            result['observed_price_eur'] = price
            result['observed_offer_url'] = offers[0].get('url') or result['final_url']
            result['availability'] = offers[0].get('availability', '').rsplit('/', 1)[-1] or None
            result['price_verified'] = True
            if abs(price - float(product['price_eur'])) > .011:
                result['mismatch_candidates'].append({'field': 'price_eur', 'catalogue': product['price_eur'], 'observed': price,
                                                     'reason': 'exact_identity_single_eur_offer', 'auto_update': False})
    if evidence['structured_products']:
        best = max(comparisons, key=lambda c: (c['exact'], c['name_match'], c['brand_match'], c['pack_match']))
        result['identity_checks'] = best
        if best['gtin_conflict'] and best['name_match']:
            result['mismatch_candidates'].append({'field': 'ean', 'catalogue': product.get('ean'),
                                                 'reason': 'structured_gtin_mismatch'})
        if best['pack_conflict'] and best['name_match']:
            result['mismatch_candidates'].append({'field': 'variant', 'catalogue': product.get('variant'),
                                                 'reason': 'structured_pack_mismatch', 'observed_pack': best['observed_pack']})
        if not any(c['name_match'] or c['gtin_match'] for c in comparisons):
            result['mismatch_candidates'].append({'field': 'name', 'catalogue': product['name'], 'reason': 'structured_name_needs_review'})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--catalogue', type=Path, default=ROOT / 'data.js')
    parser.add_argument('--output', type=Path, default=ROOT / 'data' / 'source-audit.json')
    parser.add_argument('--cache-dir', type=Path, default=Path('/tmp/n3gh-source-audit'))
    parser.add_argument('--date', default=DEFAULT_DATE)
    parser.add_argument('--workers', type=int, default=8)
    parser.add_argument('--delay', type=float, default=8)
    parser.add_argument('--timeout', type=float, default=12)
    parser.add_argument('--max-seconds', type=float, default=900)
    parser.add_argument('--offline', action='store_true')
    args = parser.parse_args()
    if not 1 <= args.workers <= 8 or args.delay < 2 or args.timeout <= 0 or args.max_seconds <= 0:
        parser.error('Use 1–8 workers, delay >=2s and positive bounded timeout/runtime.')
    datetime.date.fromisoformat(args.date)
    raw = args.catalogue.read_text().split('= ', 1)[1].rstrip().rstrip(';')
    products = json.loads(raw)['products']
    if len({p['id'] for p in products}) != len(products):
        raise ValueError('Catalogue product IDs must be unique')
    groups = collections.defaultdict(list)
    for product in products:
        groups[urllib.parse.urlparse(product.get('url', '')).netloc.lower()].append(product)
    started = time.monotonic()
    client = PoliteClient(args.delay, args.timeout, started + args.max_seconds, args.cache_dir, args.offline)
    results, print_lock = [], threading.Lock()
    def host_group(group):
        output = []
        for product in group:
            try:
                result = audit_product(product, client, args.date)
            except Exception as error:
                result = {'product_id': product['id'], 'checked_on': args.date, 'source_url': product.get('url'),
                          'status': 'unavailable', 'source_reachable': False, 'identity_verified': False, 'price_verified': False,
                          'reason': 'audit_error: ' + clean(str(error), 150), 'mismatch_candidates': []}
            output.append(result)
        with print_lock:
            print(json.dumps({'host': urllib.parse.urlparse(group[0].get('url', '')).netloc,
                              'products': len(output), 'statuses': dict(collections.Counter(r['status'] for r in output))}), flush=True)
        return output
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(host_group, group) for group in sorted(groups.values(), key=len, reverse=True)]
        for future in concurrent.futures.as_completed(futures):
            results.extend(future.result())
    ordered = {r['product_id']: r for r in results}
    records = [ordered[p['id']] for p in products]
    summary = {'products': len(products), 'audited': len(records), 'with_source': sum(bool(p.get('url')) for p in products),
               'hosts': len([h for h in groups if h]), 'statuses': dict(collections.Counter(r['status'] for r in records)),
               'source_reachable': sum(r['source_reachable'] for r in records),
               'identity_verified': sum(r['identity_verified'] for r in records), 'price_verified': sum(r['price_verified'] for r in records),
               'mismatch_candidates': sum(bool(r['mismatch_candidates']) for r in records)}
    report = {'schema_version': 1, 'checked_on': args.date, 'method': 'polite_static_html_and_product_jsonld',
              'scope': 'Source availability, explicit structured identity and offer evidence; not a full ingredient, dose, certification or clinical audit.',
              'policy': {'user_agent': UA, 'respect_robots': True, 'min_delay_seconds_per_host': args.delay,
                         'workers': args.workers, 'timeout_seconds': args.timeout, 'max_seconds': args.max_seconds,
                         'max_response_bytes': MAX_BYTES, 'auto_update_prices': False},
              'summary': summary, 'products': records}
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'summary': summary, 'elapsed_seconds': round(time.monotonic() - started, 1), 'output': str(args.output)}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
