import { writeFileSync, mkdirSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const snap = await db.collection('orders').get()
const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

mkdirSync('backups', { recursive: true })
const today = new Date().toISOString().slice(0, 10)
writeFileSync(`backups/${today}.json`, JSON.stringify(orders, null, 2))
writeFileSync('backups/latest.json', JSON.stringify(orders, null, 2))

console.log(`Sauvegarde de ${orders.length} commande(s) — backups/${today}.json`)
