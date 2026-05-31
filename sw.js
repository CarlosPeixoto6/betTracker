const CACHE_NAME = 'bettracker-v3';
const SHELL_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
];

// Domains that must NEVER be cached
const BYPASS_CACHE = [
  'supabase.co',
  'sentry-cdn.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'clearbit.com',
  'google.com',
  '22bet21.com',
  'betclic.pt',
  'betano.com',
  'solverde.pt',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always bypass cache for API calls and external resources
  const shouldBypass = BYPASS_CACHE.some(domain => url.hostname.includes(domain));
  if (shouldBypass || e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  // App shell: cache-first, fall back to network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
