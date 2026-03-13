const CACHE = 'agriweather-v3';
const STATIC = ['./', './index.html', './tips.html', './manifest.json'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    // API calls: network only
    if (url.hostname === 'api.openweathermap.org' || url.hostname === 'microdata.worldbank.org') {
        e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({error:'offline'}), {status:503})));
        return;
    }
    // Static: cache first
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
            if (res.ok && e.request.method === 'GET') {
                const clone = res.clone();
                caches.open(CACHE).then(c => c.put(e.request, clone));
            }
            return res;
        }))
    );
});
