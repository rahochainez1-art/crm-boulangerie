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
}

export const STATUS_LABELS = {
  todo: 'À faire',
  inprogress: 'En cours',
  ready: 'Prêt',
  done: 'Récupéré',
}

export const STATUS_NEXT = {
  todo: 'inprogress',
  inprogress: 'ready',
  ready: 'done',
}

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

export const deleteOrder = (id) => deleteDoc(doc(db, 'orders', id))

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
