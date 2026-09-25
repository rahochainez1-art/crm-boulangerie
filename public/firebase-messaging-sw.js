importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// La config Firebase (publique) est passée dans l'URL d'enregistrement du service worker
// (voir src/lib/notifications.js). L'init doit être synchrone, au chargement du worker :
// sinon, téléphone verrouillé / app fermée, la notification n'est jamais reçue.
const params = new URL(self.location).searchParams
const config = Object.fromEntries(params.entries())

if (config.apiKey) {
  firebase.initializeApp(config)
  // Les messages envoyés par /api/notify contiennent un bloc "notification" :
  // Firebase l'affiche tout seul (avec le son du téléphone) et ouvre l'app au clic.
  firebase.messaging()
}

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
