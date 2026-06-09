import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getMessagingInstance, db } from './firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// Demande la permission et enregistre le token FCM dans Firestore
// Le token est associé à un rôle pour cibler les bonnes personnes
export async function registerFCMToken(role, deviceId) {
  const messaging = await getMessagingInstance()
  if (!messaging) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (!token) return null

    // Sauvegarde dans Firestore : tokens/{deviceId}
    await setDoc(doc(db, 'fcm_tokens', deviceId), {
      token,
      role,
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
