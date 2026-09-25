import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getMessagingInstance, db, firebaseConfig } from './firebase'

// Clé publique VAPID (Firebase > Paramètres du projet > Cloud Messaging > Certificats push Web).
// Publique par nature : écrite ici car la variable Vercel VITE_FIREBASE_VAPID_KEY était invalide.
const VAPID_KEY = 'BJ1kZLSPvNAIht-jehLgGd87MHX2gbDLr7Qz6YqruF2XiC9OkqaqEEVPiNPVkGXkyvg3PlQSm1SrXmO2r6yPhUO'

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
  await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`)
  // Firebase échoue si le worker n'est pas encore actif (fréquent sur iPhone au 1er lancement)
  return navigator.serviceWorker.ready
}

const getPlatform = () =>
  isIOS() ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'autre'

// Garde une trace de l'échec dans Firestore (sans token : le serveur l'ignore) pour pouvoir diagnostiquer
const saveRegistrationError = (deviceId, role, error) =>
  setDoc(doc(db, 'fcm_tokens', deviceId), {
    role,
    platform: getPlatform(),
    error: String(error?.message ?? error).slice(0, 500),
    userAgent: navigator.userAgent.slice(0, 300),
    updatedAt: serverTimestamp(),
  }).catch(() => {})

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
    if (!messaging) {
      saveRegistrationError(deviceId, role, 'Firebase Messaging non supporté sur cet appareil')
      return null
    }

    const serviceWorkerRegistration = await registerServiceWorker()
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration })
    if (!token) {
      saveRegistrationError(deviceId, role, 'getToken a renvoyé un token vide')
      return null
    }

    // Sauvegarde dans Firestore : fcm_tokens/{deviceId}
    await setDoc(doc(db, 'fcm_tokens', deviceId), {
      token,
      role,
      platform: getPlatform(),
      updatedAt: serverTimestamp(),
    })

    return token
  } catch (err) {
    console.warn('FCM registration failed:', err)
    saveRegistrationError(deviceId, role, err)
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
