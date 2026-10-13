// Offline support. Bump VERSION when any file below changes, so phones fetch the new build.
// cache: 'reload' bypasses the HTTP cache, so a new VERSION never stores stale copies.
const VERSION = 'klokkemester-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/arcade.js',
  './js/arcade-data.js',
  './js/badges.js',
  './js/levels.js',
  './js/themes.js',
  './js/ui.js',
  './js/clock.js',
  './js/content.js',
  './js/fx.js',
  './js/game.js',
  './js/store.js',
  './js/time-no.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('klokkemester-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache first (the app is fully static); fall back to the app shell for navigations.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    }),
  );
});
