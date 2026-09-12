const CACHE_NAME = 'calendar-ics-tool-v41';
const LOCAL_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './textures/watercolor.svg',
  './textures/pencil.svg',
  './i18n.js',
  './app.js',
  './artwork.js',
  './recurrence.js',
  './manifest.webmanifest',
  './icons/app-icon.svg',
  './icons/app-icon.svg?v=2',
  './icons/app-icon-180.png?v=3',
  './icons/app-icon-192.png?v=3',
  './icons/app-icon-512.png?v=3',
  './icons/app-icon-maskable-512.png?v=3',
  './vendor/tesseract.min.js',
  './vendor/lunar.js',
  './vendor/rrule.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(LOCAL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok || response.type === 'opaque') {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        throw new Error('Resource is unavailable offline.');
      }))
  );
});