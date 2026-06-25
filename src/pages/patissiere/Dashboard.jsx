import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, addDays,
  differenceInHours,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeOrders, setStatus, isAssignedTo } from '../../lib/orders'
import { getPrenom, getUrgencyHours } from '../../lib/settings'
import { useNewOrderNotification } from '../../hooks/useNewOrderNotification'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const PRODUCTION_STATUSES = ['todo', 'inprogress', 'ready']
const STATUS_PICKER = {
  todo:       { label: 'Pas commencé', activeBg: '#111111', activeColor: '#FFFFFF', idleBg: 'rgba(67,47,46,0.06)', idleColor: '#8A7060' },
  inprogress: { label: 'En cours',     activeBg: '#FEFCE8', activeColor: '#854D0E', idleBg: 'rgba(67,47,46,0.06)', idleColor: '#8A7060' },
  ready:      { label: 'Prêt ✓',       activeBg: '#D1FAE5', activeColor: '#065F46', idleBg: 'rgba(67,47,46,0.06)', idleColor: '#8A7060' },
}

function urgencyColor(pickupDate) {
  const h = differenceInHours(parseISO(pickupDate), new Date())
  const t = getUrgencyHours()
  if (h < 0)      return '#EF4444'
  if (h < t)      return '#EF4444'
  if (h < t + 24) return '#F59E0B'
  return '#10B981'
}

// ── Illustration ──────────────────────────────────────────────────────────
function IllustrationBoulangerie() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <path d="M108 22 C140 14 182 28 192 72 C202 116 180 155 148 165 C116 175 76 160 64 128 C52 96 60 50 86 34 C94 28 100 24 108 22Z" fill="#FFF0B5"/>
      <path d="M52 150 C63 133 96 130 106 154 C116 178 92 196 68 189 C44 182 41 167 52 150Z" fill="#FAE0C8"/>
      <ellipse cx="108" cy="176" rx="30" ry="5.5" fill="white" stroke="#432F2E" strokeWidth="1.9"/>
      <rect x="104" y="150" width="8" height="27" rx="4" fill="white" stroke="#432F2E" strokeWidth="1.9"/>
      <ellipse cx="108" cy="150" rx="24" ry="4.5" fill="white" stroke="#432F2E" strokeWidth="1.9"/>
      <ellipse cx="108" cy="106" rx="27" ry="5" fill="#FEFEFE" stroke="#432F2E" strokeWidth="1.9"/>
      <path d="M81 106 L81 150" stroke="#432F2E" strokeWidth="1.9"/>
      <path d="M135 106 L135 150" stroke="#432F2E" strokeWidth="1.9"/>
      <path d="M81 150 Q108 156 135 150" stroke="#432F2E" strokeWidth="1.9" fill="none"/>
      <path d="M81 127 C85 121 89 133 93 127 C97 121 101 133 105 127 C109 121 113 133 117 127 C121 121 125 133 129 127 L135 127" stroke="#432F2E" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <path d="M108 99 C106 94 106 89 109 86 C112 83 116 85 115 89 C114 93 110 92 111 88" stroke="#432F2E" strokeWidth="1.9" strokeLinecap="round" fill="none"/>
      <circle cx="108" cy="101" r="2.5" fill="white" stroke="#432F2E" strokeWidth="1.6"/>
      <path d="M136 154 C138 138 158 129 173 136 C184 141 186 158 176 168 C166 178 140 174 136 160 Z" fill="white" stroke="#432F2E" strokeWidth="1.9" strokeLinejoin="round"/>
      <path d="M147 136 C145 148 146 159 147 168" stroke="#432F2E" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M159 131 C157 144 158 156 159 166" stroke="#432F2E" strokeWidth="1.4" strokeLinecap="round"/>
      <ellipse cx="120" cy="180" rx="14" ry="9.5" fill="white" stroke="#432F2E" strokeWidth="1.9"/>
      <path d="M109 179 C113 173 128 173 131 179" stroke="#432F2E" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// ── Icônes KPI ────────────────────────────────────────────────────────────
const IconTodo = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4l3 3"/>
  </svg>
)
const IconHourglass = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 22h14M5 2h14"/>
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
  </svg>
)
const IconCheckCircle = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8"  y1="2" x2="8"  y2="6"/>
    <line x1="3"  y1="10" x2="21" y2="10"/>
  </svg>
)

// ── KPI Strip (4 colonnes) ─────────────────────────────────────────────────
function KpiStrip({ orders }) {
  const today    = new Date()
  const ws       = startOfWeek(today, { weekStartsOn: 1 })
  const we       = addDays(ws, 6)

  const weekCount = orders.filter(o => {
    if (!o.pickupDate) return false
    const d = parseISO(o.pickupDate)
    return d >= ws && d <= we
  }).length
  const todoCount = orders.filter(o => o.status === 'todo').length
  const inprog    = orders.filter(o => o.status === 'inprogress').length
  const ready     = orders.filter(o => o.status === 'ready').length

  const kpis = [
    { label: 'Semaine',   value: weekCount, iconBg: '#FFF8D6', iconColor: '#432F2E', Icon: IconCalendar },
    { label: 'À faire',   value: todoCount, iconBg: '#FFF8D6', iconColor: '#92400E', Icon: IconTodo },
    { label: 'En cours',  value: inprog,    iconBg: '#FEF3C7', iconColor: '#92400E', Icon: IconHourglass },
    { label: 'Prêtes',    value: ready,     iconBg: '#DCFCE7', iconColor: '#166534', Icon: IconCheckCircle },
  ]

  return (
    <div className="grid grid-cols-4 gap-2 mb-5">
      {kpis.map((k, i) => (
        <div
          key={k.label}
          className="rounded-[16px] p-3 flex flex-col items-center animate-fade-up"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(67,47,46,0.07)',
            boxShadow: '0 2px 12px rgba(67,47,46,0.05)',
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <div
            className="flex items-center justify-center mb-2"
            style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: k.iconBg, color: k.iconColor }}
          >
            <k.Icon />
          </div>
          <p style={{ fontSize: '0.5625rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi', textAlign: 'center', lineHeight: 1.3, marginBottom: 3 }}>
            {k.label}
          </p>
          <p className="font-display" style={{ fontSize: '1.5rem', color: '#111111', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {k.value}
          </p>
          <p style={{ fontSize: '0.5rem', color: '#B0A090', fontFamily: 'Satoshi', marginTop: 2 }}>
            commandes
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Calendrier mensuel ────────────────────────────────────────────────────
function MonthCalendar({ orders, viewMonth, setViewMonth, selectedDay, onSelectDay }) {
  const mStart   = startOfMonth(viewMonth)
  const mEnd     = endOfMonth(viewMonth)
  const calStart = startOfWeek(mStart, { weekStartsOn: 1 })
  const calEnd   = endOfWeek(mEnd,     { weekStartsOn: 1 })
  const days     = eachDayOfInterval({ start: calStart, end: calEnd })
  const monthOrders = orders.filter(o => o.pickupDate && isSameMonth(parseISO(o.pickupDate), viewMonth))

  return (
    <div
      className="rounded-[20px] p-5 mb-5 animate-fade-up delay-100"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(67,47,46,0.07)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(67,47,46,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { setViewMonth(m => subMonths(m, 1)); onSelectDay(null) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-black/5"
          style={{ color: '#8A7060', fontSize: '1.25rem' }}
        >‹</button>
        <p className="capitalize" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>
          {format(viewMonth, 'MMMM yyyy', { locale: fr })}
        </p>
        <button
          onClick={() => { setViewMonth(m => addMonths(m, 1)); onSelectDay(null) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-black/5"
          style={{ color: '#8A7060', fontSize: '1.25rem' }}
        >›</button>
      </div>

      <div className="flex items-center gap-1.5 mb-4">
        <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: '#EDD83D', display: 'block' }} />
        <span style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>
          <span style={{ fontWeight: 700, color: '#111111' }}>{monthOrders.length}</span>
          {' '}commande{monthOrders.length > 1 ? 's' : ''} ce mois
        </span>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <p key={i} className="text-center py-1" style={{ fontSize: '9px', fontWeight: 700, color: '#B0A090', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Satoshi' }}>
            {d}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map(day => {
          const inMonth    = isSameMonth(day, viewMonth)
          const count      = inMonth ? orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), day)).length : 0
          const isSelected = selectedDay && isSameDay(day, selectedDay)
          const isToday    = isSameDay(day, new Date())

          return (
            <button
              key={day.toISOString()}
              disabled={!inMonth}
              onClick={() => onSelectDay(isSelected ? null : day)}
              className="flex flex-col items-center py-1.5 rounded-xl transition-all active:scale-95"
              style={{
                backgroundColor: isSelected ? '#432F2E' : isToday ? '#FFF0B5' : 'transparent',
                opacity: inMonth ? 1 : 0.12,
              }}
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: isSelected || isToday ? 700 : 500, color: isSelected ? '#FFFFFF' : '#111111', fontFamily: 'Satoshi', lineHeight: 1.3 }}>
                {format(day, 'd')}
              </span>
              <div className="h-3 flex items-center justify-center mt-0.5">
                {count > 0 && (
                  <span style={{ fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? 'rgba(255,255,255,0.22)' : '#EDD83D', color: isSelected ? '#fff' : '#4A4E10', minWidth: 14, height: 14, padding: '0 3px', borderRadius: 9999, fontFamily: 'Satoshi' }}>
                    {count}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Carte commande production ─────────────────────────────────────────────
function OrderCard({ order, isNew, expanded, onToggle }) {
  const [busy, setBusy] = useState(false)

  const handleSetStatus = async (newStatus) => {
    if (newStatus === order.status || busy) return
    setBusy(true)
    try {
      await setStatus(order.id, newStatus)
      if (newStatus === 'ready') toast.success('✓ Prêt — vendeur notifié')
    } finally { setBusy(false) }
  }

  const barColor = urgencyColor(order.pickupDate)

  return (
    <div
      className="rounded-[18px] overflow-hidden transition-all duration-500 animate-fade-up"
      style={{
        backgroundColor: '#FFFFFF',
        border: isNew ? `2px solid #EDD83D` : '1px solid rgba(67,47,46,0.08)',
        borderLeft: `3px solid ${barColor}`,
        boxShadow: isNew
          ? '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(237,216,61,0.15)'
          : '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(67,47,46,0.06)',
      }}
    >
      <button
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-black/[0.01]"
        onClick={onToggle}
      >
        {/* Heure badge */}
        <div className="flex-shrink-0" style={{ backgroundColor: '#FFF0B5', padding: '0.3rem 0.55rem', borderRadius: 10 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#432F2E', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums' }}>
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p style={{ fontWeight: 700, color: '#111111', fontSize: '0.9375rem', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.articles}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
            {order.clientName}
          </p>
        </div>

        <StatusPill status={order.status} />

        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#C0B8A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-4 space-y-4" style={{ borderTop: '1px solid rgba(67,47,46,0.07)' }}>

          <div>
            <p className="label-xs mb-1.5">Articles</p>
            <p style={{ fontSize: '0.875rem', color: '#111111', lineHeight: 1.5, fontFamily: 'Satoshi', fontWeight: 500 }}>
              {order.articles}
            </p>
          </div>

          {order.notes && (
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E', fontFamily: 'Satoshi' }}>⚠ {order.notes}</p>
            </div>
          )}

          {/* Sélecteur de statut */}
          <div className="grid grid-cols-3 gap-2 pt-1">
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
                    padding: '0.75rem 0.5rem',
                    borderRadius: 12,
                    backgroundColor: isActive ? cfg.activeBg : cfg.idleBg,
                    color:           isActive ? cfg.activeColor : cfg.idleColor,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Satoshi',
                    transition: 'background-color 0.15s, color 0.15s',
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
    todo:       { label: 'À faire',  bg: '#FEFCE8', color: '#854D0E' },
    inprogress: { label: 'En cours', bg: '#FEF3C7', color: '#92400E' },
    ready:      { label: 'Prêt ✓',   bg: '#D1FAE5', color: '#065F46' },
  }
  const c = map[status] ?? map.todo
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      backgroundColor: c.bg, color: c.color,
      padding: '0.2rem 0.6rem', borderRadius: 9999,
      fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'Satoshi', letterSpacing: '0.01em',
    }}>
      {c.label}
    </span>
  )
}

// ── Bannière nouvelle commande ────────────────────────────────────────────
function NewOrderBanner({ newOrders, isUnlocked, onUnlock, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000)
    return () => clearTimeout(t)
  }, [newOrders.length])

  const last = newOrders[newOrders.length - 1]

  return (
    <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto px-4"
      style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
      <div className="rounded-[20px] px-5 py-4 flex items-start gap-3 animate-slide-up"
        style={{ backgroundColor: '#111111', boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#EDD83D', marginBottom: 3, fontFamily: 'Satoshi' }}>
            {newOrders.length > 1 ? `${newOrders.length} nouvelles commandes` : 'Nouvelle commande'}
          </p>
          <p style={{ fontWeight: 700, color: '#FFFFFF', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {last.clientName}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'Satoshi', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {last.articles}
          </p>
          {!isUnlocked && (
            <button
              onTouchStart={(e) => { e.preventDefault(); onUnlock() }}
              onClick={onUnlock}
              style={{ marginTop: 8, fontSize: '0.6875rem', fontWeight: 600, padding: '0.3rem 0.7rem', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.08)', color: '#EDD83D', border: '1px solid rgba(237,216,61,0.25)', cursor: 'pointer', fontFamily: 'Satoshi' }}
            >
              Activer le son
            </button>
          )}
        </div>
        <button onClick={onDismiss} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '1.25rem', lineHeight: 1, padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
          ×
        </button>
      </div>
    </div>
  )
}

// ── Dashboard pâtissière ──────────────────────────────────────────────────
export default function PatissiereDashboard() {
  const [orders, setOrders]           = useState([])
  const [viewMonth, setViewMonth]     = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [expandedId, setExpandedId]   = useState(null)

  const { newOrders, clearNew, isUnlocked, unlock } = useNewOrderNotification('patissiere')

  useEffect(() => subscribeOrders(setOrders), [])

  const poleOrders = useMemo(
    () => orders.filter(o => o.status !== 'done' && isAssignedTo(o, 'patissiere')),
    [orders]
  )

  const dayOrders = useMemo(() => {
    if (!selectedDay) return []
    return poleOrders
      .filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), selectedDay))
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
  }, [poleOrders, selectedDay])

  const sectionTitle = useMemo(() => {
    if (!selectedDay) return 'Sélectionne un jour'
    if (isSameDay(selectedDay, new Date())) return "Aujourd'hui"
    return format(selectedDay, 'EEEE d MMMM', { locale: fr })
  }, [selectedDay])

  const prenom = getPrenom()

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>

      {/* Bannière nouvelle commande */}
      {newOrders.length > 0 && (
        <NewOrderBanner
          newOrders={newOrders}
          isUnlocked={isUnlocked}
          onUnlock={unlock}
          onDismiss={clearNew}
        />
      )}

      {/* ── Header avec illustration ── */}
      <header
        className="px-5 pb-3"
        style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-start justify-between animate-fade-up">
          <div className="flex-1 pr-2 pt-1">
            <p className="label-xs mb-3">Au Grand Jour · Pâtisserie</p>
            <h1
              className="font-display"
              style={{ fontSize: '2rem', color: '#111111', letterSpacing: '-0.025em', lineHeight: 1.1 }}
            >
              {prenom ? `Bonjour ${prenom} 👋` : 'Bonjour 👋'}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#8A7060', marginTop: 6, fontFamily: 'Satoshi', fontWeight: 500 }}>
              {poleOrders.length > 0
                ? `${poleOrders.length} commande${poleOrders.length > 1 ? 's' : ''} à produire`
                : 'Tout est à jour 🎉'}
            </p>
          </div>

          {/* Son actif/coupé + illustration */}
          <div className="flex flex-col items-end gap-2" style={{ flexShrink: 0 }}>
            <div>
              {!isUnlocked ? (
                <button
                  onTouchStart={(e) => { e.preventDefault(); unlock() }}
                  onClick={unlock}
                  style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.375rem 0.75rem', borderRadius: 9999, backgroundColor: '#FEFCE8', color: '#854D0E', border: '1px solid #FDE68A', cursor: 'pointer', fontFamily: 'Satoshi' }}
                >
                  Son coupé
                </button>
              ) : (
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.375rem 0.75rem', borderRadius: 9999, backgroundColor: '#D1FAE5', color: '#065F46', fontFamily: 'Satoshi' }}>
                  Son actif
                </span>
              )}
            </div>
            <div style={{ width: 110, height: 100 }}>
              <IllustrationBoulangerie />
            </div>
          </div>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="flex-1 px-4 pt-2 pb-28 overflow-y-auto">

        <KpiStrip orders={poleOrders} />

        <MonthCalendar
          orders={poleOrders}
          viewMonth={viewMonth}
          setViewMonth={setViewMonth}
          selectedDay={selectedDay}
          onSelectDay={(day) => setSelectedDay(day ?? new Date())}
        />

        <div className="flex items-center justify-between mb-3 animate-fade-up delay-150">
          <p className="font-display capitalize" style={{ fontSize: '1rem', color: '#111111' }}>
            {sectionTitle}
          </p>
          <span className="label-xs">{dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}</span>
        </div>

        {dayOrders.length === 0 ? (
          <div
            className="rounded-[20px] text-center py-14 animate-fade-up delay-200"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)' }}
          >
            <p style={{ fontSize: '1.5rem', color: '#10B981', marginBottom: 8 }}>✓</p>
            <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Aucune commande ce jour</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dayOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                isNew={newOrders.some(n => n.id === order.id)}
                expanded={expandedId === order.id}
                onToggle={() => setExpandedId(prev => prev === order.id ? null : order.id)}
              />
            ))}
          </div>
        )}

      </main>

    </div>
  )
}
