// Basic service worker for Pulse PWA
const CACHE_NAME = "pulse-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Network-first strategy for HTML, cache-first for static assets
  if (req.destination === "document") {
    event.respondWith(
      fetch(req).catch(() => caches.match(req) as Promise<Response>)
    );
  } else if (req.destination === "script" || req.destination === "style" || req.destination === "font" || req.destination === "image") {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        });
        return cached || fetchPromise;
      })
    );
  }
});
