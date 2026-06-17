import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay,
  startOfWeek, addDays, differenceInHours,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeOrders, setStatus, isAssignedTo } from '../../lib/orders'
import { getPrenom, getUrgencyHours } from '../../lib/settings'
import AppLayout from '../../components/layout/AppLayout'

const PRODUCTION_STATUSES = ['todo', 'inprogress', 'ready']
const STATUS_PICKER = {
  todo:       { label: 'Pas commencé', activeBg: '#18181B', activeColor: '#FFFFFF', idleBg: '#F1EFE8', idleColor: '#71717A' },
  inprogress: { label: 'En cours',     activeBg: '#FEF3C7', activeColor: '#92400e', idleBg: '#F8F7F3', idleColor: '#71717A' },
  ready:      { label: 'Prêt ✓',       activeBg: '#E8E27A', activeColor: '#18181B', idleBg: '#F8F7F3', idleColor: '#71717A' },
}

function urgencyColor(pickupDate) {
  const h = differenceInHours(parseISO(pickupDate), new Date())
  const t = getUrgencyHours()
  if (h < 0)      return '#EF4444'
  if (h < t)      return '#EF4444'
  if (h < t + 24) return '#F59E0B'
  return '#22C55E'
}

// ── Carte résumé ──────────────────────────────────────────────────────────
function SummaryCard({ orders }) {
  const weekStart  = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd    = addDays(weekStart, 6)
  const weekOrders = orders.filter(o => {
    if (!o.pickupDate) return false
    const d = parseISO(o.pickupDate)
    return d >= weekStart && d <= weekEnd
  })
  const todoCount = orders.filter(o => o.status === 'todo' || o.status === 'inprogress').length
  const prenom    = getPrenom()

  return (
    <div className="mb-6 animate-fade-up">
      <p className="text-sm mb-1" style={{ color: '#71717A' }}>
        {prenom ? `Bonjour ${prenom} 👋` : 'Voici ton résumé 👋'}
      </p>
      <h2 className="font-serif text-ink leading-tight mb-5" style={{ fontSize: '1.75rem' }}>
        {weekOrders.length === 0
          ? 'Aucune commande\ncette semaine.'
          : todoCount > 3
          ? 'Beaucoup à faire,\nbonne organisation !'
          : 'Belle activité,\ntout est sous contrôle.'}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-3xl p-5 flex flex-col justify-between animate-fade-up delay-50"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E5E4', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', minHeight: 108 }}
        >
          <p className="label-xs">Semaine</p>
          <div>
            <p className="font-serif leading-none mt-2" style={{ fontSize: '2.5rem', color: '#18181B' }}>
              {weekOrders.length}
            </p>
            <p className="text-xs mt-1" style={{ color: '#71717A' }}>commande{weekOrders.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div
          className="rounded-3xl p-5 flex flex-col justify-between animate-fade-up delay-100"
          style={{
            backgroundColor: todoCount > 3 ? '#FEE2E2' : todoCount > 0 ? '#F7F4C8' : '#DCFCE7',
            border: '1px solid #E7E5E4',
            boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
            minHeight: 108,
          }}
        >
          <p className="label-xs" style={{ color: todoCount > 3 ? '#b91c1c' : '#71717A' }}>
            {todoCount > 3 ? '⚠ Urgent' : 'Production'}
          </p>
          <div>
            <p
              className="font-serif leading-none mt-2"
              style={{ fontSize: '2.5rem', color: todoCount > 3 ? '#b91c1c' : '#18181B' }}
            >
              {todoCount}
            </p>
            <p className="text-xs mt-1" style={{ color: todoCount > 3 ? '#b91c1c' : '#71717A' }}>à produire</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard boulangerie ─────────────────────────────────────────────────
export default function BoulangerieDashboard() {
  const [orders, setOrders]         = useState([])
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => subscribeOrders(setOrders), [])

  const ws = startOfWeek(new Date(), { weekStartsOn: 1 })
  const we = addDays(ws, 6)

  const poleOrders = useMemo(
    () => orders.filter(o => o.status !== 'done' && isAssignedTo(o, 'boulangerie')),
    [orders]
  )

  const weekOrders = useMemo(() =>
    poleOrders
      .filter(o => {
        if (!o.pickupDate) return false
        const d = parseISO(o.pickupDate)
        return d >= ws && d <= we
      })
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate)),
    [poleOrders]
  )

  return (
    <AppLayout title="Boulangerie">

      <SummaryCard orders={poleOrders} />

      <div className="flex items-center justify-between mb-4 animate-fade-up delay-150">
        <p className="font-semibold text-ink" style={{ fontSize: '0.95rem' }}>
          En cours cette semaine
        </p>
        <span className="label-xs">{weekOrders.length} cmd</span>
      </div>

      {weekOrders.length === 0 ? (
        <div
          className="rounded-3xl text-center py-14 animate-fade-up delay-200"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E5E4' }}
        >
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm" style={{ color: '#71717A' }}>Rien cette semaine</p>
        </div>
      ) : (
        <div className="space-y-3">
          {weekOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId(prev => prev === order.id ? null : order.id)}
            />
          ))}
        </div>
      )}

    </AppLayout>
  )
}

// ── Carte commande ────────────────────────────────────────────────────────
function OrderCard({ order, expanded, onToggle }) {
  const [busy, setBusy] = useState(false)

  const handleSetStatus = async (newStatus) => {
    if (newStatus === order.status || busy) return
    setBusy(true)
    try {
      await setStatus(order.id, newStatus)
      if (newStatus === 'ready') toast.success('✓ Prêt — vendeur notifié')
    } finally { setBusy(false) }
  }

  return (
    <div
      className="rounded-3xl overflow-hidden animate-fade-up"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E5E4', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
    >
      <div className="h-1 rounded-t-3xl" style={{ backgroundColor: urgencyColor(order.pickupDate) }} />

      <button
        className="w-full px-5 py-4 flex items-center gap-3 text-left active:bg-black/[0.01] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm truncate">{order.clientName}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: '#71717A' }}>{order.articles}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-xs font-semibold tabular-nums" style={{ color: '#71717A' }}>
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </span>
          <StatusPill status={order.status} />
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-4 space-y-4" style={{ borderTop: '1px solid #F1EFE8' }}>

          <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#F1EFE8' }}>
            <p className="label-xs mb-1">Commande</p>
            <p className="font-medium text-ink text-sm leading-relaxed">{order.articles}</p>
          </div>

          <div className="px-1">
            <p className="label-xs mb-1">Retrait</p>
            <p className="text-sm font-medium text-ink capitalize">
              {format(parseISO(order.pickupDate), "EEEE d MMMM 'à' HH:mm", { locale: fr })}
            </p>
          </div>

          {order.notes && (
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p className="text-xs font-medium" style={{ color: '#92400e' }}>⚠ {order.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1">
            {PRODUCTION_STATUSES.map(s => {
              const cfg      = STATUS_PICKER[s]
              const isActive = order.status === s
              return (
                <button
                  key={s}
                  onClick={() => handleSetStatus(s)}
                  disabled={busy}
                  className="rounded-2xl py-3 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    backgroundColor: isActive ? cfg.activeBg : cfg.idleBg,
                    color:           isActive ? cfg.activeColor : cfg.idleColor,
                    border:          isActive ? 'none' : '1px solid #E7E5E4',
                  }}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>

        </div>
      )}
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    todo:       { label: 'À faire',  bg: '#F1EFE8', color: 'rgba(24,24,27,0.55)' },
    inprogress: { label: 'En cours', bg: '#FEF3C7', color: '#92400e' },
    ready:      { label: 'Prêt ✓',   bg: '#DCFCE7', color: '#166534' },
  }
  const c = map[status] ?? map.todo
  return (
    <span
      className="inline-flex text-[10px] font-semibold"
      style={{ backgroundColor: c.bg, color: c.color, padding: '0.2rem 0.6rem', borderRadius: 9999 }}
    >
      {c.label}
    </span>
  )
}
