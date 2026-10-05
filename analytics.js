/* SPDX-License-Identifier: AGPL-3.0-only
 * Copyright (C) 2026 n3gh.
 * Umami pageview integration. Disabled until a real website ID is supplied.
 * Before activation, update /terms/ with the selected provider and processing.
 * No profile, routine, search, URL parameters, custom events or session replay.
 */
(function () {
  "use strict";
  var WEBSITE_ID = ""; // Public Umami website UUID, not an API key.
  var SCRIPT_URL = "https://cloud.umami.is/script.js";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(WEBSITE_ID)) return;
  if (location.protocol !== "https:" || location.hostname !== "n3gh.com") return;
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1" ||
      navigator.msDoNotTrack === "1" || navigator.globalPrivacyControl === true) return;

  // Only published pages, never arbitrary paths or user-entered URL content.
  var pages = {
    "/": "Home", "/compare/": "Compare", "/compare/en/": "Compare EN",
    "/compare/fr/": "Compare FR", "/compare/evidence/": "Evidence",
    "/terms/": "Terms", "/bot/": "Bot"
  };
  var path = location.pathname.replace(/\/index\.html$/, "/");
  if (!Object.prototype.hasOwnProperty.call(pages, path)) return;
  var script = document.createElement("script");
  script.src = SCRIPT_URL;
  script.defer = true;
  script.referrerPolicy = "no-referrer";
  script.setAttribute("data-website-id", WEBSITE_ID);
  script.setAttribute("data-domains", "n3gh.com");
  script.setAttribute("data-auto-track", "false");
  script.setAttribute("data-exclude-search", "true");
  script.setAttribute("data-exclude-hash", "true");
  script.setAttribute("data-do-not-track", "true");
  script.onload = function () {
    if (!window.umami || typeof window.umami.track !== "function") return;
    // Explicit payload avoids collecting the document title/referrer or form data.
    window.umami.track({website: WEBSITE_ID, hostname: "n3gh.com", url: path, title: pages[path]});
  };
  script.onerror = function () { /* Analytics must never block the website. */ };
  document.head.appendChild(script);
})();
