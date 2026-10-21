// Teiln PWA Service Worker
// Enables offline access to cached expense lists, groups, settlements, and push notifications

const CACHE_VERSION = 'teiln-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// Install: precache essential shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('Pre-cache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up outdated caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('teiln-') && name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Smart network & cache routing
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests with http/https schemes
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // 1. Navigation requests (HTML documents)
  // Network first with offline fallback to cached index.html
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback
          const cachedIndex = await caches.match('/index.html') || await caches.match('/');
          if (cachedIndex) {
            return cachedIndex;
          }
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><title>Teiln - Offline</title><style>body{background:#080b11;color:#f8fafc;font-family:sans-serif;padding:2rem;text-align:center;}</style></head>
            <body><h2>Offline Access</h2><p>Please check your connection.</p></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 2. Static Vite JS/CSS bundles, Fonts, and Assets
  // Stale-While-Revalidate: return cache quickly if available, update cache from network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            // Cache in runtime or static
            const targetCache = url.origin === self.location.origin ? STATIC_CACHE : RUNTIME_CACHE;
            caches.open(targetCache).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and not in cache, fallback
          if (request.destination === 'image') {
            return caches.match('/favicon.svg');
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  let data = {
    title: 'Teiln Notification',
    body: 'You have a new update in your group.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    vibrate: [120, 60, 120],
    data: data.data || { url: '/' },
    tag: data.tag || 'teiln-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (client.url.includes(targetUrl)) {
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Communication with frontend
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
