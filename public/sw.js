const CACHE_NAME = 'stackbuild-v2';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install (app shell)
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json'
];

// Cache-first strategy for static assets
const CACHE_FIRST_ROUTES = [
  '/static/',
  '/assets/',
  '/icons/',
  '/screenshots/',
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf'
];

// Network-first strategy for API calls (with caching for offline)
const NETWORK_FIRST_ROUTES = [
  '/api/',
  '/rest/v1/',
  '/storage/v1/object/public'
];

// Routes to never cache
const NO_CACHE_ROUTES = [
  '/auth/',
  '/rest/v1/auth/',
  '/realtime/',
  '/functions/v1/',
  'socket.io',
  'websocket'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for certain routes
  if (NO_CACHE_ROUTES.some(route => url.pathname.includes(route) || url.hostname.includes(route))) {
    return;
  }

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Handle navigation requests (SPA routing support)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Return cached version or offline page for SPA routes
          return caches.match('/')
            .then((cachedResponse) => {
              return cachedResponse || caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  if (CACHE_FIRST_ROUTES.some(route => 
    url.pathname.includes(route) || 
    url.pathname.endsWith(route) ||
    url.hostname !== location.hostname
  )) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // For images and assets, return a placeholder or skip
              return new Response('', { status: 204 });
            });
        })
    );
    return;
  }

  // Stale-while-revalidate for API GET requests
  if (NETWORK_FIRST_ROUTES.some(route => url.pathname.includes(route))) {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return fetch(request)
            .then((response) => {
              // Cache successful responses
              if (response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Return cached version if network fails
              return cache.match(request);
            });
        })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});