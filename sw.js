// Last updated: 2018-05-16 15:49
// Update the comment above to ensure new cache versions get picked up

const cacheName = 'news-v1';
const staticAssets = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './news-article.js',
  './node_modules/lit-html/lit-html.js',
  './fallback.json',
  './images/fetch-dog.jpg'
];

self.addEventListener('install', async e => {
  const cache = await caches.open(cacheName);
  await cache.addAll(staticAssets);
  return self.skipWaiting();
});

self.addEventListener('activate', e => {
  self.clients.claim();
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
  return cached || fetch(req);
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
