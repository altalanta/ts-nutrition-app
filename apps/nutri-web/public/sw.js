// Service Worker for Nutrition Tracker PWA
const CACHE_NAME = 'nutrition-tracker-v1'
const STATIC_CACHE = 'static-v1'
const API_CACHE = 'api-v1'

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Caching static assets')
      return cache.addAll([
        '/',
        '/_next/static/css/',
        '/_next/static/js/',
        '/manifest.webmanifest',
        '/icons/'
      ])
    })
  )

  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )

  // Take control of all clients
  self.clients.claim()
})

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) return

  // Handle API requests differently based on mock mode
  if (url.pathname.startsWith('/api/')) {
    // For API requests, try network first, then fallback to cache
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.ok) {
              cache.put(request, response.clone())
            }
            return response
          })
          .catch(() => {
            // Fallback to cache for offline support
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }

              // If no cached response and in mock mode, return mock data
              if (self.location.hostname === 'localhost' || request.url.includes('mock')) {
                return new Response(
                  JSON.stringify({
                    foods: [],
                    error: 'Offline mode - mock data not available for this endpoint'
                  }),
                  {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                  }
                )
              }

              return new Response(
                JSON.stringify({ error: 'Network unavailable' }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              )
            })
          })
      })
    )
  } else if (request.method === 'GET') {
    // For static assets, use cache-first strategy
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
  }
})

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered')
    // Handle background sync for offline actions
  }
})

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: data.url
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    )
  }
})

