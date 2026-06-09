import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  subscribeOrders, advanceStatus, deleteOrder,
  STATUS_LABELS, STATUS_NEXT
} from '../../lib/orders'
import StatusBadge from '../../components/ui/StatusBadge'
import { getUrgencyClass, getUrgencyLabel } from '../../components/ui/UrgencyIndicator'
import AppLayout from '../../components/layout/AppLayout'
import OrderDetail from './OrderDetail'

const FILTERS = ['all', 'todo', 'inprogress', 'ready', 'done']

export default function ToutesCommandes() {
  const [orders, setOrders] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => subscribeOrders(setOrders), [])

  const counts = FILTERS.reduce((acc, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter((o) => o.status === s).length
    return acc
  }, {})

  const filtered = filterStatus === 'all'
    ? orders
    : orders.filter((o) => o.status === filterStatus)

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette commande ?')) return
    await deleteOrder(id)
    toast.success('Commande supprimée')
  }

  if (selected) {
    return <OrderDetail order={selected} onBack={() => setSelected(null)} />
  }

  return (
    <AppLayout
      title="Commandes"
      subtitle={`${orders.length} commande${orders.length > 1 ? 's' : ''} au total`}
    >
      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-none">
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === s
                ? 'bg-eerie text-white'
                : 'bg-white text-eerie/55 border border-alice'
            }`}
          >
            {s === 'all' ? 'Toutes' : STATUS_LABELS[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-eerie/35">Aucune commande dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelected(order)}
              className={`card cursor-pointer active:scale-[0.98] transition-transform ${
                order.status !== 'done' ? getUrgencyClass(order.pickupDate) : ''
              } pl-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <p className="font-bold text-eerie truncate">{order.clientName}</p>
                    {order.status !== 'done' && (
                      <span className="text-xs text-eerie/40 flex-shrink-0">
                        {getUrgencyLabel(order.pickupDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-eerie/55 truncate">{order.articles}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-eerie/40">
                      {format(parseISO(order.pickupDate), 'dd MMM à HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>
                <div
                  className="flex flex-col gap-2 items-end flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {STATUS_NEXT[order.status] && (
                    <button
                      onClick={() => advanceStatus(order.id, order.status).then(() => toast.success('Mis à jour'))}
                      className="text-xs bg-honeydew text-eerie rounded-xl px-3 py-1.5 font-medium active:scale-95 transition-transform whitespace-nowrap"
                    >
                      Avancer →
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="text-xs text-red-400 font-medium py-1"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
