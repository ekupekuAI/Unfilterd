// Unfilterd service worker.
// Caches only this origin's static files. Data requests (Supabase or any other
// origin) are never intercepted, so the app always shows live data.
const CACHE_NAME = 'unfilterd-cache-v2';
const PRECACHE = ['/', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never touch other origins: Supabase auth/data/realtime, fonts, the vibe API.
  if (url.origin !== self.location.origin) return;

  // App navigation: network first, cached shell only when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/', copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Hashed build files: safe to cache first (a new build has new names).
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
        return response;
      }))
    );
    return;
  }

  // Small static files precached above: cached copy with network fallback.
  if (PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
  // Everything else (dev modules, etc.): browser default, no caching here.
});
