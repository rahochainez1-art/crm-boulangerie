import { useEffect, useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { subscribeOrders } from '../../lib/orders'
import StatusBadge from '../../components/ui/StatusBadge'
import BottomNav from '../../components/layout/BottomNav'

const TABS = [
  { id: 'all',       label: 'Toutes' },
  { id: 'active',    label: 'En cours' },
  { id: 'done',      label: 'Récupérées' },
  { id: 'cancelled', label: 'Annulées' },
]

export default function Historique() {
  const [orders, setOrders] = useState([])
  const [tab, setTab]       = useState('all')

  useEffect(() => subscribeOrders(setOrders), [])

  // Toutes les commandes, les plus récemment créées en premier
  const allOrders = useMemo(() =>
    [...orders].sort((a, b) => {
      const sa = a.createdAt?.seconds ?? 0
      const sb = b.createdAt?.seconds ?? 0
      return sb - sa
    }),
    [orders]
  )

  const counts = useMemo(() => ({
    all:       allOrders.length,
    active:    allOrders.filter(o => ['todo','inprogress','ready'].includes(o.status)).length,
    done:      allOrders.filter(o => o.status === 'done').length,
    cancelled: allOrders.filter(o => o.status === 'cancelled').length,
  }), [allOrders])

  const filtered = useMemo(() => {
    if (tab === 'active')    return allOrders.filter(o => ['todo','inprogress','ready'].includes(o.status))
    if (tab === 'done')      return allOrders.filter(o => o.status === 'done')
    if (tab === 'cancelled') return allOrders.filter(o => o.status === 'cancelled')
    return allOrders
  }, [allOrders, tab])

  return (
    <div className="min-h-dvh bg-cream flex flex-col max-w-lg mx-auto">
      <header
        className="bg-cream px-5 pb-4 border-b border-warm"
        style={{ paddingTop: 'max(48px, env(safe-area-inset-top))' }}
      >
        <p className="label-xs mb-1">Au Grand Jour</p>
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold text-ink">Historique</h1>
          {counts.all > 0 && (
            <span className="text-xs font-bold text-dust">
              {counts.all} commande{counts.all > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Filtres */}
      <div className="flex gap-1.5 px-4 pt-4 pb-1 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-ink text-chalk' : 'bg-chalk text-dust border border-warm'
            }`}
          >
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`ml-1.5 text-xs ${tab === t.id ? 'opacity-50' : 'opacity-60'}`}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      <main className="flex-1 px-4 pt-3 pb-28 overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-chalk border border-warm rounded-2xl px-5 py-16 text-center mt-2">
            <p className="text-2xl mb-3">◷</p>
            <p className="font-bold text-ink">Aucune commande</p>
            <p className="text-sm text-dust mt-1">
              Les commandes enregistrées apparaîtront ici
            </p>
          </div>
        ) : (
          filtered.map(order => <HistoriqueCard key={order.id} order={order} />)
        )}
      </main>

      <BottomNav />
    </div>
  )
}

function HistoriqueCard({ order }) {
  const pickupDate = parseISO(order.pickupDate)
  const reste = (order.totalAmount || 0) - (order.deposit || 0)

  return (
    <div className={`bg-chalk border rounded-2xl p-4 ${
      order.status === 'cancelled' ? 'border-red-100 opacity-60' : 'border-warm'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="font-semibold text-ink">{order.clientName}</p>
        <StatusBadge status={order.status} />
      </div>

      <p className="text-sm text-dust mb-2 leading-snug">{order.articles}</p>

      <div className="flex items-center gap-3 text-xs text-dust flex-wrap">
        <span>📅 {format(pickupDate, 'dd MMM à HH:mm', { locale: fr })}</span>
        {order.totalAmount > 0 && (
          <span className="font-semibold text-ink">{order.totalAmount} €</span>
        )}
        {reste > 0 && order.status !== 'cancelled' && (
          <span className="text-amber-700 font-semibold">{reste} € à encaisser</span>
        )}
      </div>

      {order.notes && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mt-2">
          {order.notes}
        </p>
      )}
    </div>
  )
}
