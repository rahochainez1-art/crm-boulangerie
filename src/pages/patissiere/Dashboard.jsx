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

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div
        className="rounded-3xl p-5 flex flex-col justify-between animate-fade-up"
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
        className="rounded-3xl p-5 flex flex-col justify-between animate-fade-up delay-50"
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
      className="rounded-3xl p-5 mb-5 animate-fade-up delay-100"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E5E4', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { setViewMonth(m => subMonths(m, 1)); onSelectDay(null) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-black/5 text-xl"
          style={{ color: '#71717A' }}
        >‹</button>
        <p className="font-semibold capitalize text-ink" style={{ fontSize: '0.95rem' }}>
          {format(viewMonth, 'MMMM yyyy', { locale: fr })}
        </p>
        <button
          onClick={() => { setViewMonth(m => addMonths(m, 1)); onSelectDay(null) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-black/5 text-xl"
          style={{ color: '#71717A' }}
        >›</button>
      </div>

      <div className="flex items-center gap-1.5 mb-4">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#E8E27A' }} />
        <span className="text-xs" style={{ color: '#71717A' }}>
          <span className="font-semibold text-ink">{monthOrders.length}</span> commande{monthOrders.length > 1 ? 's' : ''} ce mois
        </span>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <p key={i} className="text-center py-1" style={{ fontSize: '10px', fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
              className="flex flex-col items-center py-1.5 rounded-2xl transition-all active:scale-95"
              style={{
                backgroundColor: isSelected ? '#18181B' : isToday ? '#F7F4C8' : 'transparent',
                opacity: inMonth ? 1 : 0.15,
              }}
            >
              <span
                className="text-sm font-medium leading-tight"
                style={{ color: isSelected ? '#FFFFFF' : '#18181B' }}
              >
                {format(day, 'd')}
              </span>
              <div className="h-3.5 flex items-center justify-center mt-0.5">
                {count > 0 && (
                  <span
                    className="text-[8px] font-bold flex items-center justify-center"
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#E8E27A',
                      color: isSelected ? '#fff' : '#4A4E10',
                      minWidth: 14, height: 14, padding: '0 3px', borderRadius: 9999,
                    }}
                  >
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

  const prenom   = getPrenom()
  const initiale = prenom[0]?.toUpperCase() ?? 'P'

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#F8F7F3' }}>

      {/* Bannière nouvelle commande */}
      {newOrders.length > 0 && (
        <NewOrderBanner
          newOrders={newOrders}
          isUnlocked={isUnlocked}
          onUnlock={unlock}
          onDismiss={clearNew}
        />
      )}

      {/* Header */}
      <header
        className="px-5 pb-5"
        style={{
          paddingTop: 'max(52px, env(safe-area-inset-top))',
          borderBottom: '1px solid #E7E5E4',
        }}
      >
        <div className="flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#DCFCE7' }}
            >
              <span className="text-sm font-bold" style={{ color: '#166534' }}>{initiale}</span>
            </div>
            <div>
              <p className="text-xs" style={{ color: '#71717A' }}>{prenom ? `Bonjour ${prenom},` : 'Bonjour,'}</p>
              <p className="font-serif text-ink leading-tight" style={{ fontSize: '1.05rem' }}>Pâtissière</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isUnlocked ? (
              <button
                onTouchStart={(e) => { e.preventDefault(); unlock() }}
                onClick={unlock}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-xl border active:opacity-70 flex items-center gap-1"
                style={{ backgroundColor: '#F7F4C8', color: '#4A4E10', borderColor: '#E8E27A' }}
              >
                🔕 Son
              </button>
            ) : (
              <span
                className="text-[11px] font-semibold px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
              >
                🔊 Actif
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 px-4 pt-5 pb-36 overflow-y-auto">

        <SummaryCard orders={poleOrders} />

        <MonthCalendar
          orders={poleOrders}
          viewMonth={viewMonth}
          setViewMonth={setViewMonth}
          selectedDay={selectedDay}
          onSelectDay={(day) => setSelectedDay(day ?? new Date())}
        />

        <div className="flex items-center justify-between mb-3 animate-fade-up delay-150">
          <p className="font-semibold text-ink capitalize" style={{ fontSize: '0.95rem' }}>{sectionTitle}</p>
          <span className="label-xs">{dayOrders.length} cmd</span>
        </div>

        {dayOrders.length === 0 ? (
          <div
            className="rounded-3xl text-center py-14 animate-fade-up delay-200"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E5E4' }}
          >
            <p className="text-2xl mb-2">✓</p>
            <p className="text-sm" style={{ color: '#71717A' }}>Aucune commande ce jour</p>
          </div>
        ) : (
          <div className="space-y-3">
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

// ── Bannière nouvelle commande ────────────────────────────────────────────
function NewOrderBanner({ newOrders, isUnlocked, onUnlock, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000)
    return () => clearTimeout(t)
  }, [newOrders.length])

  const last = newOrders[newOrders.length - 1]

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto px-4"
      style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
    >
      <div
        className="rounded-3xl px-5 py-4 flex items-start gap-3"
        style={{ backgroundColor: '#18181B', boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}
      >
        <span className="text-xl flex-shrink-0 mt-0.5">🍰</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#E8E27A' }}>
            {newOrders.length > 1 ? `${newOrders.length} nouvelles commandes` : 'Nouvelle commande'}
          </p>
          <p className="font-semibold text-white truncate">{last.clientName}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{last.articles}</p>
          {!isUnlocked && (
            <button
              onTouchStart={(e) => { e.preventDefault(); onUnlock() }}
              onClick={onUnlock}
              className="mt-2 text-[11px] font-semibold px-3 py-1 rounded-xl active:opacity-70"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#E8E27A', border: '1px solid rgba(232,226,122,0.3)' }}
            >
              🔕 Activer le son
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-white/40 active:text-white flex-shrink-0 text-xl leading-none p-1 -mr-1"
        >×</button>
      </div>
    </div>
  )
}

// ── Carte commande ────────────────────────────────────────────────────────
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

  return (
    <div
      className="rounded-3xl overflow-hidden transition-all duration-500 animate-fade-up"
      style={{
        backgroundColor: '#FFFFFF',
        border: isNew ? '2px solid #E8E27A' : '1px solid #E7E5E4',
        boxShadow: isNew
          ? '0 8px 32px rgba(232,226,122,0.2)'
          : '0 4px 24px rgba(0,0,0,0.04)',
      }}
    >
      {/* Barre urgence */}
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

          <div>
            <p className="label-xs mb-1.5">Articles</p>
            <p className="text-sm text-ink leading-relaxed">{order.articles}</p>
          </div>

          {order.notes && (
            <div
              className="rounded-2xl px-4 py-3"
              style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
            >
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
