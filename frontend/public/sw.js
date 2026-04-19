// Service Worker for Web Push Notifications
const CACHE_NAME = 'admin-push-notifications-v1'

// Install event - cache static assets if needed
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing service worker')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache opened')
        return cache.addAll([])
      })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating service worker')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event)
  
  if (!event.data) {
    console.log('[Service Worker] No data in push event')
    return
  }

  const data = event.data.json()
  console.log('[Service Worker] Push data:', data)
  
  const title = data.title || 'New Notification'
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/Logo.png',
    badge: data.badge || '/favicon-32x32.png',
    tag: data.tag || 'admin-notification',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click event - handle when user clicks on notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event)
  
  event.notification.close()
  
  const notificationData = event.notification.data || {}
  const urlToOpen = notificationData.url || '/admin/orders'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a client window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Message event - handle messages from main app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})