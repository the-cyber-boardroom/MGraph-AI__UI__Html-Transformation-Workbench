/**
 * service-worker.js — Offline Caching Strategy
 * 
 * This service worker caches the app shell (HTML, CSS, JS) so the classifier
 * can work offline. 
 * 
 * IMPORTANT: The Gemini Nano MODEL is NOT cached by this service worker.
 * The model is managed entirely by Chrome's built-in AI infrastructure.
 * 
 * For offline classification to work, BOTH conditions must be met:
 * 1. The app assets are cached by this service worker ✓
 * 2. Chrome has downloaded the Gemini Nano model to the device (managed by Chrome)
 */

const CACHE_NAME = 'nano-classifier-v1';

// Assets to cache for offline use
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/src/main.js',
  '/src/ai.js',
  '/src/ui.js',
  '/manifest.json'
];

// External resources (fonts) - cache on first use
const EXTERNAL_CACHE_NAME = 'nano-classifier-external-v1';

/**
 * Install event - cache app shell
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] App shell cached');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Cache failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old versions of our caches
              return name.startsWith('nano-classifier-') && 
                     name !== CACHE_NAME && 
                     name !== EXTERNAL_CACHE_NAME;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activated');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - serve from cache, fall back to network
 * 
 * Strategy: Cache-first for app assets, network-first for external resources
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle same-origin requests (app assets)
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Handle external requests (fonts, etc.)
  if (url.hostname.includes('fonts.googleapis.com') || 
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(staleWhileRevalidate(event.request, EXTERNAL_CACHE_NAME));
    return;
  }
});

/**
 * Cache-first strategy
 * Returns cached response if available, otherwise fetches from network
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] Fetching from network:', request.url);
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Network fetch failed:', error);
    
    // Return a fallback for navigation requests
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }
    
    throw error;
  }
}

/**
 * Stale-while-revalidate strategy
 * Returns cached response immediately, then updates cache from network
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.warn('[SW] Background fetch failed:', error);
      return null;
    });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    console.log('[SW] Serving stale:', request.url);
    return cachedResponse;
  }
  
  // Otherwise wait for network
  console.log('[SW] Waiting for network:', request.url);
  return networkPromise;
}

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});
