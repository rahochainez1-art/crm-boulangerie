import { useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  format, parseISO, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { subscribeOrders, setStatus, isAssignedTo } from '../lib/orders'
import { useRole } from '../context/RoleContext'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const PRODUCTION_STATUSES = ['todo', 'inprogress', 'ready']
const STATUS_PICKER = {
  todo:       { label: 'Pas commencé', activeBg: '#432F2E', activeColor: '#FFFFFF', idleBg: 'rgba(67,47,46,0.08)', idleColor: '#8A7060' },
  inprogress: { label: 'En cours',     activeBg: 'rgba(255,240,181,0.9)', activeColor: '#432F2E', idleBg: 'rgba(67,47,46,0.08)', idleColor: '#8A7060' },
  ready:      { label: 'Tout prêt',    activeBg: '#E5F0F5', activeColor: '#432F2E', idleBg: 'rgba(67,47,46,0.08)', idleColor: '#8A7060' },
}
const STATUS_PILL = {
  todo:       { label: 'À faire',   bg: 'rgba(67,47,46,0.10)',   color: '#432F2E' },
  inprogress: { label: 'En cours',  bg: 'rgba(255,240,181,0.6)', color: '#432F2E' },
  ready:      { label: 'Tout prêt', bg: '#E5F0F5',               color: '#432F2E' },
  done:       { label: 'Récupérée', bg: 'rgba(67,47,46,0.06)',   color: '#8A7060' },
  cancelled:  { label: 'Annulée',   bg: 'rgba(67,47,46,0.14)',   color: '#432F2E' },
}
const LEGEND = [
  { label: 'À faire',   dot: '#432F2E', bg: 'rgba(67,47,46,0.10)' },
  { label: 'En cours',  dot: '#D9A900', bg: 'rgba(255,240,181,0.6)' },
  { label: 'Tout prêt', dot: '#7A8C94', bg: '#E5F0F5' },
]

function StatusPill({ status }) {
  const c = STATUS_PILL[status] ?? STATUS_PILL.todo
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: c.bg, color: c.color, padding: '0.2rem 0.6rem', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 600, fontFamily: 'Satoshi', whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  )
}

export default function Calendrier() {
  const { role } = useRole()
  const pole     = role === 'boulangerie' ? 'boulangerie' : 'patissiere'

  const location    = useLocation()
  const initialDate = location.state?.date ? parseISO(location.state.date) : new Date()

  const [allOrders, setAllOrders]     = useState([])
  const [viewMonth, setViewMonth]     = useState(initialDate)
  const [selectedDay, setSelectedDay] = useState(initialDate)
  const [expandedId, setExpandedId]   = useState(null)

  useEffect(() => subscribeOrders(setAllOrders), [])

  // Ouvre automatiquement le détail si une commande précise est passée
  useEffect(() => {
    if (!location.state?.orderId || allOrders.length === 0) return
    const target = allOrders.find(o => o.id === location.state.orderId)
    if (target) setExpandedId(target.id)
  }, [location.state?.orderId, allOrders])

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

  const activeDaysCount = useMemo(
    () => new Set(monthOrders.map(o => format(parseISO(o.pickupDate), 'yyyy-MM-dd'))).size,
    [monthOrders]
  )

  const selectedLabel = useMemo(() => {
    const label = format(selectedDay, 'EEEE d MMMM', { locale: fr })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [selectedDay])

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#F5F2EB' }}>
      <div className="px-6" style={{ paddingTop: 'max(28px, env(safe-area-inset-top))', paddingBottom: 112 }}>

        {/* ── Header ── */}
        <div className="mb-6 animate-fade-up">
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
            Au Grand Jour
          </p>
          <h1 style={{ fontSize: 'clamp(2.25rem, 9vw, 2.75rem)', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 14 }}>
            Calendrier
          </h1>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 9999, backgroundColor: '#F5F2EB', border: '1px solid rgba(67,47,46,0.1)', flexShrink: 0 }}>
              <Calendar size={15} color="#432F2E" strokeWidth={1.9} />
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi' }}>
              {monthOrders.length} commande{monthOrders.length > 1 ? 's' : ''} · {activeDaysCount} jour{activeDaysCount > 1 ? 's' : ''} planifié{activeDaysCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* ── Carte calendrier ── */}
        <div
          className="rounded-[28px] p-5 mb-6 animate-fade-up delay-100"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.08)', boxShadow: '0 2px 20px rgba(67,47,46,0.05)' }}
        >
          {/* Navigation mois */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => { setViewMonth(m => subMonths(m, 1)); setExpandedId(null) }}
              className="flex items-center justify-center active:scale-95 transition-transform"
              style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: 'rgba(67,47,46,0.06)', border: 'none' }}
            >
              <ChevronLeft size={17} color="#432F2E" strokeWidth={2} />
            </button>
            <p className="capitalize" style={{ fontSize: '1.375rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>
              {format(viewMonth, 'MMMM yyyy', { locale: fr })}
            </p>
            <button
              onClick={() => { setViewMonth(m => addMonths(m, 1)); setExpandedId(null) }}
              className="flex items-center justify-center active:scale-95 transition-transform"
              style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: 'rgba(67,47,46,0.06)', border: 'none' }}
            >
              <ChevronRight size={17} color="#432F2E" strokeWidth={2} />
            </button>
          </div>

          {/* Légende statuts */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {LEGEND.map(l => (
              <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: l.bg, padding: '0.3rem 0.65rem', borderRadius: 9999 }}>
                <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: l.dot, flexShrink: 0 }} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#432F2E', fontFamily: 'Satoshi' }}>{l.label}</span>
              </span>
            ))}
          </div>

          {/* Labels colonnes */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d, i) => (
              <p key={i} className="text-center py-1" style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#B0A090', fontFamily: 'Satoshi' }}>
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
              const isSelected = isSameDay(day, selectedDay)
              const isToday    = isSameDay(day, new Date())

              return (
                <button
                  key={day.toISOString()}
                  disabled={!inMonth}
                  onClick={() => { setSelectedDay(day); setExpandedId(null) }}
                  className="flex flex-col items-center py-2 transition-all active:scale-95"
                  style={{
                    borderRadius: 14,
                    backgroundColor: isSelected ? '#432F2E' : isToday ? '#FFF0B5' : 'transparent',
                    opacity: inMonth ? 1 : 0.15,
                  }}
                >
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, fontFamily: 'Satoshi', color: isSelected ? '#FFFFFF' : '#111111', lineHeight: 1.2 }}>
                    {format(day, 'd')}
                  </span>
                  <div className="h-4 flex items-center justify-center mt-0.5">
                    {dayOrd.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.5625rem', fontWeight: 700, fontFamily: 'Satoshi',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isSelected ? 'rgba(245,242,235,0.3)' : '#FFF0B5',
                          color: isSelected ? '#FFFFFF' : '#432F2E',
                          minWidth: 15, height: 15, padding: '0 3px', borderRadius: 9999,
                        }}
                      >
                        {dayOrd.length}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Section jour sélectionné ── */}
        <div className="flex items-center justify-between mb-3 animate-fade-up delay-150">
          <div>
            <p className="capitalize" style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>
              {selectedLabel}
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 2 }}>
              {dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}
            </p>
          </div>
          {dayOrders.length > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#432F2E', fontFamily: 'Satoshi', backgroundColor: '#FFF0B5', padding: '0.35rem 0.75rem', borderRadius: 9999, whiteSpace: 'nowrap' }}>
              {dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {dayOrders.length === 0 ? (
          <div
            className="rounded-[24px] text-center py-14 animate-fade-up delay-200"
            style={{ backgroundColor: 'rgba(229,240,245,0.5)', border: '1px solid rgba(67,47,46,0.06)' }}
          >
            <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Aucune commande prévue ce jour.</p>
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

      </div>
    </div>
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
      className="rounded-[24px] overflow-hidden"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.08)', boxShadow: '0 2px 16px rgba(67,47,46,0.05)' }}
    >
      <button
        className="w-full px-5 py-4 flex items-start gap-4 text-left active:bg-black/[0.01] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-shrink-0" style={{ minWidth: 46 }}>
          <p style={{ fontSize: '0.625rem', fontWeight: 600, color: '#B0A090', fontFamily: 'Satoshi', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1, marginBottom: 5 }}>
            Retrait
          </p>
          <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </p>
        </div>

        <div className="w-px self-stretch" style={{ backgroundColor: 'rgba(67,47,46,0.1)' }} />

        <div className="flex-1 min-w-0">
          <p style={{ fontWeight: 700, color: '#111111', fontSize: '0.9375rem', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.clientName}
          </p>
          <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
            {order.articles}
          </p>
          <div className="mt-2.5">
            <StatusPill status={order.status} />
          </div>
        </div>

        <ChevronRight
          size={15}
          color="#B0A090"
          strokeWidth={2.2}
          className="flex-shrink-0 self-center transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1 space-y-3" style={{ borderTop: '1px solid rgba(67,47,46,0.08)' }}>
          {order.clientPhone && (
            <a
              href={`tel:${order.clientPhone}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-2 mt-4 active:opacity-70"
              style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#432F2E', fontFamily: 'Satoshi' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {order.clientPhone}
            </a>
          )}
          {order.notes && (
            <div className="rounded-2xl px-4 py-3 mt-4" style={{ backgroundColor: 'rgba(255,240,181,0.4)', border: '1px solid rgba(67,47,46,0.1)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#432F2E', fontFamily: 'Satoshi' }}>⚠ {order.notes}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 pt-3">
            {PRODUCTION_STATUSES.map(s => {
              const cfg      = STATUS_PICKER[s]
              const isActive = order.status === s
              return (
                <button
                  key={s}
                  onClick={() => handleSetStatus(s)}
                  disabled={busy}
                  className="transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    padding: '0.75rem 0.5rem', borderRadius: 12,
                    backgroundColor: isActive ? cfg.activeBg : cfg.idleBg,
                    color: isActive ? cfg.activeColor : cfg.idleColor,
                    fontWeight: 600, fontSize: '0.75rem', border: 'none', cursor: 'pointer',
                    fontFamily: 'Satoshi', transition: 'background-color 0.15s, color 0.15s',
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
