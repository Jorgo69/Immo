/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

// Pré-mise en cache des assets générés par Vite
precacheAndRoute(self.__WB_MANIFEST)

// Écoute des notifications Push
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const options = {
      body: data.notification.body,
      icon: data.notification.icon || '/favicon.ico',
      badge: data.notification.badge || '/vite.svg',
      data: data.notification.data,
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Ouvrir' },
        { action: 'close', title: 'Fermer' }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.notification.title, options)
    )
  } catch (error) {
    console.error('Error in push event:', error)
  }
})

// Gestion du clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  // Ouvrir l'URL spécifiée ou la racine de l'app
  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si un onglet est déjà ouvert, on le focus
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // Sinon on ouvre une nouvelle fenêtre
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})
