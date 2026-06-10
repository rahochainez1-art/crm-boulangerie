import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay, isSameMonth,
  startOfWeek, endOfWeek, addDays,
  startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { subscribeOrders, STATUS_LABELS } from '../../lib/orders'
import StatusBadge from '../../components/ui/StatusBadge'

const ASSIGNED = {
  patissiere:  'Pâtisserie',
  boulangerie: 'Boulangerie',
  vendeur:     'Vendeur·se',
}

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
const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3 3"/>
  </svg>
)
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

// ── Résumé hebdo ──────────────────────────────────────────────────────────

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
        <p className="text-sm text-dust mb-1">Voici votre résumé 👋</p>
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

// ── Calendrier mensuel ────────────────────────────────────────────────────

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

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

// ── Carte commande (expandable, lecture seule) ────────────────────────────

function OrderCard({ order, expanded, onToggle }) {
  const reste = (order.totalAmount || 0) - (order.deposit || 0)

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden mb-2.5"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <button className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-black/[0.02] transition-colors" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm truncate">{order.clientName}</p>
          <p className="text-xs text-dust truncate mt-0.5">{order.articles}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-xs font-bold text-dust tabular-nums">
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <span
          className="text-dust/40 flex-shrink-0 text-base ml-1 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >↓</span>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(232,226,216,0.6)' }} className="px-4 pb-5 pt-4">
          <div className="space-y-4">

            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-dust mb-1">Articles</p>
              <p className="text-sm text-ink leading-relaxed">{order.articles}</p>
            </div>

            {order.totalAmount > 0 && (
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-dust mb-2">Paiement</p>
                <div className="flex gap-5">
                  <div>
                    <p className="text-xs text-dust">Total</p>
                    <p className="text-sm font-bold text-ink mt-0.5">{order.totalAmount} €</p>
                  </div>
                  {order.deposit > 0 && (
                    <div>
                      <p className="text-xs text-dust">Acompte</p>
                      <p className="text-sm font-bold text-ink mt-0.5">{order.deposit} €</p>
                    </div>
                  )}
                  {reste > 0 && (
                    <div>
                      <p className="text-xs text-dust">Reste dû</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: '#C8A96E' }}>{reste} €</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-5">
              {order.assignedTo && (
                <div>
                  <p className="text-xs text-dust">Assigné à</p>
                  <p className="text-sm font-medium text-ink mt-0.5">
                    {Array.isArray(order.assignedTo)
                      ? order.assignedTo.map(p => ASSIGNED[p] ?? p).join(' + ')
                      : (ASSIGNED[order.assignedTo] ?? order.assignedTo)}
                  </p>
                </div>
              )}
              {order.clientPhone && (
                <div>
                  <p className="text-xs text-dust">Téléphone</p>
                  <a href={`tel:${order.clientPhone}`} className="text-sm font-medium mt-0.5 underline" style={{ color: '#C8A96E' }}>
                    {order.clientPhone}
                  </a>
                </div>
              )}
            </div>

            {order.notes && (
              <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: '#FEF3C7' }}>
                <p className="text-xs font-medium" style={{ color: '#92400e' }}>⚠ {order.notes}</p>
              </div>
            )}

            {order.statusHistory?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-dust mb-2">Historique</p>
                <div className="space-y-2">
                  {[...order.statusHistory].reverse().map((h, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: i === 0 ? '#C8A96E' : '#E8E2D8' }} />
                        <span className="text-xs font-medium text-ink">{STATUS_LABELS[h.status]}</span>
                      </div>
                      <span className="text-xs text-dust">
                        {format(parseISO(h.at), 'dd MMM à HH:mm', { locale: fr })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

// ── Vue Analyses ─────────────────────────────────────────────────────────

function AnalysesView({ orders }) {
  const done    = orders.filter(o => o.status === 'done')
  const revenue = done.reduce((s, o) => s + (o.totalAmount || 0), 0)

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-dust mb-3">Récupérées</p>
          <p className="font-serif leading-none" style={{ fontSize: '2.8rem', fontWeight: 600, color: '#1A1A1A' }}>
            {done.length}
          </p>
          <p className="text-xs text-dust mt-1.5">commandes</p>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#F2F6CC', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-dust mb-3">CA encaissé</p>
          <p className="font-serif leading-none" style={{ fontSize: '2.8rem', fontWeight: 600, color: '#1A1A1A' }}>
            {revenue}€
          </p>
          <p className="text-xs text-dust mt-1.5">toutes périodes</p>
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <p className="font-serif font-semibold text-ink" style={{ fontSize: '1.05rem' }}>Historique</p>
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-dust">{done.length}</span>
      </div>

      {done.length === 0 ? (
        <div className="bg-white rounded-2xl text-center py-12" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-2xl mb-2">📋</p>
          <p className="text-sm text-dust">Aucune commande récupérée</p>
        </div>
      ) : (
        [...done].sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate)).map(o => (
          <div key={o.id} className="bg-white rounded-2xl px-4 py-3.5 mb-2.5 flex items-center gap-3"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-ink truncate">{o.clientName}</p>
              <p className="text-xs text-dust truncate mt-0.5">{o.articles}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-dust tabular-nums">{format(parseISO(o.pickupDate), 'dd MMM', { locale: fr })}</p>
              {o.totalAmount > 0 && <p className="text-sm font-bold text-ink mt-0.5">{o.totalAmount}€</p>}
            </div>
          </div>
        ))
      )}
    </>
  )
}

// ── Dashboard Manager ─────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'home',     label: 'Accueil',  Icon: IconHome },
  { id: 'toutes',   label: 'Toutes',   Icon: IconList },
  { id: 'analyses', label: 'Analyses', Icon: IconClock },
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

  // Commandes pour le jour sélectionné (toutes statuts sauf annulées)
  const dayOrders = useMemo(() => {
    if (!selectedDay) return []
    return orders
      .filter(o => o.pickupDate && o.status !== 'cancelled' && isSameDay(parseISO(o.pickupDate), selectedDay))
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
  }, [orders, selectedDay])

  const sectionTitle = useMemo(() => {
    if (!selectedDay) return 'Sélectionne un jour'
    if (isSameDay(selectedDay, new Date())) return "Aujourd'hui"
    return format(selectedDay, 'EEEE d MMMM', { locale: fr })
  }, [selectedDay])

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">

      {/* ── Header ── */}
      <header
        className="px-5 pb-4 flex items-center justify-between"
        style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#F8EDD4' }}>
            <span className="text-sm font-bold" style={{ color: '#5C3D0A' }}>MG</span>
          </div>
          <div>
            <p className="text-xs text-dust">Bonjour,</p>
            <p className="font-serif font-semibold text-ink leading-tight" style={{ fontSize: '1.1rem' }}>Manager</p>
          </div>
        </div>
        <button className="text-dust/60 active:text-ink transition-colors p-2">
          <IconBell />
        </button>
      </header>

      {/* ── Contenu scrollable ── */}
      <main className="flex-1 px-4 pb-36 overflow-y-auto">

        {tab === 'home' && (
          <>
            <SummaryCard orders={orders} />

            <MonthCalendar
              orders={orders}
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
                <p className="text-2xl mb-2">📅</p>
                <p className="text-sm text-dust">Aucune commande ce jour</p>
              </div>
            ) : (
              dayOrders.map(o => (
                <OrderCard key={o.id} order={o} expanded={expandedId === o.id} onToggle={() => toggleExpand(o.id)} />
              ))
            )}
          </>
        )}

        {tab === 'analyses' && <AnalysesView orders={orders} />}

      </main>

      {/* ── Bottom nav — 2 + center + 2 ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white max-w-lg mx-auto z-50"
        style={{
          borderTop: '1px solid rgba(232,226,216,0.5)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-end pt-2 pb-2">

          {/* Accueil + Toutes */}
          {['home', 'toutes'].map(id => {
            const item   = NAV_ITEMS.find(x => x.id === id)
            const active = tab === id
            return (
              <button key={id} onClick={() => changeTab(id)}
                className="flex-1 flex flex-col items-center gap-0.5 pb-1 transition-colors"
                style={{ color: active ? '#C8A96E' : '#B0B0B0' }}>
                <item.Icon />
                <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
                {active && <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: '#C8A96E' }} />}
              </button>
            )
          })}

          {/* Bouton + central surélevé */}
          <button
            onClick={() => navigate('/vendeur/nouvelle-commande')}
            className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{
              backgroundColor: '#C8A96E',
              boxShadow: '0 6px 24px rgba(200,169,110,0.5)',
              transform: 'translateY(-14px)',
              marginBottom: -14,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5"  y1="12" x2="19" y2="12"/>
            </svg>
          </button>

          {/* Analyses + Réglages */}
          {['analyses', 'reglages'].map(id => {
            const item   = NAV_ITEMS.find(x => x.id === id)
            const active = tab === id
            return (
              <button key={id} onClick={() => changeTab(id)}
                className="flex-1 flex flex-col items-center gap-0.5 pb-1 transition-colors"
                style={{ color: active ? '#C8A96E' : '#B0B0B0' }}>
                <item.Icon />
                <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
                {active && <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: '#C8A96E' }} />}
              </button>
            )
          })}

        </div>
      </nav>

    </div>
  )
}
