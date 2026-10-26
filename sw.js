/* Offline app shell for ことばでタッチ！. No personal information is stored. */
const CACHE_NAME = 'kotoba-tap-shell-v1';
const PREFIX = 'kotoba-tap-shell-';
const CORE_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith(PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Check the network first when online. An offline visit returns the saved app.
    event.respondWith(
      fetch(request).catch(async () => {
        return (await caches.match('./index.html')) || Response.error();
      })
    );
    return;
  }

  event.respondWith((async () => {
    const saved = await caches.match(request);
    if (saved) return saved;
    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
