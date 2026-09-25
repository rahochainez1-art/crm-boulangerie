// Fonction serveur Vercel : envoie une notification push (avec son) aux téléphones concernés.
// Appelée par l'app après la création d'une commande ou son passage en « Prête ».
// Nécessite la variable d'environnement Vercel FIREBASE_SERVICE_ACCOUNT_KEY (JSON du compte de service).
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) })
}
const db = getFirestore()

// "2026-09-25T10:00:00" → "aujourd'hui à 10h00" / "demain à 10h00" / "sam. 27/09 à 10h00"
// (l'heure est déjà l'heure locale saisie ; « aujourd'hui » est calculé à l'heure de Paris)
const formatPickup = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso ?? '')
  if (!m) return ''
  const heure = `${m[4]}h${m[5]}`
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
  const diff = Math.round((Date.UTC(m[1], m[2] - 1, m[3]) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
  if (diff === 0) return `aujourd'hui à ${heure}`
  if (diff === 1) return `demain à ${heure}`
  const jour = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'][new Date(Date.UTC(m[1], m[2] - 1, m[3])).getUTCDay()]
  return `${jour} ${m[3]}/${m[2]} à ${heure}`
}

const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : [])

// Notification volontairement minimale : le gâteau + la date de retrait
function buildMessage(event, order) {
  const gateau = (order.articles ?? '').split('\n')[0].slice(0, 80) || 'Commande'
  const retrait = formatPickup(order.pickupDate)
  if (event === 'new') {
    return {
      roles: [...asArray(order.assignedTo), 'manager', 'vendeur'],
      title: `🔥 ${gateau}`,
      body: `Retrait ${retrait}`,
    }
  }
  if (event === 'ready') {
    return {
      roles: ['vendeur', 'manager'],
      title: `✅ ${gateau}`,
      body: `Prête · retrait ${retrait}`,
    }
  }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' })

  const { orderId, event, fromDeviceId } = req.body ?? {}
  let msg, targets

  if (event === 'test') {
    // Notification de test envoyée uniquement au téléphone qui la demande
    if (typeof fromDeviceId !== 'string' || !fromDeviceId) return res.status(400).json({ error: 'fromDeviceId manquant' })
    const me = await db.collection('fcm_tokens').doc(fromDeviceId).get()
    if (!me.exists) return res.status(404).json({ error: 'Appareil non inscrit' })
    msg = { title: '🔔 Test Au Grand Jour', body: 'Les notifications sonores fonctionnent sur ce téléphone.' }
    targets = [me]
  } else {
    if (typeof orderId !== 'string' || !orderId) return res.status(400).json({ error: 'orderId manquant' })
    const snap = await db.collection('orders').doc(orderId).get()
    if (!snap.exists) return res.status(404).json({ error: 'Commande introuvable' })

    msg = buildMessage(event, snap.data())
    if (!msg) return res.status(400).json({ error: 'event inconnu' })

    const tokenSnap = await db.collection('fcm_tokens').where('role', 'in', [...new Set(msg.roles)]).get()
    targets = tokenSnap.docs.filter((d) => d.id !== fromDeviceId)
  }
  targets = targets.filter((d) => d.data().token)
  if (!targets.length) return res.status(200).json({ sent: 0 })

  const origin = `https://${req.headers['x-forwarded-host'] ?? req.headers.host}`
  const result = await getMessaging().sendEachForMulticast({
    tokens: targets.map((d) => d.data().token),
    webpush: {
      headers: { Urgency: 'high', TTL: '3600' },
      notification: {
        title: msg.title,
        body: msg.body,
        icon: '/icon-192.png',
        badge: '/badge-96.png',
        tag: `${event}-${orderId ?? Date.now()}`,
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [300, 100, 300, 100, 300],
      },
      fcmOptions: { link: `${origin}/` },
    },
  })

  // Supprime les téléphones désinscrits (app désinstallée, notifications retirées…)
  const dead = []
  result.responses.forEach((r, i) => {
    const code = r.error?.code
    if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
      dead.push(targets[i].ref.delete())
    }
  })
  await Promise.all(dead)

  return res.status(200).json({ sent: result.successCount, failed: result.failureCount })
}
