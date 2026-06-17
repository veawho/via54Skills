// via54Skills Service Worker — minimal network-first PWA
// Strategy:
//   - HTML navigations: network-first, fallback to /index.html (the
//     redirect that sends browsers to /zh/)
//   - Static assets under /assets/, /og-image.png, /manifest.webmanifest,
//     etc.: stale-while-revalidate (instant load, refresh in background)
//   - Sitemap / RSS / robots: stale-while-revalidate (rarely changes)
//
// We intentionally keep the SW minimal:
//   - No precaching of the full site (VitePress outputs are large;
//     users may not visit all pages; precaching wastes bandwidth)
//   - No background sync (not useful for a docs site)
//   - No push notifications (docs site has nothing to push)
//
// Versioned cache name = SW_VERSION. Bump to invalidate.

const SW_VERSION = "via54skills-v1";
const ASSET_CACHE = `${SW_VERSION}-assets`;
const HTML_CACHE   = `${SW_VERSION}-html`;

const ASSET_PATTERN = /\/via54Skills\/(assets|og-image\.png|manifest\.webmanifest|favicon\.ico|pwa-\d+x\d+\.png)/;
const HTML_PATTERN  = /\/via54Skills\/(?:zh|en)?\/?/;

self.addEventListener("install", (event) => {
  // Activate immediately on first install (don't wait for old SW to die)
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(SW_VERSION))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle same-origin requests to /via54Skills/*
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/via54Skills/")) return;

  // HTML navigations: network-first with cache fallback
  if (req.mode === "navigate" || HTML_PATTERN.test(url.pathname)) {
    event.respondWith(networkFirst(req, HTML_CACHE));
    return;
  }

  // Static assets: stale-while-revalidate
  if (ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req, ASSET_CACHE));
    return;
  }

  // Other requests (sitemap.xml, feed.rss, robots.txt): let them pass
  // through. Caching RSS / sitemap would defeat the freshness that
  // search engines expect.
});