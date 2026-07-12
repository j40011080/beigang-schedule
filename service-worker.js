/* Minimal service worker: only caches the static app shell (this page + icons).
   It never touches Firebase/Firestore requests (those are cross-origin and go
   straight to the network), so cloud sync always stays live. This just makes
   the page installable as an app and lets it open a little faster / partially
   offline; it does NOT provide offline editing with sync. */
const CACHE_NAME = 'bg-schedule-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // only handle same-origin GET requests for the app shell; let everything
  // else (Firestore, auth, gstatic SDK, etc.) pass straight through to network
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
