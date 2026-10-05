# NOTICE — rights, licences, and reservations

`n3gh.io` is not under a single licence. Different layers carry different
rights, because a software licence and a dataset are not the same kind of thing.
Read the layer you intend to use.

## Licence by layer

| Layer | Paths | Licence |
| :---- | :---- | :------ |
| Site / app code | `index.html`, `style.css`, `script.js`, `compare/index.html`, `compare/i18n.js`, `compare/fr/`, `compare/en/`, `bot/` | **AGPL-3.0-only** — [`LICENSE`](LICENSE) |
| Scoring engine + auto-tagger | `compare/scripts/`, `compare/pipeline/` | **AGPL-3.0-only**, also available under a separate commercial licence — [`LICENSE`](LICENSE) |
| Methodology | `compare/METHODOLOGY.md` | **CC BY-NC-ND 4.0** — [`compare/LICENSE-METHODOLOGY.md`](compare/LICENSE-METHODOLOGY.md) |
| Published catalogue | `compare/data.js`, `compare/data/` | **CC BY-NC-SA 4.0** + database right reserved — [`compare/LICENSE-DATA.md`](compare/LICENSE-DATA.md) |
| Historical archive | not in this repository | **All rights reserved.** Not published, not licensed. |

The AGPL's network clause applies: running a modified version of this code as a
network service obliges you to offer that version's complete source to its
users. If that is incompatible with your product, the commercial licence exists
precisely for that case — see §"Commercial licensing" below.

## Database right

The published catalogue and the unpublished historical archive are databases
within the meaning of Directive 96/9/EC and Articles L.341-1 ff. of the French
*Code de la propriété intellectuelle*. Their maker asserts the *sui generis*
database right arising from substantial investment in **obtaining and verifying**
their contents.

**The limit of that claim, stated plainly.** The database right protects the
database, not the facts inside it. A single price is a fact and is not
protected — anyone is free to observe, quote, or republish any individual price
or label. What is reserved is **extraction or re-utilisation of a substantial
part** of the database, whether measured by quantity or by quality, and
repeated systematic extraction of insubstantial parts that together amount to a
substantial part.

## Text and data mining — reservation

Rights to text and data mining are **expressly reserved** under Article 4(3) of
Directive (EU) 2019/790 and Article L.122-5-3 of the *Code de la propriété
intellectuelle*, in respect of:

- the historical price-and-composition archive;
- `compare/METHODOLOGY.md`;
- the published catalogue (`compare/data.js`, `compare/data/`) as a database.

This reservation is expressed in machine-readable form in
[`.well-known/tdmrep.json`](.well-known/tdmrep.json) and in
[`robots.txt`](robots.txt), per the W3C TDM Reservation Protocol.

**Deliberately not reserved:** the public pages themselves remain open to
crawling and indexing, including by search engines and AI assistants. Being
read and cited is wanted. The reservation is against bulk mining of the archive,
the methodology, and the catalogue-as-a-database — not against being found.

Mining exceptions that a reservation cannot override — notably research carried
out by research organisations and cultural heritage institutions under Article
3 of Directive (EU) 2019/790 — are unaffected.

## Commercial licensing

The scoring engine is available under a commercial licence for parties who
cannot accept the AGPL's obligations. What is sold is an exemption from those
obligations. **The archive is not part of any licence** and is not for sale
under one.

## Trademark

Licences granted here cover copyright and database rights only. They grant no
right to use the name, look, or marks of n3gh.

## Contact

`hello@n3gh.com`
