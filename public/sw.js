const CACHE = "sysone-public-v2";
const CORE = ["/", "/marketplace", "/games", "/brand/sysone-symbol.webp"];
const NEVER_CACHE_PREFIXES = ["/api", "/account", "/control-center", "/login"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return;

  const isStaticAsset = ["style", "script", "image", "font"].includes(request.destination);
  const isNavigation = request.mode === "navigate";

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      }))
    );
    return;
  }

  if (isNavigation) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok && url.pathname === "/") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("/", copy)).catch(() => {});
        }
        return response;
      }).catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
  }
});
