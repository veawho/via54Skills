// Inline service-worker registration, designed to be injected into every
// page via VitePress's `head` config option.
//
// Strategy: register /via54Skills/sw.js (VitePress copies docs/public/sw.js
// to the dist root, served at /via54Skills/sw.js). The SW itself lives in
// docs/public/sw.js and is versioned by its filename content; updating the
// SW body triggers a versioned cache invalidation via SW_VERSION inside.

(function () {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Resolve the SW URL relative to the site root, not the current page.
  // Using <base href> would also work, but here we compute it from
  // document.baseURI to avoid coupling to the base config.
  var base = document.baseURI.replace(/\/+$/, "");
  var swUrl = base + "/sw.js";

  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register(swUrl, { scope: base + "/" })
      .then(function (reg) {
        // Registration succeeded; no further action needed.
        // SW handles its own update cycle on page load.
      })
      .catch(function (err) {
        // Silent fail: PWA is enhancement, not requirement.
        // Don't pollute the console in production.
        if (typeof console !== "undefined" && console.debug) {
          console.debug("SW register failed:", err);
        }
      });
  });
})();