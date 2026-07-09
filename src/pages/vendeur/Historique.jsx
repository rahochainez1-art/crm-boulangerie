import { useEffect, useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { subscribeOrders } from '../../lib/orders'
import StatusBadge from '../../components/ui/StatusBadge'

const TABS = [
  { id: 'all',       label: 'Toutes' },
  { id: 'active',    label: 'En cours' },
  { id: 'done',      label: 'Récupérées' },
  { id: 'cancelled', label: 'Annulées' },
]

function isActive(status) {
  return status === 'todo' || status === 'inprogress' || status === 'ready'
}

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
    active:    allOrders.filter(o => isActive(o.status)).length,
    done:      allOrders.filter(o => o.status === 'done').length,
    cancelled: allOrders.filter(o => o.status === 'cancelled').length,
  }), [allOrders])

  const filtered = useMemo(() => {
    if (tab === 'active')    return allOrders.filter(o => isActive(o.status))
    if (tab === 'done')      return allOrders.filter(o => o.status === 'done')
    if (tab === 'cancelled') return allOrders.filter(o => o.status === 'cancelled')
    return allOrders
  }, [allOrders, tab])

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#F5F2EB' }}>

      {/* Header */}
      <header className="px-5 pb-4" style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}>
        <div className="flex items-end justify-between">
          <h1 style={{ fontSize: 'clamp(1.75rem, 7vw, 2.25rem)', fontWeight: 700, fontFamily: 'Satoshi', color: '#111111', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Historique
          </h1>
          {counts.all > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi' }}>
              {counts.all} commande{counts.all > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 4 }}>
          Toutes les commandes de la boulangerie.
        </p>
      </header>

      {/* Filtres */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto scrollbar-none">
        {TABS.map(t => {
          const isTabActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-shrink-0 active:scale-95 transition-transform"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 9999,
                backgroundColor: isTabActive ? '#432F2E' : '#FFFFFF',
                color: isTabActive ? '#FFFFFF' : '#432F2E',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: isTabActive ? 'none' : '1.5px solid #FFF0B5',
                cursor: 'pointer',
                fontFamily: 'Satoshi',
                letterSpacing: '-0.01em',
              }}
            >
              {t.label}
              {counts[t.id] > 0 && (
                <span style={{ marginLeft: 4, opacity: isTabActive ? 0.6 : 0.7 }}>
                  · {counts[t.id]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Liste */}
      <main className="flex-1 px-5 pb-28 overflow-y-auto space-y-2.5">
        {filtered.length === 0 ? (
          <div
            className="rounded-[20px] px-5 py-14 text-center mt-2"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.08)' }}
          >
            <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>
              {allOrders.length === 0 ? 'Aucune commande pour le moment' : 'Aucune commande ici'}
            </p>
          </div>
        ) : (
          filtered.map((order, i) => <HistoriqueCard key={order.id} order={order} index={i} />)
        )}
      </main>

    </div>
  )
}

function HistoriqueCard({ order, index }) {
  const pickupDate = parseISO(order.pickupDate)
  const reste = (order.totalAmount || 0) - (order.deposit || 0)
  const isCancelled = order.status === 'cancelled'

  return (
    <div
      className="animate-fade-up"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        border: isCancelled ? '1px solid rgba(185,28,28,0.15)' : '1px solid rgba(67,47,46,0.08)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(67,47,46,0.06)',
        opacity: isCancelled ? 0.7 : 1,
        padding: 16,
        animationDelay: `${index * 0.03}s`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p style={{ fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {order.clientName}
        </p>
        <StatusBadge status={order.status} />
      </div>

      <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', lineHeight: 1.4, marginBottom: 8 }}>
        {order.articles}
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <span style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>
          {format(pickupDate, 'dd MMM à HH:mm', { locale: fr })}
        </span>
        {order.totalAmount > 0 && (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>
            {order.totalAmount} €
          </span>
        )}
        {reste > 0 && !isCancelled && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#432F2E', fontFamily: 'Satoshi', backgroundColor: '#FFF0B5', padding: '0.1rem 0.5rem', borderRadius: 9999 }}>
            {reste} € à encaisser
          </span>
        )}
      </div>

      {order.notes && (
        <p style={{ fontSize: '0.75rem', color: '#432F2E', fontFamily: 'Satoshi', backgroundColor: 'rgba(255,240,181,0.4)', border: '1px solid rgba(67,47,46,0.1)', borderRadius: 12, padding: '0.4rem 0.65rem', marginTop: 8 }}>
          {order.notes}
        </p>
      )}
    </div>
  )
}
