#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Build crawlable bilingual category pages from the published catalogue."""
import json
import re
from pathlib import Path
from html import escape as esc

ROOT = Path(__file__).resolve().parents[2]
BASE = 'https://n3gh.com'
LANGS = ('en', 'fr')

def catalogue():
    source = (ROOT / 'compare/data.js').read_text()
    return json.loads(source.split('const N3GH_DATA = ', 1)[1].strip().rstrip(';'))

def labels():
    source = (ROOT / 'compare/i18n.js').read_text()
    return {lang: dict(re.findall(r'(\w+):"([^"]*)"', re.search(r'cats: \{(.*?)\}', source.split('\n'+lang+': {',1)[1], re.S)[1])) for lang in LANGS}

def route(lang, key):
    return f'/compare/{lang}/{key.replace("_", "-")}/'

def navigation(lang, keys, names):
    title = 'Comparer par famille' if lang == 'fr' else 'Compare by category'
    links = ' · '.join(f'<a href="{route(lang,k)}">{esc(names[lang][k])}</a>' for k in sorted(keys, key=lambda k:names[lang][k]))
    return f'<nav class="category-directory" aria-label="{title}" style="padding:24px;line-height:2"><h2>{title}</h2>{links}</nav>'

def build_all():
    data = catalogue(); names = labels()
    keys = sorted({p['category'] for p in data['products']})
    paths = []
    for lang in LANGS:
        fr = lang == 'fr'
        for key in keys:
            name = names[lang][key]; path = route(lang,key); url = BASE+path
            products = sorted((p for p in data['products'] if p['category']==key), key=lambda p:(p['brand'].casefold(),p['name'].casefold(),p['id']))
            title = f'{(name[:1].upper()+name[1:])} : comparer composition et prix | n3gh' if fr else f'{(name[:1].upper()+name[1:])}: compare ingredients and prices | n3gh'
            desc = (f'Comparez {len(products)} compléments de la famille {name} : formes, prix relevés et sources. Méthode indépendante, sans affiliation.' if fr else f'Compare {len(products)} {name} supplements: forms, recorded prices and sources. Independent methodology, no affiliate links.')
            rows=[]
            for p in products:
                v=p.get('verification',{}); date=v.get('price_checked_on') or ('Non renseignée' if fr else 'Not recorded')
                price=p.get('price_eur'); price=f'{price:.2f} €' if isinstance(price,(int,float)) else '—'
                product_name = esc(p['brand']) + ' — ' + esc(p['name'])
                link = f'<a href="{esc(p["url"],quote=True)}" rel="noopener">{product_name}</a>' if p.get('url','').startswith(('https://','http://')) else product_name
                rows.append(f'<tr><td>{link}<small>{esc(p.get("variant",""))}</small></td><td>{esc(p.get("form","—"))}</td><td>{price}</td><td>{esc(date)}</td></tr>')
            cols=['Produit et source','Forme déclarée','Prix relevé du conditionnement','Date de vérification du prix'] if fr else ['Product and source','Declared form','Recorded pack price','Price verification date']
            intro=(f'{len(products)} produits répertoriés dans la famille {name}. Ce tableau présente les variantes du catalogue, leurs formes déclarées et leurs prix relevés. Ouvrez le comparateur pour examiner les doses, les scores et le prix par actif.' if fr else f'{len(products)} products in the {name} category. This table lists catalogue variants, declared forms and recorded prices. Open the comparator to examine doses, scores and price per active ingredient.')
            caveat=('Les prix ne sont pas des offres en temps réel : promotions, disponibilité et frais de port peuvent modifier le coût final. Une date absente ne signifie pas une vérification récente. Consultez la source avant tout achat. Les variantes et formes restent dans la langue de leur source.' if fr else 'Prices are not live offers: promotions, availability and shipping can change the final cost. A missing date does not indicate a recent check. Check the source before buying. Variants and forms remain in their source language.')
            method=('Le score analyse les étiquettes et les documents disponibles ; il ne résulte pas de tests indépendants en laboratoire et ne prouve pas un bénéfice clinique. La quantité utilisée pour comparer les prix n’est pas une recommandation de prise. Des repères pour choisir, pas un avis médical.' if fr else 'The score analyses labels and available documents; it is not an independent laboratory test or proof of clinical benefit. Quantities used to compare prices are not intake recommendations. Information to inform your choices, not medical advice.')
            cta='Ouvrir le comparateur' if fr else 'Open the comparator'
            schema={'@context':'https://schema.org','@type':'CollectionPage','name':title,'description':desc,'url':url,'inLanguage':lang,'isPartOf':{'@type':'WebSite','name':'n3gh','url':BASE+'/'}}
            schema_json = json.dumps(schema,ensure_ascii=False).replace("<", "\\u003c")
            html=f'''<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(desc,quote=True)}"><meta name="robots" content="index,follow">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="fr" href="{BASE+route('fr',key)}"><link rel="alternate" hreflang="en" href="{BASE+route('en',key)}">
<meta property="og:type" content="website"><meta property="og:title" content="{esc(title,quote=True)}"><meta property="og:description" content="{esc(desc,quote=True)}"><meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary"><link rel="icon" href="/icons/favicon-32.png"><link rel="stylesheet" href="/compare/category.css">
<script type="application/ld+json">{schema_json}</script></head>
<body><header><a class="logo" href="/">n3gh.</a><nav aria-label="Language"><a href="{route('fr',key)}" lang="fr" hreflang="fr">FR</a> · <a href="{route('en',key)}" lang="en" hreflang="en">EN</a></nav></header>
<main><p class="eyebrow">{'LES COMPLÉMENTS, EN CLAIR.' if fr else 'SUPPLEMENTS, MADE CLEAR.'}</p><h1>{esc((name[:1].upper()+name[1:]))}</h1><p class="intro">{esc(intro)}</p>
<a class="cta" href="/compare/{lang}/#cat={key}">{cta} ↗</a>
<p class="note">{'Édition du catalogue' if fr else 'Catalogue edition'} : {esc(data['meta']['generated'])}. {esc(caveat)}</p>
<div class="table-wrap" role="region" aria-label="{'Produits' if fr else 'Products'}" tabindex="0"><table><caption>{esc((name[:1].upper()+name[1:]))} — {len(products)} {'produits' if fr else 'products'}</caption><thead><tr>{''.join('<th scope="col">'+c+'</th>' for c in cols)}</tr></thead><tbody>{''.join(rows)}</tbody></table></div>
<section><h2>{'Comment lire cette comparaison' if fr else 'How to read this comparison'}</h2><p>{method}</p><p><a href="/compare/METHODOLOGY.md">{'Méthodologie' if fr else 'Methodology'}</a> · <a href="/compare/evidence/">{'Études, limites et précautions' if fr else 'Evidence, limitations and precautions'}</a></p></section>
{navigation(lang,keys,names)}</main><footer>n3gh. — {'Sans sponsors ni liens affiliés.' if fr else 'No sponsors or affiliate links.'} <a href="/terms/">{'Conditions et licences' if fr else 'Terms and licences'}</a></footer></body></html>'''
            target=ROOT/path.lstrip('/')/'index.html'; target.parent.mkdir(parents=True,exist_ok=True); target.write_text(html)
            paths.append(path)
    existing=['/','/compare/','/compare/en/','/compare/fr/','/compare/evidence/','/terms/','/bot/']
    (ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{BASE+p}</loc></url>\n' for p in existing+paths)+'</urlset>\n')
    return keys,names

if __name__=='__main__':
    keys,_=build_all(); print(f'Built {len(keys)*2} category pages and sitemap')
