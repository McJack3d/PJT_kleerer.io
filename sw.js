/* SPDX-License-Identifier: AGPL-3.0-only
 * Copyright (C) 2026 n3gh.
 *
 * Service worker — makes the comparator installable and usable offline.
 *
 * WHY OFFLINE IS THE POINT, not a bonus. The place you most want to check a
 * supplement's score is standing in front of the shelf, and that is exactly
 * where a phone has no signal: pharmacy basements, supermarket aisles, Biocoop
 * back rooms. A comparator that needs the network is a comparator you consult
 * after you have already bought the wrong thing. The whole catalogue is ~390 KB,
 * so all of it fits in the cache and the app works with the radio off.
 *
 * PRIVACY. This worker talks to nothing but our own origin, stores no user data,
 * and sends nothing anywhere. Cross-origin requests (the analytics counter) are
 * not intercepted at all -- they fall through untouched, so this file can never
 * become a way to observe a visitor. /terms/ §8 promises the profile never
 * leaves the browser; a service worker is precisely the thing that could quietly
 * break that promise, so it does not get the chance.
 *
 * STRATEGY, and why each half is what it is:
 *   navigations  network-first. A stale HTML shell would pin an old app forever;
 *                falling back to cache only when the network actually fails
 *                keeps updates immediate and offline still working.
 *   assets       stale-while-revalidate. Instant paint from cache, refreshed in
 *                the background, so data.js is never more than one visit stale.
 */
const VERSION = "v1.10.1";

// Assets are requested with a cache-busting query -- `i18n.js?v=1.5`,
// `data.js?v=1.5` -- while the precache stores them under their bare path. A
// default caches.match() compares the full URL including the search string, so
// every one of those lookups missed and the app opened offline with an empty
// catalogue: the shell rendered, zero products. Matching with ignoreSearch is
// the fix, and it is safe here because nothing on this site varies by query
// string; the `?v=` exists only to bust the HTTP cache on deploy.
const MATCH = { ignoreSearch: true };

// ONE cache entry per path. Revalidation used to c.put() the fresh response
// under the request URL *with* its query (`data.js?v=1.5`) while the precache
// held the bare path; caches.match(…, ignoreSearch) then kept returning the
// older bare entry, so a fresh data.js was fetched on every visit and never
// served. Keying every put and match on the bare path means the revalidated
// copy replaces the stale one instead of sitting next to it.
const keyFor = (req) => {
  const u = new URL(req.url);
  return new Request(u.origin + u.pathname);
};
const CACHE = `n3gh-${VERSION}`;

// The app shell. Everything needed to open /compare/ and score a product with
// no network at all.
const PRECACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/assets/molecules/melatonin.png",
  "/assets/molecules/glycine.png",
  "/assets/molecules/growth-hormone.jpeg",
  "/script.js",
  "/analytics.js",
  "/pwa.js",
  "/favicon.ico",
  "/compare/",
  "/compare/index.html",
  "/compare/i18n.js",
  "/compare/data.js",
  // The prerendered per-language routes are where the language toggle actually
  // sends people, and this is a French-market product — installing the app in
  // French and finding /compare/fr/ dead in a shop would defeat the point.
  "/compare/fr/",
  "/compare/en/",
  "/compare/evidence/",
  "/compare/evidence/evidence.js",
  "/terms/",
  "/bot/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // addAll() is atomic: one 404 discards the whole precache and leaves the
    // app with no offline copy at all. Fetch individually so a single renamed
    // file degrades one entry instead of the install.
    await Promise.all(PRECACHE.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "reload" });
        if (res.ok) await c.put(url, res);
      } catch (_) { /* offline at install time — fetch handler will fill in */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("n3gh-") && k !== CACHE)
                          .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Never touch another origin. The analytics counter must stay entirely
  // outside this worker's reach.
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(CACHE);
        c.put(keyFor(req), fresh.clone());
        return fresh;
      } catch (_) {
        return (await caches.match(keyFor(req), MATCH))
            || (await caches.match("/compare/", MATCH))
            || (await caches.match("/", MATCH))
            || Response.error();
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const cached = await caches.match(keyFor(req), MATCH);
    const network = fetch(req).then((res) => {
      if (res && res.ok) caches.open(CACHE).then((c) => c.put(keyFor(req), res.clone()));
      return res;
    }).catch(() => null);
    return cached || (await network) || Response.error();
  })());
});
