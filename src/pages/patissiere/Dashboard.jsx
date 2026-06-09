import { useEffect, useState } from 'react'
import { format, parseISO, differenceInHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeActiveOrders, advanceStatus, STATUS_NEXT } from '../../lib/orders'
import AppLayout from '../../components/layout/AppLayout'

function urgency(pickupDate) {
  const h = differenceInHours(parseISO(pickupDate), new Date())
  if (h < 0)  return { label: 'En retard',    bar: 'bg-red-500',    pill: 'bg-red-50 text-red-600 border-red-100' }
  if (h < 24) return { label: "Aujourd'hui",  bar: 'bg-red-400',    pill: 'bg-red-50 text-red-600 border-red-100' }
  if (h < 48) return { label: 'Demain',       bar: 'bg-amber-400',  pill: 'bg-amber-50 text-amber-700 border-amber-100' }
  return       { label: `J+${Math.ceil(h/24)}`, bar: 'bg-sage',     pill: 'bg-green-50 text-green-700 border-green-100' }
}

function OrderCard({ order }) {
  const [busy, setBusy] = useState(false)
  const u = urgency(order.pickupDate)
  const canAdvance = !!STATUS_NEXT[order.status]

  const handleAdvance = async () => {
    setBusy(true)
    await advanceStatus(order.id, order.status)
    toast.success(order.status === 'inprogress' ? '✓ Passé Prêt — vendeur notifié' : 'Mis à jour')
    setBusy(false)
  }

  return (
    <div className="bg-chalk border border-warm rounded-2xl overflow-hidden">
      {/* Barre urgence */}
      <div className={`h-1 ${u.bar}`} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Urgence + date */}
            <div className="flex items-center gap-2 mb-2.5">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${u.pill}`}>
                {u.label}
              </span>
              <span className="text-xs text-dust">
                {format(parseISO(order.pickupDate), 'dd MMM à HH:mm', { locale: fr })}
              </span>
            </div>
            {/* Article — dominant */}
            <p className="font-bold text-ink text-base leading-snug">{order.articles}</p>
            {/* Client */}
            <p className="text-sm text-dust mt-1">
              {order.clientName}
              {order.clientPhone && (
                <a href={`tel:${order.clientPhone}`} className="ml-2 underline">{order.clientPhone}</a>
              )}
            </p>
            {/* Note allergie */}
            {order.notes && (
              <div className="mt-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <p className="text-xs text-amber-800 leading-relaxed">⚠ {order.notes}</p>
              </div>
            )}
            {/* Badges */}
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {order.status === 'ready' && (
                <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">
                  ✓ Vendeur notifié
                </span>
              )}
            </div>
          </div>
          {/* Bouton avancer */}
          {canAdvance && (
            <button
              onClick={handleAdvance}
              disabled={busy}
              className={`flex-shrink-0 font-bold rounded-xl px-4 py-3 text-sm min-h-[48px] transition-opacity active:opacity-70 disabled:opacity-40 ${
                order.status === 'inprogress'
                  ? 'bg-lime text-ink border border-lime/30'
                  : 'bg-ink text-chalk'
              }`}
            >
              {busy ? '...' : order.status === 'inprogress' ? 'Prêt ✓' : 'Avancer →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PatissiereDashboard() {
  const [orders, setOrders] = useState([])
  useEffect(() => subscribeActiveOrders(setOrders), [])

  const todo       = orders.filter((o) => o.status === 'todo')
  const inprogress = orders.filter((o) => o.status === 'inprogress')
  const ready      = orders.filter((o) => o.status === 'ready')

  return (
    <AppLayout title="Production" subtitle={format(new Date(), 'EEEE d MMMM', { locale: fr })}>
      {orders.length === 0 ? (
        <div className="bg-chalk border border-warm rounded-2xl text-center py-14">
          <p className="text-3xl mb-3">🎉</p>
          <p className="font-bold text-ink">Tout est à jour !</p>
          <p className="text-sm text-dust mt-1">Aucune commande active.</p>
        </div>
      ) : (
        <>
          {/* Compteurs */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: 'À faire',  count: todo.length,       bg: 'bg-parchment' },
              { label: 'En cours', count: inprogress.length, bg: 'bg-status-inprogress' },
              { label: 'Prêtes',   count: ready.length,      bg: 'bg-lime' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-warm`}>
                <p className="text-2xl font-bold text-ink">{s.count}</p>
                <p className="label-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {inprogress.length > 0 && <Section title="En cours" dot="bg-amber-400" orders={inprogress} />}
          {todo.length > 0       && <Section title="À faire"  dot="bg-ink/20"    orders={todo} />}
          {ready.length > 0      && <Section title="Prêtes"   dot="bg-sage"      orders={ready} />}
        </>
      )}
    </AppLayout>
  )
}

function Section({ title, dot, orders }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
        <p className="label-xs">{title} ({orders.length})</p>
      </div>
      <div className="space-y-3">
        {orders.map((o) => <OrderCard key={o.id} order={o} />)}
      </div>
    </div>
  )
}
