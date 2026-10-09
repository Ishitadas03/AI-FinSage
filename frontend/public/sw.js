// FinSage Service Worker
const CACHE_NAME = 'finsage-cache-v6';
const OFFLINE_FALLBACK = '/index.html';

// Critical shell assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.svg',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/images/finsage-emblem.png?v=5.0.0',
  '/images/finsage-logo-horizontal.png?v=5.0.0'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('FinSage SW Precache notice:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event handler required for Chromium PWA installability criteria
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Never intercept API requests, authentication, or external third-party requests
  if (url.pathname.startsWith('/api') || url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests (HTML pages) -> Network first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(OFFLINE_FALLBACK).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Brand images -> Network-first / Stale-While-Revalidate to ensure updates are immediate
  if (url.pathname.startsWith('/images/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Static hashed assets (CSS, JS, Fonts) -> Cache first, fallback to network
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname.endsWith('.json')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default network fetch
  event.respondWith(fetch(request));
});
