importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// Ces valeurs sont injectées au build — à remplacer par tes vraies clés
// ou utiliser un endpoint /api/firebase-config si tu ne veux pas les exposer
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebase.initializeApp(event.data.config)
    const messaging = firebase.messaging()

    messaging.onBackgroundMessage((payload) => {
      const { title, body, icon } = payload.notification ?? {}
      self.registration.showNotification(title ?? 'Au Grand Jour', {
        body: body ?? 'Nouvelle mise à jour commande',
        icon: icon ?? '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        tag: payload.data?.orderId ?? 'agj-notif',
        data: payload.data,
      })
    })
  }
})

// Clic sur la notification → ouvre l'app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus()
      return clients.openWindow('/')
    })
  )
})
