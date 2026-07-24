// Based off of https://github.com/pwa-builder/PWABuilder/blob/main/docs/sw.js
// Enhanced with offline capability and precaching

/*
  Welcome to our enhanced Service Worker! This Service Worker offers a robust offline experience
  with precaching, runtime caching, and offline fallbacks.

  Features added:
  - Precaching of essential app shell resources
  - Offline fallback pages for navigation requests
  - Cache versioning and cleanup
  - Better error handling for offline scenarios
  - Static asset caching with long-term storage

  Need an introduction to Service Workers? Check our docs here: https://docs.pwabuilder.com/#/home/sw-intro
  Want to learn more about how our Service Worker generation works? Check our docs here: https://docs.pwabuilder.com/#/studio/existing-app?id=add-a-service-worker

  Did you know that Service Workers offer many more capabilities than just offline? 
    - Background Sync: https://microsoft.github.io/win-student-devs/#/30DaysOfPWA/advanced-capabilities/06
    - Periodic Background Sync: https://web.dev/periodic-background-sync/
    - Push Notifications: https://microsoft.github.io/win-student-devs/#/30DaysOfPWA/advanced-capabilities/07?id=push-notifications-on-the-web
    - Badges: https://microsoft.github.io/win-student-devs/#/30DaysOfPWA/advanced-capabilities/07?id=application-badges
*/

// Cache names
const CACHE_NAME = 'pwa-cache-v1';
const OFFLINE_CACHE = 'offline-cache-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Files to precache (essential app shell)
const PRECACHE_URLS = [
    '/',
    '/the_numbers.html',
    '/styles_the_numbers.css',
    '/scripts_the_numbers.js',
    '/images/192x192.png',
    '/images/512x512.png',
    '/images/0.png',
    '/images/1.png',
    '/images/2.png',
    '/images/3.png',
    '/images/4.png',
    '/images/5.png',
    '/images/6.png',
    '/images/7.png',
    '/images/8.png',
    '/images/9.png',
    '/images/10.png',
    '/images/11.png',
    '/images/12.png',
    '/images/13.png',
    '/images/star.png',
    '/images/block.png',
    '/images/fondo.png',
    '/images/right.jpg',
    '/images/left.jpg',
    '/offline.html',
    '/BoySticker/1.png',
    '/BoySticker/2.png',
    '/BoySticker/3.png',
    '/BoySticker/4.png',
    '/BoySticker/5.png',
    '/BoySticker/6.png',
    '/BoySticker/7.png',
    '/BoySticker/8.png',
    '/BoySticker/9.png',
    '/BoySticker/10.png',
    '/BoySticker/11.png',
    '/BoySticker/12.png',
    '/GirlSticker/1.png',
    '/GirlSticker/2.png',
    '/GirlSticker/3.png',
    '/GirlSticker/4.png',
    '/GirlSticker/5.png',
    '/GirlSticker/6.png',
    '/GirlSticker/7.png',
    '/GirlSticker/8.png',
    '/GirlSticker/9.png',
    '/GirlSticker/10.png',
    '/GirlSticker/11.png',
    '/GirlSticker/12.png'
];

// Offline fallback pages
const OFFLINE_FALLBACK_PAGE = '/offline.html';
const OFFLINE_FALLBACK_IMAGE = '/images/offline-image.svg';

const HOSTNAME_WHITELIST = [
    self.location.hostname,
    'fonts.gstatic.com',
    'fonts.googleapis.com',
    'cdn.jsdelivr.net'
];

// The Util Function to hack URLs of intercepted requests
const getFixedUrl = (req) => {
    var now = Date.now()
    var url = new URL(req.url)

    // 1. fixed http URL
    // Just keep syncing with location.protocol
    // fetch(httpURL) belongs to active mixed content.
    // And fetch(httpRequest) is not supported yet.
    url.protocol = self.location.protocol

    // 2. add query for caching-busting.
    // Github Pages served with Cache-Control: max-age=600
    // max-age on mutable content is error-prone, with SW life of bugs can even extend.
    // Until cache mode of Fetch API landed, we have to workaround cache-busting with query string.
    // Cache-Control-Bug: https://bugs.chromium.org/p/chromium/issues/detail?id=453190
    if (url.hostname === self.location.hostname) {
        url.search += (url.search ? '&' : '?') + 'cache-bust=' + now
    }
    return url.href
}

/**
 * @Lifecycle Install
 * Precache essential resources for offline functionality
 */
self.addEventListener('install', event => {
    console.log('[SW] Install event');
    
    event.waitUntil(
        Promise.all([
            // Precache essential app shell files
            caches.open(CACHE_NAME).then(cache => {
                console.log('[SW] Precaching app shell');
                return cache.addAll(PRECACHE_URLS);
            }),
            // Cache offline fallback page
            caches.open(OFFLINE_CACHE).then(cache => {
                console.log('[SW] Caching offline page');
                return cache.add(OFFLINE_FALLBACK_PAGE);
            })
        ]).then(() => {
            console.log('[SW] All resources cached');
            // Force the waiting service worker to become the active service worker
            return self.skipWaiting();
        })
    );
});

/**
 * @Lifecycle Activate
 * Clean up old caches and claim clients
 */
self.addEventListener('activate', event => {
    console.log('[SW] Activate event');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== OFFLINE_CACHE && 
                            cacheName !== RUNTIME_CACHE) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients
            self.clients.claim()
        ]).then(() => {
            console.log('[SW] Service worker activated and claimed clients');
        })
    );
});

/**
 * @Functional Fetch
 * Handle all network requests with caching strategies
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests not in whitelist
    if (HOSTNAME_WHITELIST.indexOf(url.hostname) === -1) {
        return;
    }

    // Handle navigation requests (HTML pages)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // If successful, cache the response and return it
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // If network fails, try cache first, then offline page
                    return caches.match(request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Return offline page as fallback
                            return caches.match(OFFLINE_FALLBACK_PAGE);
                        });
                })
        );
        return;
    }

    // Handle image requests
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    return fetch(request)
                        .then(response => {
                            // Cache successful responses
                            if (response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(RUNTIME_CACHE).then(cache => {
                                    cache.put(request, responseClone);
                                });
                            }
                            return response;
                        })
                        .catch(() => {
                            // Return offline image fallback
                            return caches.match(OFFLINE_FALLBACK_IMAGE);
                        });
                })
        );
        return;
    }

    // Handle other requests with stale-while-revalidate strategy
    // This is your original logic enhanced with better offline handling
    const cached = caches.match(request);
    const fixedUrl = getFixedUrl(request);
    const fetched = fetch(fixedUrl, { cache: 'no-store' });
    const fetchedCopy = fetched.then(resp => resp.clone());

    // Call respondWith() with whatever we get first.
    // If the fetch fails (e.g disconnected), wait for the cache.
    // If there's nothing in cache, wait for the fetch.
    // If neither yields a response, handle gracefully
    event.respondWith(
        Promise.race([fetched.catch(_ => cached), cached])
            .then(resp => {
                if (resp) {
                    return resp;
                }
                // If no cached version and fetch failed, return a basic response for certain types
                return fetched.catch(() => {
                    // For CSS/JS files, return a basic empty response to prevent errors
                    if (request.destination === 'style') {
                        return new Response('/* Offline - CSS not available */', {
                            headers: { 'Content-Type': 'text/css' }
                        });
                    }
                    if (request.destination === 'script') {
                        return new Response('// Offline - Script not available', {
                            headers: { 'Content-Type': 'application/javascript' }
                        });
                    }
                    // For other requests, return a basic offline response
                    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
                });
            })
            .catch(error => {
                console.error('[SW] Fetch error:', error);
                return new Response('Network Error', { status: 503, statusText: 'Service Unavailable' });
            })
    );

    // Update the cache with the version we fetched (only for ok status)
    event.waitUntil(
        Promise.all([fetchedCopy, caches.open(RUNTIME_CACHE)])
            .then(([response, cache]) => {
                if (response && response.ok) {
                    return cache.put(request, response);
                }
            })
            .catch(error => {
                console.log('[SW] Cache update error:', error);
            })
    );
});

/**
 * Handle background sync for when connection is restored
 */
self.addEventListener('sync', event => {
    console.log('[SW] Background sync triggered');
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Add any background sync logic here
            // For example, sync offline actions when connection is restored
            console.log('[SW] Performing background sync...')
        );
    }
});

/**
 * Handle push notifications (if needed)
 */
self.addEventListener('push', event => {
    console.log('[SW] Push message received');
    
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/images/icon-192x192.png',
            badge: '/images/icon-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            }
        };
        
        event.waitUntil(
            self.registration.showNotification('PWA Notification', options)
        );
    }
});