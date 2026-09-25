import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getMessagingInstance, db, firebaseConfig } from './firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// iPhone / iPad (y compris iPad qui se présente comme un Mac)
export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

// App lancée depuis l'icône de l'écran d'accueil (obligatoire sur iOS pour les notifications)
export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true

// Enregistre le service worker en lui passant la config Firebase dans l'URL
async function registerServiceWorker() {
  const params = new URLSearchParams(
    Object.entries(firebaseConfig).filter(([, v]) => v)
  )
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`)
}

// Récupère le token FCM et l'enregistre dans Firestore, associé au rôle.
// askPermission=false : rafraîchit seulement si la permission est déjà accordée (pas de popup).
export async function registerFCMToken(role, deviceId, { askPermission = true } = {}) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null

  try {
    // iOS : la demande doit partir AVANT tout await, sinon Safari n'affiche pas la fenêtre « Autoriser »
    const permission = askPermission
      ? await Notification.requestPermission()
      : Notification.permission
    if (permission !== 'granted') return null

    const messaging = await getMessagingInstance()
    if (!messaging) return null

    const serviceWorkerRegistration = await registerServiceWorker()
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration })
    if (!token) return null

    // Sauvegarde dans Firestore : fcm_tokens/{deviceId}
    await setDoc(doc(db, 'fcm_tokens', deviceId), {
      token,
      role,
      platform: isIOS() ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'autre',
      updatedAt: serverTimestamp(),
    })

    return token
  } catch (err) {
    console.warn('FCM registration failed:', err)
    return null
  }
}

// Écoute les messages FCM reçus en foreground (app ouverte)
export async function onForegroundMessage(callback) {
  const messaging = await getMessagingInstance()
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}

// Envoie une notification de test à ce téléphone. Renvoie true si le serveur l'a expédiée.
export async function sendTestNotification() {
  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'test', fromDeviceId: getDeviceId() }),
    })
    const json = await res.json().catch(() => ({}))
    return res.ok && json.sent > 0
  } catch {
    return false
  }
}

// Demande au serveur d'envoyer la notification push (ne bloque jamais l'appelant)
export function sendPushNotification(orderId, event) {
  fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, event, fromDeviceId: getDeviceId() }),
  }).catch((err) => console.warn('[notif] envoi push échoué :', err))
}

// Génère un ID de device stable (stocké en localStorage)
export function getDeviceId() {
  const key = 'agj_device_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}
