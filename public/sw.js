// Offline support: pages are network-first (fresh when online, cached when not);
// static assets and map tiles are cache-first so the app still opens on patchy rural signal.
const CACHE = "ireland-pk-equal-scoreboard-v1";
const SHELL = ["/", "/manifest.webmanifest?v=family-1", "/family-favicon-32.png", "/family-icon-192.png", "/family-icon-512.png", "/family-apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Live data (weather, rates, shared checklist) — never serve stale from here.
  if (/open-meteo|frankfurter|supabase/.test(url.hostname)) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  const cacheable =
    url.origin === self.location.origin ||
    url.hostname.endsWith("openfreemap.org") ||
    url.hostname === "server.arcgisonline.com" || // satellite
    url.pathname.startsWith("/elevation-tiles-prod/"); // terrain
  if (!cacheable) return;
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});


