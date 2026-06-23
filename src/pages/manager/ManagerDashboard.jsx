import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay, isSameMonth,
  startOfWeek, endOfWeek, addDays,
  startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, differenceInHours,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { subscribeOrders, STATUS_LABELS } from '../../lib/orders'
import { getPrenom } from '../../lib/settings'
import StatusBadge from '../../components/ui/StatusBadge'

const ASSIGNED = {
  patissiere:  'Pâtisserie',
  boulangerie: 'Boulangerie',
  vendeur:     'Vendeur·se',
}

const STATUS_PRIORITY = { todo: 0, inprogress: 1, ready: 2, done: 3 }
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// ── Icônes ────────────────────────────────────────────────────────────────
const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)
const IconList = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6"  x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6"  x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IconAnalytics = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </svg>
)
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

// ── Cartes statistiques (4 tuiles) ───────────────────────────────────────
function StatCards({ orders }) {
  const today       = new Date()
  const todayCount  = orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), today) && o.status !== 'cancelled').length
  const inProgress  = orders.filter(o => o.status === 'inprogress').length
  const ready       = orders.filter(o => o.status === 'ready').length
  const urgent      = orders.filter(o => {
    if (!o.pickupDate || o.status === 'done' || o.status === 'cancelled') return false
    const h = differenceInHours(parseISO(o.pickupDate), today)
    return h >= 0 && h <= 24 && o.status !== 'ready'
  }).length

  const tiles = [
    { label: "Aujourd'hui", value: todayCount, bg: '#FFFFFF',  accent: false },
    { label: 'En cours',    value: inProgress, bg: '#FEF3C7',  accent: false },
    { label: 'Prêtes',      value: ready,      bg: '#FFF0B5',  accent: true  },
    { label: 'Urgentes',    value: urgent,     bg: urgent > 0 ? '#FEE2E2' : '#F4F4F5', urgent: urgent > 0 },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {tiles.map((t, i) => (
        <div
          key={t.label}
          className="rounded-3xl p-5 flex flex-col justify-between animate-fade-up"
          style={{
            backgroundColor: t.bg,
            border: '1px solid #E8DFC0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
            minHeight: 112,
            animationDelay: `${i * 0.05}s`,
          }}
        >
          <p
            className="label-xs"
            style={{ color: t.urgent ? '#b91c1c' : '#8A7060' }}
          >
            {t.label}
          </p>
          <div>
            <p
              className="font-serif leading-none"
              style={{
                fontSize: '2.75rem',
                color: t.urgent ? '#b91c1c' : '#432F2E',
              }}
            >
              {t.value}
            </p>
          </div>
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

  const monthOrders = orders.filter(o =>
    o.pickupDate && isSameMonth(parseISO(o.pickupDate), viewMonth)
  )

  return (
    <div
      className="rounded-3xl p-5 mb-5 animate-fade-up delay-100"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DFC0', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
    >
      {/* Navigation mois */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => { setViewMonth(m => subMonths(m, 1)); onSelectDay(null) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-black/5 text-xl"
          style={{ color: '#8A7060' }}
        >‹</button>
        <p className="font-semibold capitalize text-ink" style={{ fontSize: '0.95rem' }}>
          {format(viewMonth, 'MMMM yyyy', { locale: fr })}
        </p>
        <button
          onClick={() => { setViewMonth(m => addMonths(m, 1)); onSelectDay(null) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-black/5 text-xl"
          style={{ color: '#8A7060' }}
        >›</button>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EDD83D' }} />
        <span className="text-xs" style={{ color: '#8A7060' }}>
          <span className="font-semibold text-ink">{monthOrders.length}</span> commande{monthOrders.length > 1 ? 's' : ''} ce mois
        </span>
      </div>

      {/* Labels colonnes */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <p key={i} className="text-center py-1" style={{ fontSize: '10px', fontWeight: 600, color: '#B0A090', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {d}
          </p>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-y-1">
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
                backgroundColor: isSelected ? '#432F2E' : isToday ? '#FFF0B5' : 'transparent',
                opacity: inMonth ? 1 : 0.15,
              }}
            >
              <span
                className="text-sm font-medium leading-tight"
                style={{ color: isSelected ? '#FFFFFF' : '#432F2E' }}
              >
                {format(day, 'd')}
              </span>
              <div className="h-3.5 flex items-center justify-center mt-0.5">
                {count > 0 && (
                  <span
                    className="text-[8px] font-bold flex items-center justify-center"
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#EDD83D',
                      color: isSelected ? '#fff' : '#4A4E10',
                      minWidth: 14,
                      height: 14,
                      padding: '0 3px',
                      borderRadius: 9999,
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

// ── Carte commande ────────────────────────────────────────────────────────
function OrderCard({ order, expanded, onToggle }) {
  const reste = (order.totalAmount || 0) - (order.deposit || 0)
  const isDone = order.status === 'done'

  return (
    <div
      className="rounded-3xl overflow-hidden mb-3 transition-opacity"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8DFC0',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        opacity: isDone ? 0.5 : 1,
      }}
    >
      <button
        className="w-full px-5 py-4 flex items-center gap-3 text-left active:bg-black/[0.02] transition-colors"
        onClick={onToggle}
      >
        {/* Heure */}
        <div className="flex-shrink-0 text-right" style={{ minWidth: 42 }}>
          <p className="font-semibold text-ink tabular-nums" style={{ fontSize: '0.9rem' }}>
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </p>
        </div>

        <div className="w-px self-stretch" style={{ backgroundColor: '#E8DFC0' }} />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm truncate">{order.clientName}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: '#8A7060' }}>{order.articles}</p>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <StatusBadge status={order.status} />
        </div>

        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#B0A090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {expanded && (
        <div
          className="px-5 pb-5 pt-4 space-y-4"
          style={{ borderTop: '1px solid #F0EBD0' }}
        >
          <div>
            <p className="label-xs mb-1.5">Articles</p>
            <p className="text-sm text-ink leading-relaxed">{order.articles}</p>
          </div>

          {order.totalAmount > 0 && (
            <div>
              <p className="label-xs mb-2">Paiement</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs" style={{ color: '#8A7060' }}>Total</p>
                  <p className="text-sm font-semibold text-ink mt-0.5">{order.totalAmount} €</p>
                </div>
                {order.deposit > 0 && (
                  <div>
                    <p className="text-xs" style={{ color: '#8A7060' }}>Acompte</p>
                    <p className="text-sm font-semibold text-ink mt-0.5">{order.deposit} €</p>
                  </div>
                )}
                {reste > 0 && (
                  <div>
                    <p className="text-xs" style={{ color: '#8A7060' }}>Reste dû</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: '#E8A600' }}>{reste} €</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-6">
            {order.assignedTo && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#8A7060' }}>Assigné à</p>
                <p className="text-sm font-medium text-ink">
                  {Array.isArray(order.assignedTo)
                    ? order.assignedTo.map(p => ASSIGNED[p] ?? p).join(' + ')
                    : (ASSIGNED[order.assignedTo] ?? order.assignedTo)}
                </p>
              </div>
            )}
            {order.clientPhone && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#8A7060' }}>Téléphone</p>
                <a
                  href={`tel:${order.clientPhone}`}
                  className="text-sm font-medium underline"
                  style={{ color: '#432F2E' }}
                >
                  {order.clientPhone}
                </a>
              </div>
            )}
          </div>

          {order.notes && (
            <div
              className="rounded-2xl px-4 py-3"
              style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
            >
              <p className="text-xs font-medium" style={{ color: '#92400e' }}>⚠ {order.notes}</p>
            </div>
          )}

          {order.statusHistory?.length > 0 && (
            <div>
              <p className="label-xs mb-2">Historique</p>
              <div className="space-y-2">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: i === 0 ? '#EDD83D' : '#E8DFC0' }}
                      />
                      <span className="text-xs font-medium text-ink">{STATUS_LABELS[h.status]}</span>
                    </div>
                    <span className="text-xs" style={{ color: '#8A7060' }}>
                      {format(parseISO(h.at), 'dd MMM à HH:mm', { locale: fr })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Vue Analyses ──────────────────────────────────────────────────────────
function AnalysesView({ orders }) {
  const done    = orders.filter(o => o.status === 'done')
  const revenue = done.reduce((s, o) => s + (o.totalAmount || 0), 0)

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div
          className="rounded-3xl p-5 animate-fade-up"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DFC0', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', minHeight: 112 }}
        >
          <p className="label-xs mb-3">Récupérées</p>
          <p className="font-serif leading-none" style={{ fontSize: '2.75rem', color: '#432F2E' }}>{done.length}</p>
          <p className="text-xs mt-1.5" style={{ color: '#8A7060' }}>commandes</p>
        </div>
        <div
          className="rounded-3xl p-5 animate-fade-up delay-50"
          style={{ backgroundColor: '#FFF0B5', border: '1px solid #E8DFC0', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', minHeight: 112 }}
        >
          <p className="label-xs mb-3">CA encaissé</p>
          <p className="font-serif leading-none" style={{ fontSize: '2.75rem', color: '#432F2E' }}>{revenue}€</p>
          <p className="text-xs mt-1.5" style={{ color: '#8A7060' }}>toutes périodes</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-ink">Historique</p>
        <span className="label-xs">{done.length}</span>
      </div>

      {done.length === 0 ? (
        <div
          className="rounded-3xl text-center py-16 animate-fade-up"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DFC0' }}
        >
          <p className="text-2xl mb-2">—</p>
          <p className="text-sm" style={{ color: '#8A7060' }}>Aucune commande récupérée</p>
        </div>
      ) : (
        [...done]
          .sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate))
          .map(o => (
            <div
              key={o.id}
              className="rounded-3xl px-5 py-4 mb-2.5 flex items-center gap-3 animate-fade-up"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DFC0', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink truncate">{o.clientName}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: '#8A7060' }}>{o.articles}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs tabular-nums" style={{ color: '#8A7060' }}>
                  {format(parseISO(o.pickupDate), 'dd MMM', { locale: fr })}
                </p>
                {o.totalAmount > 0 && (
                  <p className="text-sm font-semibold text-ink mt-0.5">{o.totalAmount}€</p>
                )}
              </div>
            </div>
          ))
      )}
    </>
  )
}

// ── Manager Dashboard ─────────────────────────────────────────────────────
const INACTIVE = '#B0A090'
const ACTIVE   = '#432F2E'

const NAV_ITEMS = [
  { id: 'home',     label: 'Accueil',  Icon: IconHome },
  { id: 'toutes',   label: 'Toutes',   Icon: IconList },
  { id: 'analyses', label: 'Analyses', Icon: IconAnalytics },
  { id: 'reglages', label: 'Réglages', Icon: IconSettings },
]

export default function ManagerDashboard() {
  const [orders, setOrders]           = useState([])
  const [tab, setTab]                 = useState('home')
  const [viewMonth, setViewMonth]     = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [expandedId, setExpandedId]   = useState(null)
  const navigate = useNavigate()

  useEffect(() => subscribeOrders(setOrders), [])

  const changeTab = (t) => {
    if (t === 'reglages') { navigate('/settings'); return }
    if (t === 'toutes')   { navigate('/manager/toutes'); return }
    setTab(t)
    setExpandedId(null)
  }

  const dayOrders = useMemo(() => {
    if (!selectedDay) return []
    return orders
      .filter(o => o.pickupDate && o.status !== 'cancelled' && isSameDay(parseISO(o.pickupDate), selectedDay))
      .sort((a, b) => {
        const pa = STATUS_PRIORITY[a.status] ?? 99
        const pb = STATUS_PRIORITY[b.status] ?? 99
        if (pa !== pb) return pa - pb
        return new Date(a.pickupDate) - new Date(b.pickupDate)
      })
  }, [orders, selectedDay])

  const sectionTitle = useMemo(() => {
    if (!selectedDay) return 'Sélectionne un jour'
    if (isSameDay(selectedDay, new Date())) return "Aujourd'hui"
    return format(selectedDay, 'EEEE d MMMM', { locale: fr })
  }, [selectedDay])

  const prenom = getPrenom()
  const weekCount = useMemo(() => {
    const ws = startOfWeek(new Date(), { weekStartsOn: 1 })
    const we = addDays(ws, 6)
    return orders.filter(o => {
      if (!o.pickupDate || o.status === 'cancelled') return false
      const d = parseISO(o.pickupDate)
      return d >= ws && d <= we
    }).length
  }, [orders])

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FFF0B5' }}>

      {/* ── Header ── */}
      <header
        className="px-5 pb-5"
        style={{
          paddingTop: 'max(52px, env(safe-area-inset-top))',
          borderBottom: '1px solid #E8DFC0',
          backgroundColor: '#FFF0B5',
        }}
      >
        <div className="animate-fade-up">
          <p className="label-xs mb-3">Au Grand Jour · Manager</p>
          <h1 className="font-serif text-ink" style={{ fontSize: '2rem', lineHeight: 1.15 }}>
            {prenom ? `Bonjour ${prenom} 👋` : 'Bonjour 👋'}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A7060' }}>
            {weekCount > 0
              ? `${weekCount} commande${weekCount > 1 ? 's' : ''} cette semaine`
              : 'Aucune commande cette semaine'}
          </p>
        </div>
      </header>

      {/* ── Contenu scrollable ── */}
      <main className="flex-1 px-4 pt-5 pb-36 overflow-y-auto">

        {tab === 'home' && (
          <>
            <StatCards orders={orders} />

            <MonthCalendar
              orders={orders}
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
              selectedDay={selectedDay}
              onSelectDay={(day) => setSelectedDay(day ?? new Date())}
            />

            <div className="flex items-center justify-between mb-3 animate-fade-up delay-150">
              <p className="font-semibold text-ink capitalize" style={{ fontSize: '0.95rem' }}>
                {sectionTitle}
              </p>
              <span className="label-xs">{dayOrders.length} cmd</span>
            </div>

            {dayOrders.length === 0 ? (
              <div
                className="rounded-3xl text-center py-14 animate-fade-up delay-200"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DFC0' }}
              >
                <p className="text-2xl mb-2">—</p>
                <p className="text-sm" style={{ color: '#8A7060' }}>Aucune commande ce jour</p>
              </div>
            ) : (
              dayOrders.map(o => (
                <OrderCard
                  key={o.id}
                  order={o}
                  expanded={expandedId === o.id}
                  onToggle={() => setExpandedId(prev => prev === o.id ? null : o.id)}
                />
              ))
            )}
          </>
        )}

        {tab === 'analyses' && <AnalysesView orders={orders} />}

      </main>

      {/* ── Bottom nav manager ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white max-w-lg mx-auto z-50"
        style={{
          borderTop: '1px solid #E8DFC0',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-end pt-2 pb-2">

          {NAV_ITEMS.slice(0, 2).map(item => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => changeTab(item.id)}
                className="flex-1 flex flex-col items-center gap-0.5 pb-1 transition-colors"
                style={{ color: active ? ACTIVE : INACTIVE }}
              >
                <item.Icon />
                <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
                {active && <span className="w-4 h-0.5 rounded-full mt-0.5" style={{ backgroundColor: '#EDD83D' }} />}
              </button>
            )
          })}

          {/* Bouton + surélevé */}
          <button
            onClick={() => navigate('/vendeur/nouvelle-commande')}
            className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{
              backgroundColor: '#432F2E',
              boxShadow: '0 8px 32px rgba(24,24,27,0.25)',
              transform: 'translateY(-14px)',
              marginBottom: -14,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5"  y1="12" x2="19" y2="12"/>
            </svg>
          </button>

          {NAV_ITEMS.slice(2).map(item => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => changeTab(item.id)}
                className="flex-1 flex flex-col items-center gap-0.5 pb-1 transition-colors"
                style={{ color: active ? ACTIVE : INACTIVE }}
              >
                <item.Icon />
                <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
                {active && <span className="w-4 h-0.5 rounded-full mt-0.5" style={{ backgroundColor: '#EDD83D' }} />}
              </button>
            )
          })}

        </div>
      </nav>

    </div>
  )
}
