var CACHE_NAME = 'shopify-pwa-sample-caches';
var urlsToCache = [
    '/pwa.html'
];

self.addEventListener('install', function(event) {
    event.waitUntil(caches
        .open(CACHE_NAME)
        .then(function(cache) {
            console.log('install');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(caches
        .match(event.request)
        .then(function(response) {
            console.log('fetch');
            return response ? response : fetch(event.request);
        })
    );
});