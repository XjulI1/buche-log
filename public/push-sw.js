/* global self, clients */
// Charge par le service worker genere (workbox.importScripts dans nuxt.config.ts).
// Les notifications sont envoyees sans contenu : le message est fixe.

self.addEventListener('push', (event) => {
  event.waitUntil(
    self.registration.showNotification('Buche-Log', {
      body: 'Pas encore de relevé cette semaine : notez le niveau de votre porte-bûches.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'weekly-reminder',
      data: { url: '/releve' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    }),
  )
})
