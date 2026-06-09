import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeTodayOrders, advanceStatus } from '../../lib/orders'
import StatusBadge from '../../components/ui/StatusBadge'
import { getUrgencyClass, getUrgencyLabel } from '../../components/ui/UrgencyIndicator'
import AppLayout from '../../components/layout/AppLayout'

export default function VueJour() {
  const [orders, setOrders] = useState([])
  const [prevReady, setPrevReady] = useState(new Set())

  useEffect(() => {
    return subscribeTodayOrders((newOrders) => {
      // Notification in-app quand une commande passe à "prêt"
      const newReady = new Set(newOrders.filter((o) => o.status === 'ready').map((o) => o.id))
      newReady.forEach((id) => {
        if (!prevReady.has(id)) {
          const order = newOrders.find((o) => o.id === id)
          toast.success(`✓ Commande prête : ${order?.clientName}`, { duration: 6000 })
        }
      })
      setPrevReady(newReady)
      setOrders(newOrders)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const today = format(new Date(), 'EEEE d MMMM', { locale: fr })
  const ready = orders.filter((o) => o.status === 'ready').length

  return (
    <AppLayout title="Aujourd'hui" subtitle={today}>
      {/* Résumé express */}
      {orders.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-eerie">{orders.length}</p>
            <p className="text-xs text-eerie/50 mt-0.5">Commandes</p>
          </div>
          <div className={`${ready > 0 ? 'bg-honeydew' : 'bg-white'} rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-bold text-eerie">{ready}</p>
            <p className="text-xs text-eerie/50 mt-0.5">Prêtes</p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-4xl mb-3">✓</p>
          <p className="font-semibold text-eerie">Aucune commande aujourd'hui</p>
          <p className="text-sm text-eerie/40 mt-1">Profite de la journée !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`card ${order.status !== 'done' ? getUrgencyClass(order.pickupDate) : ''} pl-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-eerie truncate">{order.clientName}</span>
                    <span className="text-xs text-eerie/40 font-medium flex-shrink-0">
                      {getUrgencyLabel(order.pickupDate)}
                    </span>
                  </div>
                  <p className="text-sm text-eerie/60 truncate">{order.articles}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-eerie/40">
                      {format(parseISO(order.pickupDate), 'HH:mm')}
                    </span>
                    {order.clientPhone && (
                      <a href={`tel:${order.clientPhone}`} className="text-xs text-eerie/40 underline">
                        {order.clientPhone}
                      </a>
                    )}
                  </div>
                  {order.notes && (
                    <p className="text-xs text-eerie/50 mt-2 bg-vanilla/50 rounded-xl px-2.5 py-1.5 line-clamp-2">
                      {order.notes}
                    </p>
                  )}
                </div>
                {order.status !== 'done' && (
                  <button
                    onClick={() => advanceStatus(order.id, order.status).then(() => toast.success('Mis à jour'))}
                    className="bg-eerie text-white rounded-2xl px-4 py-2.5 text-xs font-semibold active:scale-95 transition-transform flex-shrink-0"
                  >
                    Avancer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
