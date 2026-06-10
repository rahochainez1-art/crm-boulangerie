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
import BottomNav from '../../components/layout/BottomNav'

// ── Icônes ────────────────────────────────────────────────────────────────
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

// ── Constantes ────────────────────────────────────────────────────────────
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const PRODUCTION_STATUSES = ['todo', 'inprogress', 'ready']
const STATUS_PICKER = {
  todo:       { label: 'Pas commencé', active: 'bg-ink text-chalk',          idle: 'bg-parchment text-dust border border-warm' },
  inprogress: { label: 'En cours',     active: 'bg-amber-500 text-white',    idle: 'bg-amber-50 text-amber-700 border border-amber-200' },
  ready:      { label: 'Prêt ✓',       active: 'bg-lime text-ink font-bold', idle: 'bg-green-50 text-green-700 border border-green-200' },
}

function urgencyBar(pickupDate) {
  const h = differenceInHours(parseISO(pickupDate), new Date())
  const t = getUrgencyHours()
  if (h < 0)      return 'bg-red-500'
  if (h < t)      return 'bg-red-400'
  if (h < t + 24) return 'bg-amber-400'
  return 'bg-sage'
}

// ── Carte de résumé ───────────────────────────────────────────────────────
function SummaryCard({ orders }) {
  const weekStart  = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd    = addDays(weekStart, 6)
  const weekOrders = orders.filter(o => {
    if (!o.pickupDate) return false
    const d = parseISO(o.pickupDate)
    return d >= weekStart && d <= weekEnd
  })
  const todoCount = orders.filter(o => o.status === 'todo' || o.status === 'inprogress').length

  const greeting = weekOrders.length === 0
    ? 'Aucune commande\ncette semaine.'
    : weekOrders.length <= 2
    ? 'Calme et maîtrisé —\nbonne semaine.'
    : todoCount > 3
    ? 'Beaucoup à faire,\nbonne organisation !'
    : 'Belle activité,\ntout est sous contrôle.'

  return (
    <>
      <div className="mb-5 px-1">
        <p className="text-sm text-dust mb-1">
          {getPrenom() ? `Bonjour ${getPrenom()} 👋` : 'Voici ton résumé 👋'}
        </p>
        <h2
          className="font-serif leading-tight"
          style={{ fontSize: '1.75rem', fontWeight: 600, color: '#1A1A1A', whiteSpace: 'pre-line' }}
        >
          {greeting}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div
          className="rounded-2xl p-4 flex flex-col justify-between"
          style={{ backgroundColor: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', minHeight: 120 }}
        >
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-dust">Semaine</p>
          <div>
            <p className="font-serif leading-none mt-3" style={{ fontSize: '2.8rem', fontWeight: 600, color: '#1A1A1A' }}>
              {weekOrders.length}
            </p>
            <p className="text-xs text-dust mt-1.5">commande{weekOrders.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 flex flex-col justify-between"
          style={{
            backgroundColor: todoCount > 3 ? '#FEF2F2' : todoCount > 0 ? '#FBF0DC' : '#F2F6CC',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            minHeight: 120,
          }}
        >
          <p
            className="text-[10px] font-bold tracking-[0.14em] uppercase"
            style={{ color: todoCount > 3 ? '#dc2626' : '#6B6B6B' }}
          >
            {todoCount > 3 ? '⚠ Urgent' : 'Production'}
          </p>
          <div>
            <p
              className="font-serif leading-none mt-3"
              style={{ fontSize: '2.8rem', fontWeight: 600, color: todoCount > 3 ? '#dc2626' : '#1A1A1A' }}
            >
              {todoCount}
            </p>
            <p className="text-xs mt-1.5" style={{ color: todoCount > 3 ? '#dc2626' : '#6B6B6B' }}>
              à produire
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Calendrier mensuel (identique manager — couleur dorée) ────────────────
function MonthCalendar({ orders, viewMonth, setViewMonth, selectedDay, onSelectDay }) {
  const mStart   = startOfMonth(viewMonth)
  const mEnd     = endOfMonth(viewMonth)
  const calStart = startOfWeek(mStart, { weekStartsOn: 1 })
  const calEnd   = endOfWeek(mEnd,     { weekStartsOn: 1 })
  const days     = eachDayOfInterval({ start: calStart, end: calEnd })

  const monthOrders = orders.filter(o =>
    o.pickupDate && isSameMonth(parseISO(o.pickupDate), viewMonth)
  )
  const activeDays = new Set(
    monthOrders.map(o => format(parseISO(o.pickupDate), 'yyyy-MM-dd'))
  )

  return (
    <div className="bg-white rounded-2xl p-4 mb-5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { setViewMonth(m => subMonths(m, 1)); onSelectDay(null) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-black/5 text-2xl font-light"
          style={{ color: '#6B6B6B' }}
        >‹</button>
        <p className="font-serif font-semibold capitalize text-ink" style={{ fontSize: '1.05rem' }}>
          {format(viewMonth, 'MMMM yyyy', { locale: fr })}
        </p>
        <button
          onClick={() => { setViewMonth(m => addMonths(m, 1)); onSelectDay(null) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-black/5 text-2xl font-light"
          style={{ color: '#6B6B6B' }}
        >›</button>
      </div>

      <div className="flex items-center gap-4 mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C8A96E' }} />
          <span className="text-xs text-dust">
            <span className="font-bold text-ink">{monthOrders.length}</span> commande{monthOrders.length > 1 ? 's' : ''} ce mois
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EEED9E' }} />
          <span className="text-xs text-dust">
            <span className="font-bold text-ink">{activeDays.size}</span> jour{activeDays.size > 1 ? 's' : ''} actif{activeDays.size > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <p key={i} className="text-center text-[10px] font-bold uppercase py-1" style={{ color: '#B0B0B0' }}>
            {d}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map(day => {
          const inMonth    = isSameMonth(day, viewMonth)
          const count      = inMonth
            ? orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), day)).length
            : 0
          const isSelected = selectedDay && isSameDay(day, selectedDay)
          const isToday    = isSameDay(day, new Date())

          return (
            <button
              key={day.toISOString()}
              disabled={!inMonth}
              onClick={() => onSelectDay(isSelected ? null : day)}
              className="flex flex-col items-center py-1 rounded-xl transition-all active:scale-95"
              style={{
                backgroundColor: isSelected ? '#C8A96E' : isToday ? '#FBF0DC' : 'transparent',
                opacity: inMonth ? 1 : 0.2,
              }}
            >
              <span
                className="text-sm font-semibold leading-tight"
                style={{ color: isSelected ? '#fff' : '#1A1A1A' }}
              >
                {format(day, 'd')}
              </span>
              <div className="h-3.5 flex items-center justify-center mt-0.5">
                {count > 0 ? (
                  <span
                    className="text-[8px] font-bold px-1 min-w-[14px] h-3.5 flex items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.35)' : '#EEED9E',
                      color: isSelected ? '#fff' : '#4A4E10',
                    }}
                  >
                    {count}
                  </span>
                ) : null}
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

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)

  const prenom = getPrenom()
  const initiale = prenom[0]?.toUpperCase() ?? 'PT'

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">

      {/* ── Header — identique manager, couleurs pâtissière ── */}
      <header
        className="px-5 pb-4 flex items-center justify-between"
        style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#DCF0CC' }}
          >
            <span className="text-sm font-bold" style={{ color: '#1E3D0E' }}>{initiale}</span>
          </div>
          <div>
            <p className="text-xs text-dust">{prenom ? `Bonjour ${prenom},` : 'Bonjour,'}</p>
            <p className="font-serif font-semibold text-ink leading-tight" style={{ fontSize: '1.1rem' }}>Pâtissière</p>
          </div>
        </div>
        <button className="text-dust/60 active:text-ink transition-colors p-2">
          <IconBell />
        </button>
      </header>

      {/* ── Contenu scrollable ── */}
      <main className="flex-1 px-4 pb-36 overflow-y-auto">

        <SummaryCard orders={poleOrders} />

        <MonthCalendar
          orders={poleOrders}
          viewMonth={viewMonth}
          setViewMonth={setViewMonth}
          selectedDay={selectedDay}
          onSelectDay={(day) => setSelectedDay(day ?? new Date())}
        />

        <div className="flex items-baseline justify-between mb-3">
          <p className="font-sans font-semibold text-ink capitalize" style={{ fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
            {sectionTitle}
          </p>
          <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-dust">
            {dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}
          </span>
        </div>

        {dayOrders.length === 0 ? (
          <div className="bg-white rounded-2xl text-center py-12" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="text-2xl mb-2">✓</p>
            <p className="text-sm text-dust">Aucune commande ce jour</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dayOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                expanded={expandedId === order.id}
                onToggle={() => toggleExpand(order.id)}
              />
            ))}
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  )
}

// ── Carte commande (style manager + sélecteur statut) ─────────────────────
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
    <div className="bg-white rounded-2xl overflow-hidden mb-2.5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className={`h-1.5 ${urgencyBar(order.pickupDate)}`} />

      <button
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-black/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm truncate">{order.clientName}</p>
          <p className="text-xs text-dust truncate mt-0.5">{order.articles}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-xs font-bold text-dust tabular-nums">
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </span>
          <StatusPill status={order.status} />
        </div>
        <span
          className="text-dust/40 flex-shrink-0 text-base ml-1 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >↓</span>
      </button>

      {expanded && (
        <div className="px-4 pb-5 pt-4 space-y-4" style={{ borderTop: '1px solid rgba(232,226,216,0.6)' }}>

          <div>
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-dust mb-1">Articles</p>
            <p className="text-sm text-ink leading-relaxed">{order.articles}</p>
          </div>

          {order.notes && (
            <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: '#FEF3C7' }}>
              <p className="text-xs font-medium" style={{ color: '#92400e' }}>⚠ {order.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5">
            {PRODUCTION_STATUSES.map(s => {
              const cfg      = STATUS_PICKER[s]
              const isActive = order.status === s
              return (
                <button
                  key={s}
                  onClick={() => handleSetStatus(s)}
                  disabled={busy}
                  className={`rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${isActive ? cfg.active : cfg.idle}`}
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
    todo:       { label: 'À faire',  cls: 'bg-parchment text-dust border border-warm' },
    inprogress: { label: 'En cours', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    ready:      { label: 'Prêt ✓',   cls: 'bg-green-50 text-green-700 border border-green-200' },
  }
  const cfg = map[status] ?? map.todo
  return (
    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
