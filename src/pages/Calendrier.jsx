import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, differenceInHours,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeOrders, setStatus, isAssignedTo } from '../lib/orders'
import { getUrgencyHours } from '../lib/settings'
import { useRole } from '../context/RoleContext'
import AppLayout from '../components/layout/AppLayout'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function dayBadge(orders) {
  if (orders.length === 0) return null
  if (orders.some(o => o.status === 'todo'))       return { bg: '#FEE2E2', color: '#b91c1c' }
  if (orders.some(o => o.status === 'inprogress')) return { bg: '#FEF3C7', color: '#92400e' }
  return                                                  { bg: '#DCFCE7', color: '#166534' }
}

function urgencyColor(pickupDate) {
  const h = differenceInHours(parseISO(pickupDate), new Date())
  const t = getUrgencyHours()
  if (h < 0)      return '#EF4444'
  if (h < t)      return '#EF4444'
  if (h < t + 24) return '#F59E0B'
  return '#22C55E'
}

const PRODUCTION_STATUSES = ['todo', 'inprogress', 'ready']
const STATUS_PICKER = {
  todo:       { label: 'Pas commencé', activeBg: '#18181B', activeColor: '#FFFFFF', idleBg: '#F1EFE8', idleColor: '#71717A' },
  inprogress: { label: 'En cours',     activeBg: '#FEF3C7', activeColor: '#92400e', idleBg: '#F8F7F3', idleColor: '#71717A' },
  ready:      { label: 'Prêt ✓',       activeBg: '#E8E27A', activeColor: '#18181B', idleBg: '#F8F7F3', idleColor: '#71717A' },
}

export default function Calendrier() {
  const { role }   = useRole()
  const pole       = role === 'boulangerie' ? 'boulangerie' : 'patissiere'

  const [allOrders, setAllOrders]     = useState([])
  const [viewMonth, setViewMonth]     = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [expandedId, setExpandedId]   = useState(null)

  useEffect(() => subscribeOrders(setAllOrders), [])

  const poleOrders = useMemo(
    () => allOrders.filter(o => o.status !== 'done' && isAssignedTo(o, pole)),
    [allOrders, pole]
  )

  const dayOrders = useMemo(() =>
    poleOrders
      .filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), selectedDay))
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate)),
    [poleOrders, selectedDay]
  )

  const calDays = useMemo(() => {
    const mStart = startOfMonth(viewMonth)
    const mEnd   = endOfMonth(viewMonth)
    return eachDayOfInterval({
      start: startOfWeek(mStart, { weekStartsOn: 1 }),
      end:   endOfWeek(mEnd,     { weekStartsOn: 1 }),
    })
  }, [viewMonth])

  const monthOrders = useMemo(
    () => poleOrders.filter(o => o.pickupDate && isSameMonth(parseISO(o.pickupDate), viewMonth)),
    [poleOrders, viewMonth]
  )

  const ordersByDay = useMemo(() => {
    const map = {}
    monthOrders.forEach(o => {
      const key = format(parseISO(o.pickupDate), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(o)
    })
    return map
  }, [monthOrders])

  const activeDays = useMemo(
    () => new Set(monthOrders.map(o => format(parseISO(o.pickupDate), 'yyyy-MM-dd'))),
    [monthOrders]
  )

  return (
    <AppLayout title="Calendrier">

      {/* Calendrier mensuel */}
      <div
        className="rounded-3xl p-5 mb-5 animate-fade-up"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E5E4', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
      >
        {/* Navigation mois */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { setViewMonth(m => subMonths(m, 1)); setExpandedId(null) }}
            className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-black/5 text-xl"
            style={{ color: '#71717A' }}
          >‹</button>
          <p className="font-semibold capitalize text-ink" style={{ fontSize: '0.95rem' }}>
            {format(viewMonth, 'MMMM yyyy', { locale: fr })}
          </p>
          <button
            onClick={() => { setViewMonth(m => addMonths(m, 1)); setExpandedId(null) }}
            className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-black/5 text-xl"
            style={{ color: '#71717A' }}
          >›</button>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4 mb-4 px-1 flex-wrap">
          {[
            { color: '#EF4444', label: 'À faire' },
            { color: '#F59E0B', label: 'En cours' },
            { color: '#22C55E', label: 'Tout prêt' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span style={{ fontSize: '10px', color: '#71717A' }}>{item.label}</span>
            </div>
          ))}
          <span className="ml-auto" style={{ fontSize: '10px', color: '#71717A' }}>
            <span className="font-semibold text-ink">{monthOrders.length}</span> cmd ·{' '}
            <span className="font-semibold text-ink">{activeDays.size}</span> jour{activeDays.size > 1 ? 's' : ''}
          </span>
        </div>

        {/* Labels colonnes */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d, i) => (
            <p key={i} className="text-center py-1" style={{ fontSize: '10px', fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {d}
            </p>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7 gap-y-1">
          {calDays.map(day => {
            const inMonth    = isSameMonth(day, viewMonth)
            const key        = format(day, 'yyyy-MM-dd')
            const dayOrd     = inMonth ? (ordersByDay[key] ?? []) : []
            const badge      = dayBadge(dayOrd)
            const isSelected = isSameDay(day, selectedDay)
            const isToday    = isSameDay(day, new Date())

            return (
              <button
                key={day.toISOString()}
                disabled={!inMonth}
                onClick={() => { setSelectedDay(day); setExpandedId(null) }}
                className="flex flex-col items-center py-1.5 rounded-2xl transition-all active:scale-95"
                style={{
                  backgroundColor: isSelected ? '#18181B' : isToday ? '#F7F4C8' : 'transparent',
                  opacity: inMonth ? 1 : 0.12,
                }}
              >
                <span
                  className="text-sm font-medium leading-tight"
                  style={{ color: isSelected ? '#FFFFFF' : '#18181B' }}
                >
                  {format(day, 'd')}
                </span>
                <div className="h-4 flex items-center justify-center mt-0.5">
                  {badge ? (
                    <span
                      className="text-[9px] font-bold flex items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : badge.bg,
                        color: isSelected ? '#fff' : badge.color,
                        minWidth: 16, height: 16, padding: '0 4px', borderRadius: 9999,
                      }}
                    >
                      {dayOrd.length}
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Liste commandes du jour */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-ink capitalize" style={{ fontSize: '0.95rem' }}>
          {isSameDay(selectedDay, new Date())
            ? "Aujourd'hui"
            : format(selectedDay, 'd MMMM', { locale: fr })}
        </p>
        {dayOrders.length > 0 && (
          <span className="label-xs">{dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {dayOrders.length === 0 ? (
        <div
          className="rounded-3xl text-center py-14"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E5E4' }}
        >
          <p className="text-2xl mb-2">—</p>
          <p className="font-semibold text-ink mb-1">Rien ce jour-là</p>
          <p className="text-sm" style={{ color: '#71717A' }}>Sélectionne un jour coloré dans le calendrier</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayOrders.map(order => (
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
      className="rounded-3xl overflow-hidden"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E5E4', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
    >
      <div className="h-1 rounded-t-3xl" style={{ backgroundColor: urgencyColor(order.pickupDate) }} />

      <button
        className="w-full px-5 py-4 flex items-start gap-3 text-left active:bg-black/[0.01] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-shrink-0 text-right" style={{ minWidth: 44 }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1, marginBottom: 4 }}>
            Retrait
          </p>
          <p className="font-semibold text-ink tabular-nums text-lg leading-none">
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </p>
        </div>

        <div className="w-px self-stretch" style={{ backgroundColor: '#E7E5E4' }} />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm truncate">{order.clientName}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: '#71717A' }}>{order.articles}</p>
          <div className="mt-2">
            <StatusPill status={order.status} />
          </div>
        </div>

        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 self-center transition-transform duration-200"
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

          {order.notes && (
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <span className="text-base mr-2">⚠️</span>
              <p className="text-xs font-medium inline" style={{ color: '#92400e' }}>{order.notes}</p>
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
    done:       { label: 'Récupéré', bg: '#F4F4F5', color: 'rgba(24,24,27,0.4)' },
    cancelled:  { label: 'Annulée',  bg: '#FEE2E2', color: '#b91c1c' },
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
