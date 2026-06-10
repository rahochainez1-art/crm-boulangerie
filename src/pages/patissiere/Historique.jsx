import { useEffect, useState, useMemo } from 'react'
import { format, parseISO, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { subscribeOrders, isAssignedTo } from '../../lib/orders'
import AppLayout from '../../components/layout/AppLayout'

export default function PatissiereHistorique() {
  const [orders, setOrders] = useState([])

  useEffect(() => subscribeOrders(setOrders), [])

  const histoOrders = useMemo(() =>
    orders
      .filter(o => isAssignedTo(o, 'patissiere') && (o.status === 'ready' || o.status === 'done'))
      .sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate)),
    [orders]
  )

  // Groupe par date
  const grouped = useMemo(() => {
    const map = []
    const seen = new Set()
    histoOrders.forEach(o => {
      const key = format(parseISO(o.pickupDate), 'yyyy-MM-dd')
      if (!seen.has(key)) {
        seen.add(key)
        map.push({ key, orders: [] })
      }
      map.find(g => g.key === key).orders.push(o)
    })
    return map
  }, [histoOrders])

  return (
    <AppLayout title="Historique">

      {histoOrders.length === 0 ? (
        <div className="bg-chalk border border-warm rounded-2xl text-center py-16 px-6 mt-2">
          <p className="text-2xl mb-3">—</p>
          <p className="font-bold text-ink">Aucune commande prête</p>
          <p className="text-sm text-dust mt-1">Les commandes marquées Prêt ou Récupéré apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ key, orders: dayOrders }) => {
            const day = parseISO(key)
            const isToday = isSameDay(day, new Date())
            return (
              <div key={key}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-dust mb-2.5 px-1 capitalize">
                  {isToday ? "Aujourd'hui" : format(day, 'EEEE d MMMM', { locale: fr })}
                </p>
                <div className="space-y-2.5">
                  {dayOrders.map(order => (
                    <HistoCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </AppLayout>
  )
}

function HistoCard({ order }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className={`h-1 ${order.status === 'done' ? 'bg-green-400' : 'bg-lime'}`} />
      <div className="px-4 py-3.5 flex items-start gap-3">

        {/* Heure */}
        <div className="flex-shrink-0 text-right min-w-[44px]">
          <p className="text-[10px] font-bold text-dust uppercase tracking-wide leading-none mb-1">Retrait</p>
          <p className="text-xl font-bold text-ink tabular-nums leading-none">
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </p>
        </div>

        <div className="w-px self-stretch bg-warm flex-shrink-0" />

        {/* Détails */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink truncate">{order.clientName}</p>
          <p className="text-sm text-dust mt-0.5 truncate">{order.articles}</p>
          {order.notes && (
            <p className="text-xs mt-1.5 px-2 py-1 rounded-lg inline-block" style={{ backgroundColor: '#FFFBEB', color: '#92400E' }}>
              ⚠ {order.notes}
            </p>
          )}
        </div>

        {/* Badge statut */}
        <div className="flex-shrink-0">
          <StatusPill status={order.status} />
        </div>

      </div>
    </div>
  )
}

function StatusPill({ status }) {
  if (status === 'done') {
    return (
      <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
        Récupéré ✓
      </span>
    )
  }
  return (
    <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime/60 text-ink border border-lime">
      Prêt ✓
    </span>
  )
}
