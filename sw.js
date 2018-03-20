const cacheName = 'news-v1';
const staticAssets = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './fallback.json',
  './images/fetch-dog.jpg'
];

self.addEventListener('install', async e => {
  const cache = await caches.open(cacheName);
  cache.addAll(staticAssets);
});
self.addEventListener('fetch', async e => {
  const req = e.request;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    e.respondWith(cacheFirst(req));
  } else {
    e.respondWith(networkAndCache(req));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  return cached || networkAndCache(req);
}

async function networkAndCache(req) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    await cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || (await cache.match('./fallback.json'));
  }
}
