/* SPDX-License-Identifier: AGPL-3.0-only
 * Copyright (C) 2026 n3gh.
 *
 * Cookieless audience measurement — guidelines §7.2, decided together with §6.2.
 *
 * WHY NOT GA4. §7.2 asked for GA4 so a baseline exists from zero. The problem is
 * that GA4 in the EU needs a consent banner, and a banner destroys the very
 * thing the baseline is for: with typical EU decline rates you measure a
 * self-selected 40-70% of traffic and never know which. A cookieless counter
 * needs no banner and counts everyone, so the baseline is actually a baseline.
 * It also keeps §6.2 (can we store anonymised profile data?) from blocking the
 * analytics install — there is no personal data here to have a question about.
 *
 * WHAT THIS DOES NOT DO, by construction:
 *   - no cookies, no localStorage, no sessionStorage, no device identifier
 *   - no cross-site or cross-session profile, no fingerprinting
 *   - no personal data, no IP stored (the providers below hash-and-drop it)
 *   - nothing about the personalised profile form ever leaves the browser
 *
 * That list is also what /terms/ §8 promises visitors, so it is load-bearing:
 * changing this file can make that page untrue.
 *
 * ---------------------------------------------------------------------------
 * TO SWITCH IT ON: set PROVIDER and SITE_ID below. Until then this file makes
 * no network request at all — it is deliberately inert rather than pointing at
 * a placeholder endpoint and 404-ing on every page view.
 *
 *   plausible   SITE_ID = "n3gh.com"     EU-hosted (plausible.io) or self-hosted.
 *   umami       SITE_ID = "<uuid>"          EU cloud or self-hosted.
 *   goatcounter SITE_ID = "<code>"          "<code>.goatcounter.com", free for
 *                                           non-commercial use, EU (NL) hosted.
 * Self-hosting: set HOST to your own origin; nothing else changes.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  var PROVIDER = "";        // "plausible" | "umami" | "goatcounter" | "" (off)
  var SITE_ID  = "";        // see the table above
  var HOST     = "";        // optional self-hosted origin, e.g. "https://stats.n3gh.com"

  // ---------------------------------------------------------------- guards --
  if (!PROVIDER || !SITE_ID) return;                       // not configured yet

  // Honour the two signals a visitor can actually send. Neither is legally
  // required for cookieless aggregate counting, but ignoring an explicit "do
  // not track me" while claiming to be the privacy-respecting option would be
  // the kind of small dishonesty this project exists to call out in others.
  try {
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1" ||
        navigator.msDoNotTrack === "1" || navigator.globalPrivacyControl === true) return;
  } catch (e) { /* fall through — a broken navigator is not consent to track */ }

  // Never count our own work: localhost, file://, and the GitHub Pages preview
  // domain would otherwise inflate the first weeks, which is exactly the period
  // the baseline is supposed to describe.
  var h = location.hostname;
  if (!h || h === "localhost" || h === "127.0.0.1" || h === "[::1]" ||
      location.protocol === "file:" || /\.github\.io$/.test(h)) return;

  // ----------------------------------------------------------------- load --
  var s = document.createElement("script");
  s.defer = true;

  if (PROVIDER === "plausible") {
    s.src = (HOST || "https://plausible.io") + "/js/script.js";
    s.setAttribute("data-domain", SITE_ID);
  } else if (PROVIDER === "umami") {
    s.src = (HOST || "https://cloud.umami.is") + "/script.js";
    s.setAttribute("data-website-id", SITE_ID);
  } else if (PROVIDER === "goatcounter") {
    s.src = "//gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter",
      (HOST || "https://" + SITE_ID + ".goatcounter.com") + "/count");
  } else {
    return;
  }

  s.onerror = function () { /* a blocked counter is not an error worth showing */ };
  document.head.appendChild(s);
})();
