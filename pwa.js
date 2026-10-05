/* SPDX-License-Identifier: AGPL-3.0-only
 * Copyright (C) 2026 n3gh.
 *
 * Registers the service worker, and offers an install button only when the
 * browser says the app is actually installable.
 *
 * No install nag. beforeinstallprompt is only honoured after the visitor asks —
 * the button appears in the footer, does nothing until clicked, and disappears
 * once dismissed for the session. A modal begging to be installed on first
 * visit is the kind of thing this project exists to be the opposite of.
 *
 * Nothing here observes the visitor: no event is counted, nothing is stored
 * beyond a single sessionStorage flag so a dismissed button stays dismissed.
 */
(function () {
  "use strict";

  if ("serviceWorker" in navigator) {
    // Registration after load: never compete with first paint for bandwidth.
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(function () {
        /* file:// , private mode, or an unsupported browser — the site works
           exactly as before without it, so a failure is not worth reporting */
      });
    });
  }

  var DISMISSED = "n3gh_install_dismissed";
  var deferred = null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();                       // suppress the browser's own bar
    deferred = e;
    try { if (sessionStorage.getItem(DISMISSED)) return; } catch (_) {}
    show();
  });

  function show() {
    var host = document.querySelector("footer .fwrap .row") ||
               document.querySelector("footer .fwrap") ||
               document.querySelector("footer");
    if (!host || document.getElementById("installbtn")) return;

    var b = document.createElement("button");
    b.id = "installbtn";
    b.type = "button";
    b.textContent = (document.documentElement.lang === "fr")
      ? "installer l'app ↓" : "install the app ↓";
    b.setAttribute("style",
      "background:none;border:1px solid currentColor;border-radius:2px;" +
      "font:inherit;font-size:.7rem;padding:3px 9px;cursor:pointer;color:inherit;" +
      "letter-spacing:.03em");

    b.addEventListener("click", function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.finally(function () {
        deferred = null;
        try { sessionStorage.setItem(DISMISSED, "1"); } catch (_) {}
        b.remove();
      });
    });
    host.appendChild(b);
  }

  window.addEventListener("appinstalled", function () {
    deferred = null;
    var b = document.getElementById("installbtn");
    if (b) b.remove();
  });
})();
