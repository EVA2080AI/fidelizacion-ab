const CACHE_NAME = 'ab-hub-v9';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './design-system.css',
    './components.css',
    './app.js',
    './icon-192.png',
    './icon-512.png',
    'https://unpkg.com/lucide@latest',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
