/* ScoutingManager - service worker basico (cache offline de shell estatico) */
const CACHE_NAME = 'scouting-v6';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/base.css', './css/theme-real-madrid.css', './css/theme-bottle-green.css',
  './js/firebase-init.js', './js/utils.js', './js/db.js', './js/auth.js', './js/players.js', './js/seed.js', './js/calendar.js', './js/teams.js', './js/scouting.js', './js/rankings.js', './js/reports.js', './js/admin.js', './js/settings.js', './js/app.js',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/icon-180.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
