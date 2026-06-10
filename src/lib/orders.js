import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, onSnapshot, serverTimestamp, where, arrayUnion
} from 'firebase/firestore'
import { db } from './firebase'

export const STATUS = {
  TODO: 'todo',
  INPROGRESS: 'inprogress',
  READY: 'ready',
  DONE: 'done',
  CANCELLED: 'cancelled',
}

export const STATUS_LABELS = {
  todo: 'À faire',
  inprogress: 'En cours',
  ready: 'Prêt',
  done: 'Récupéré',
  cancelled: 'Annulée',
}

export const STATUS_NEXT = {
  todo: 'inprogress',
  inprogress: 'ready',
  ready: 'done',
}

export const cancelOrder = (id) =>
  updateDoc(doc(db, 'orders', id), {
    status: STATUS.CANCELLED,
    statusChangedAt: serverTimestamp(),
    statusHistory: arrayUnion({ status: STATUS.CANCELLED, at: new Date().toISOString() }),
    updatedAt: serverTimestamp(),
  })

export const createOrder = (data) =>
  addDoc(collection(db, 'orders'), {
    ...data,
    status: STATUS.TODO,
    statusHistory: [{ status: STATUS.TODO, at: new Date().toISOString() }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

export const updateOrder = (id, data) =>
  updateDoc(doc(db, 'orders', id), { ...data, updatedAt: serverTimestamp() })

// Avance au statut suivant + horodate le changement
export const advanceStatus = (id, currentStatus) => {
  const next = STATUS_NEXT[currentStatus]
  if (!next) return Promise.resolve()
  return updateDoc(doc(db, 'orders', id), {
    status: next,
    statusChangedAt: serverTimestamp(),
    statusHistory: arrayUnion({ status: next, at: new Date().toISOString() }),
    updatedAt: serverTimestamp(),
  })
}

// Définit un statut arbitraire (usage pâtissière)
export const setStatus = (id, newStatus) =>
  updateDoc(doc(db, 'orders', id), {
    status: newStatus,
    statusChangedAt: serverTimestamp(),
    statusHistory: arrayUnion({ status: newStatus, at: new Date().toISOString() }),
    updatedAt: serverTimestamp(),
  })

export const deleteOrder = (id) => deleteDoc(doc(db, 'orders', id))

export const seedFakeOrders = async () => {
  // Heures relatives à maintenant pour être sûr qu'elles sont visibles
  const fromNow = (offsetMinutes) => {
    const dt = new Date(Date.now() + offsetMinutes * 60 * 1000)
    return dt.toISOString()
  }
  const tomorrow = (offsetMinutes) => {
    const dt = new Date(Date.now() + 24 * 60 * 60 * 1000 + offsetMinutes * 60 * 1000)
    return dt.toISOString()
  }
  const orders = [
    { clientName: 'Marie Lefebvre',  clientPhone: '06 12 34 56 78', articles: 'Gâteau anniversaire chocolat — 8 parts',             notes: 'Sans gluten, écrire "Joyeux 30 ans Marie"', pickupDate: fromNow(30),   deposit: 20, totalAmount: 55, status: 'todo',       assignedTo: 'patissiere' },
    { clientName: 'Thomas Renard',   clientPhone: '07 65 43 21 09', articles: '2 Paris-Brest + 6 éclairs café',                      notes: '',                                          pickupDate: fromNow(90),   deposit: 0,  totalAmount: 32, status: 'inprogress', assignedTo: 'patissiere' },
    { clientName: 'Sophie Martin',   clientPhone: '',               articles: 'Bûche framboise — 6 parts',                           notes: 'Allergie fruits à coque',                   pickupDate: fromNow(150),  deposit: 15, totalAmount: 45, status: 'ready',      assignedTo: 'patissiere' },
    { clientName: 'Lucas Bernard',   clientPhone: '06 55 66 77 88', articles: 'Tarte aux fraises + 4 choux craquelin',               notes: '',                                          pickupDate: tomorrow(-60), deposit: 10, totalAmount: 38, status: 'todo',       assignedTo: 'patissiere' },
    { clientName: 'Emma Dupont',     clientPhone: '07 11 22 33 44', articles: 'Mille-feuille 8 parts — inscription "Félicitations"', notes: 'Crème allégée si possible',                 pickupDate: tomorrow(30),  deposit: 25, totalAmount: 60, status: 'todo',       assignedTo: 'patissiere' },
    { clientName: 'Pierre Fontaine', clientPhone: '06 98 76 54 32', articles: '1 Forêt noire + 12 macarons assortis',                notes: '',                                          pickupDate: tomorrow(120), deposit: 30, totalAmount: 72, status: 'inprogress', assignedTo: 'patissiere' },
  ]
  console.log('[seed] Injection de', orders.length, 'commandes test...')
  const results = await Promise.all(
    orders.map(o =>
      addDoc(collection(db, 'orders'), {
        ...o,
        statusHistory: [{ status: o.status, at: new Date().toISOString() }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  )
  console.log('[seed] OK — IDs:', results.map(r => r.id))
  return results.length
}

// Toutes les commandes (manager, historique)
export const subscribeOrders = (callback) => {
  const q = query(collection(db, 'orders'), orderBy('pickupDate', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

// Commandes du jour (vendeur)
export const subscribeTodayOrders = (callback) => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const q = query(
    collection(db, 'orders'),
    where('pickupDate', '>=', start.toISOString()),
    where('pickupDate', '<=', end.toISOString()),
    orderBy('pickupDate', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

// Commandes actives (pâtissière) — non récupérées, triées par date retrait
export const subscribeActiveOrders = (callback) => {
  const q = query(
    collection(db, 'orders'),
    where('status', '!=', STATUS.DONE),
    orderBy('status'),
    orderBy('pickupDate', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}
