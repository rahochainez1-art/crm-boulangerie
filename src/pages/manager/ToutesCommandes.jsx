import { useEffect, useState } from 'react'
import { format, parseISO, isSameDay, differenceInHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  subscribeOrders, advanceStatus, deleteOrder,
  STATUS_LABELS, STATUS_NEXT
} from '../../lib/orders'
import StatusBadge from '../../components/ui/StatusBadge'
import { getUrgencyClass, getUrgencyLabel } from '../../components/ui/UrgencyIndicator'
import AppLayout from '../../components/layout/AppLayout'
import OrderDetail from './OrderDetail'

const STATUS_FILTERS = ['all', 'todo', 'inprogress', 'ready', 'done']

export default function ToutesCommandes() {
  const location = useLocation()
  const state    = location.state ?? {}

  const [orders,       setOrders]       = useState([])
  const [filterStatus, setFilterStatus] = useState(state.status ?? 'all')
  const [filterDate,   setFilterDate]   = useState(state.date   ?? null)
  const [selected,     setSelected]     = useState(null)

  useEffect(() => subscribeOrders(setOrders), [])

  // Ouvre automatiquement le détail si un orderId est passé
  useEffect(() => {
    if (!state.orderId || orders.length === 0) return
    const target = orders.find(o => o.id === state.orderId)
    if (target) setSelected(target)
  }, [state.orderId, orders])

  const now = new Date()

  // Filtre combiné : statut + date + urgent
  const filtered = orders.filter(o => {
    // Filtre urgentes (< 2h)
    if (filterStatus === 'urgent') {
      if (!o.pickupDate || o.status === 'done' || o.status === 'cancelled') return false
      return differenceInHours(parseISO(o.pickupDate), now) <= 2
    }
    // Filtre statut standard
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    // Filtre par date
    if (filterDate && o.pickupDate) {
      if (!isSameDay(parseISO(o.pickupDate), new Date(filterDate))) return false
    }
    return true
  })

  const counts = STATUS_FILTERS.reduce((acc, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length
    return acc
  }, { urgent: orders.filter(o => o.pickupDate && o.status !== 'done' && o.status !== 'cancelled' && differenceInHours(parseISO(o.pickupDate), now) <= 2).length })

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette commande ?')) return
    await deleteOrder(id)
    toast.success('Commande supprimée')
  }

  const clearDate = () => setFilterDate(null)

  if (selected) {
    return <OrderDetail order={selected} onBack={() => setSelected(null)} />
  }

  const isDateFiltered  = Boolean(filterDate)
  const isUrgentFilter  = filterStatus === 'urgent'
  const dateLabel       = filterDate ? format(new Date(filterDate), 'EEEE d MMMM', { locale: fr }) : null

  return (
    <AppLayout
      title="Commandes"
      subtitle={`${filtered.length} commande${filtered.length > 1 ? 's' : ''} affichée${filtered.length > 1 ? 's' : ''}`}
    >
      {/* Filtre date actif */}
      {isDateFiltered && (
        <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl" style={{ backgroundColor: '#FFF8D6', border: '1px solid rgba(200,150,12,0.2)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="capitalize" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#92400E', fontFamily: 'Satoshi', flex: 1 }}>
            {dateLabel}
          </span>
          <button onClick={clearDate} style={{ fontSize: '0.75rem', color: '#B8860B', fontFamily: 'Satoshi', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            × Effacer
          </button>
        </div>
      )}

      {/* Filtres statut */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-none">
        {[...STATUS_FILTERS, 'urgent'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === s
                ? s === 'urgent' ? 'bg-red-600 text-white' : 'bg-eerie text-white'
                : s === 'urgent' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white text-eerie/55 border border-alice'
            }`}>
            {s === 'all'    ? `Toutes (${counts.all})`
            : s === 'urgent' ? `🔴 Urgentes (${counts.urgent})`
            : `${STATUS_LABELS[s]} (${counts[s]})`}
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
            <div key={order.id} onClick={() => setSelected(order)}
              className={`card cursor-pointer active:scale-[0.98] transition-transform ${
                order.status !== 'done' ? getUrgencyClass(order.pickupDate) : ''
              } pl-4`}>
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
                <div className="flex flex-col gap-2 items-end flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}>
                  {STATUS_NEXT[order.status] && (
                    <button
                      onClick={() => advanceStatus(order.id, order.status).then(() => toast.success('Mis à jour'))}
                      className="text-xs bg-honeydew text-eerie rounded-xl px-3 py-1.5 font-medium active:scale-95 transition-transform whitespace-nowrap">
                      Avancer →
                    </button>
                  )}
                  <button onClick={() => handleDelete(order.id)}
                    className="text-xs text-red-400 font-medium py-1">
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
