// MiaoDa Chat Service Worker
// Provides offline functionality, caching, and background sync

const CACHE_NAME = 'miaoda-chat-v1.0.0'
const RUNTIME_CACHE = 'miaoda-runtime'
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Assets to cache on install (critical resources)
const CRITICAL_ASSETS = ['/assets/index.js', '/assets/index.css', '/assets/fonts/inter-var.woff2']

// Network-first resources (API calls, dynamic content)
const NETWORK_FIRST_PATTERNS = [/\/api\//, /\/chat\//, /\/messages\//, /\/search\//]

// Cache-first resources (static assets)
const CACHE_FIRST_PATTERNS = [
  /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp)$/,
  /\/assets\//,
  /\/fonts\//,
  /\/images\//,
]

// Stale-while-revalidate patterns (frequently updated but cacheable)
const SWR_PATTERNS = [/\/plugins\//, /\/themes\//, /\/locales\//]

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    Promise.all([
      // Cache precache resources
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching precache resources')
        return cache.addAll(PRECACHE_URLS)
      }),

      // Cache critical assets
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching critical assets')
        return cache.addAll(CRITICAL_ASSETS).catch(err => {
          console.warn('[SW] Failed to cache some critical assets:', err)
        })
      }),
    ]).then(() => {
      console.log('[SW] Service worker installed successfully')
      // Force activation
      return self.skipWaiting()
    }),
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      }),

      // Take control of all clients
      self.clients.claim(),
    ]).then(() => {
      console.log('[SW] Service worker activated successfully')
    }),
  )
})

// Fetch event - handle network requests
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Skip requests to different origins (unless specifically handled)
  if (url.origin !== self.location.origin && !shouldHandleCrossOrigin(url)) {
    return
  }

  // Handle different request types
  if (matchesPattern(url.pathname, NETWORK_FIRST_PATTERNS)) {
    event.respondWith(networkFirst(request))
  } else if (matchesPattern(url.pathname, CACHE_FIRST_PATTERNS)) {
    event.respondWith(cacheFirst(request))
  } else if (matchesPattern(url.pathname, SWR_PATTERNS)) {
    event.respondWith(staleWhileRevalidate(request))
  } else {
    // Default to network first for other requests
    event.respondWith(networkFirst(request))
  }
})

// Background sync for offline message queuing
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag)

  if (event.tag === 'message-sync') {
    event.waitUntil(syncMessages())
  } else if (event.tag === 'search-index-sync') {
    event.waitUntil(syncSearchIndex())
  } else if (event.tag === 'settings-sync') {
    event.waitUntil(syncSettings())
  }
})

// Push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push message received:', event)

  const options = {
    badge: '/icons/badge-72x72.png',
    icon: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
        icon: '/icons/action-open.png',
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/icons/action-close.png',
      },
    ],
  }

  if (event.data) {
    const data = event.data.json()
    options.title = data.title || 'MiaoDa Chat'
    options.body = data.body || 'You have a new message'
    options.tag = data.tag || 'default'
    options.data = { ...options.data, ...data }
  } else {
    options.title = 'MiaoDa Chat'
    options.body = 'You have a new message'
  }

  event.waitUntil(self.registration.showNotification(options.title, options))
})

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event)

  event.notification.close()

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // Check if there's already a window/tab open
        for (const client of windowClients) {
          if (client.url === self.location.origin && 'focus' in client) {
            return client.focus()
          }
        }

        // Open new window/tab
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      }),
    )
  }
})

// Message handling from main thread
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data)

  const { type, payload } = event.data

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME })
      break
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
    case 'CACHE_URLS':
      cacheUrls(payload.urls).then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
    case 'QUEUE_MESSAGE':
      queueMessage(payload).then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
  }
})

// Caching strategies
async function networkFirst(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)

    // Fall back to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return (
        caches.match('/offline.html') ||
        new Response('Offline - Please check your internet connection', {
          status: 503,
          statusText: 'Service Unavailable',
        })
      )
    }

    throw error
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('[SW] Cache and network both failed:', request.url)
    throw error
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cachedResponse = await cache.match(request)

  // Start fetching fresh version
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(error => {
      console.log('[SW] Failed to revalidate:', request.url, error)
    })

  // Return cached version immediately, or wait for network
  return cachedResponse || fetchPromise
}

// Background sync functions
async function syncMessages() {
  console.log('[SW] Syncing queued messages...')

  try {
    const db = await openDB()
    const messages = await getQueuedMessages(db)

    for (const message of messages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message.data),
        })

        if (response.ok) {
          await removeQueuedMessage(db, message.id)
          console.log('[SW] Message synced successfully:', message.id)
        }
      } catch (error) {
        console.log('[SW] Failed to sync message:', message.id, error)
      }
    }
  } catch (error) {
    console.error('[SW] Message sync failed:', error)
  }
}

async function syncSearchIndex() {
  console.log('[SW] Syncing search index...')
  // Implementation would sync local search index with server
}

async function syncSettings() {
  console.log('[SW] Syncing settings...')
  // Implementation would sync user settings with server
}

// Utility functions
function matchesPattern(url, patterns) {
  return patterns.some(pattern => pattern.test(url))
}

function shouldHandleCrossOrigin(url) {
  // Handle specific external resources if needed
  const allowedOrigins = [
    // Add allowed external origins here
  ]

  return allowedOrigins.some(origin => url.origin === origin)
}

async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
}

async function cacheUrls(urls) {
  const cache = await caches.open(RUNTIME_CACHE)
  await cache.addAll(urls)
}

// IndexedDB utilities for offline message queuing
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MiaoDaChatDB', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = event => {
      const db = event.target.result

      if (!db.objectStoreNames.contains('messageQueue')) {
        const store = db.createObjectStore('messageQueue', { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

async function queueMessage(messageData) {
  const db = await openDB()
  const transaction = db.transaction(['messageQueue'], 'readwrite')
  const store = transaction.objectStore('messageQueue')

  const message = {
    data: messageData,
    timestamp: Date.now(),
    retries: 0,
  }

  return new Promise((resolve, reject) => {
    const request = store.add(message)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getQueuedMessages(db) {
  const transaction = db.transaction(['messageQueue'], 'readonly')
  const store = transaction.objectStore('messageQueue')

  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function removeQueuedMessage(db, messageId) {
  const transaction = db.transaction(['messageQueue'], 'readwrite')
  const store = transaction.objectStore('messageQueue')

  return new Promise((resolve, reject) => {
    const request = store.delete(messageId)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Periodic cleanup
setInterval(
  () => {
    // Clean up old runtime cache entries
    caches.open(RUNTIME_CACHE).then(cache => {
      // Implementation for cache cleanup based on age/size
    })
  },
  24 * 60 * 60 * 1000,
) // Daily cleanup

console.log('[SW] Service worker script loaded')
