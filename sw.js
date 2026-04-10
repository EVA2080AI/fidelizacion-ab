const CACHE_NAME = 'ab-hub-v11';
const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/db.js',
    './js/auth.js',
    './js/router.js',
    './js/chat.js',
    './js/views/shared.js',
    './js/views/cliente.js',
    './js/views/especialista.js',
    './js/views/distribuidor.js',
    './js/views/admin.js',
    './js/views/superadmin.js',
    './js/app.js',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Network-first for API calls, cache-first for assets
    if (event.request.url.includes('googleapis.com')) {
        event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    } else {
        event.respondWith(
            caches.match(event.request).then(cached => cached || fetch(event.request))
        );
    }
});
