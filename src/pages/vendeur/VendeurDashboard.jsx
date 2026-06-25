import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay,
  startOfWeek, endOfWeek, eachDayOfInterval, addWeeks,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeOrders, setStatus } from '../../lib/orders'
import { getPrenom } from '../../lib/settings'
import StatusBadge from '../../components/ui/StatusBadge'

const TABS = [
  { id: 'all',   label: 'Toutes' },
  { id: 'ready', label: 'Prêtes' },
]

const CARD_STYLE = {
  todo:       { bg: '#FFFCEC', border: 'rgba(237,210,60,0.28)', shadow: '0 2px 16px rgba(237,210,60,0.1)' },
  inprogress: { bg: '#FFF6CC', border: 'rgba(237,200,40,0.38)', shadow: '0 2px 16px rgba(237,200,40,0.14)' },
  ready:      { bg: '#E5F0F5', border: 'rgba(184,213,229,0.65)', shadow: '0 2px 16px rgba(184,213,229,0.22)' },
  done:       { bg: '#FAFAF8', border: 'rgba(180,175,165,0.22)', shadow: 'none' },
}

function greeting(prenom) {
  const h = new Date().getHours()
  const name = prenom ? ` ${prenom}` : ''
  if (h < 12) return `Bonjour${name} 👋`
  if (h < 18) return `Bon après-midi${name} 👋`
  return `Bonsoir${name} 👋`
}

export default function VendeurDashboard() {
  const [allOrders, setAllOrders] = useState([])
  const [tab, setTab]             = useState('all')
  const [selected, setSelected]   = useState(null)
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [weekOffset, setWeekOffset]   = useState(0)
  const [prevReady, setPrevReady] = useState(new Set())
  const prenom = getPrenom()
  const initiale = prenom ? prenom[0].toUpperCase() : 'V'

  useEffect(() => {
    return subscribeOrders((newOrders) => {
      const todayOrders = newOrders.filter(o => {
        try { return isSameDay(parseISO(o.pickupDate), new Date()) } catch { return false }
      })
      const newReady = new Set(todayOrders.filter(o => o.status === 'ready').map(o => o.id))
      newReady.forEach(id => {
        if (!prevReady.has(id)) {
          const order = newOrders.find(o => o.id === id)
          toast.success(`Prête — ${order?.clientName}`, { duration: 6000 })
        }
      })
      setPrevReady(newReady)
      setAllOrders(newOrders)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selected) return
    const updated = allOrders.find(o => o.id === selected.id)
    if (updated) setSelected(updated)
  }, [allOrders]) // eslint-disable-line react-hooks/exhaustive-deps

  const weekDays = useMemo(() => {
    const base = addWeeks(new Date(), weekOffset)
    return eachDayOfInterval({
      start: startOfWeek(base, { weekStartsOn: 1 }),
      end:   endOfWeek(base,   { weekStartsOn: 1 }),
    })
  }, [weekOffset])

  const dayOrders = useMemo(() =>
    allOrders.filter(o => {
      try { return isSameDay(parseISO(o.pickupDate), selectedDay) } catch { return false }
    }),
    [allOrders, selectedDay]
  )

  const kpiTodo  = dayOrders.filter(o => o.status === 'todo' || o.status === 'inprogress').length
  const kpiReady = dayOrders.filter(o => o.status === 'ready').length
  const kpiDone  = dayOrders.filter(o => o.status === 'done').length

  const filtered = (
    tab === 'ready' ? dayOrders.filter(o => o.status === 'ready') : dayOrders
  ).slice().sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1
    if (a.status !== 'done' && b.status === 'done') return -1
    return 0
  })

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>

      {/* ── Header compact ─────────────────────────────────────────── */}
      <header
        className="px-5 pb-4"
        style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between">
          <div className="animate-fade-up">
            <h1
              className="font-display"
              style={{ fontSize: '1.625rem', color: '#111111', letterSpacing: '-0.025em', lineHeight: 1.15 }}
            >
              {greeting(prenom)}
            </h1>
            <p
              className="capitalize"
              style={{ fontSize: '0.8125rem', color: '#8A7060', fontWeight: 500, fontFamily: 'Satoshi', marginTop: 2 }}
            >
              {format(new Date(), 'EEEE d MMMM', { locale: fr })}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 animate-fade-up"
            style={{ backgroundColor: '#432F2E' }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFFFFF', fontFamily: 'Satoshi' }}>
              {initiale}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-28">

        {/* ── KPI Strip ───────────────────────────────────────────── */}
        <div className="px-5 mb-5">
          <div
            className="flex rounded-2xl overflow-hidden"
            style={{
              backgroundColor: '#FFF0B5',
              border: '1px solid rgba(237,216,61,0.4)',
              boxShadow: '0 2px 12px rgba(237,216,61,0.2)',
            }}
          >
            {[
              {
                count: kpiTodo,
                label: 'À préparer',
                textColor: kpiTodo > 0 ? '#111111' : '#B0A090',
                bg: null,
              },
              {
                count: kpiReady,
                label: 'Prêtes',
                textColor: kpiReady > 0 ? '#1D4E6B' : '#B0A090',
                bg: kpiReady > 0 ? '#E5F0F5' : null,
              },
              {
                count: kpiDone,
                label: 'Récupérées',
                textColor: '#8A7060',
                bg: null,
              },
            ].map((kpi, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center py-3.5"
                style={{
                  backgroundColor: kpi.bg || 'transparent',
                  borderRight: i < 2 ? '1px solid rgba(237,216,61,0.35)' : 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: kpi.textColor,
                    fontFamily: 'Satoshi',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {kpi.count}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: '#8A7060',
                    fontFamily: 'Satoshi',
                    marginTop: 4,
                    letterSpacing: '0.01em',
                  }}
                >
                  {kpi.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Calendrier semaine ─────────────────────────────────────── */}
        <div className="px-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                const prev = addWeeks(new Date(), weekOffset - 1)
                setWeekOffset(o => o - 1)
                setSelectedDay(startOfWeek(prev, { weekStartsOn: 1 }))
              }}
              className="active:opacity-50 transition-opacity"
              style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi' }}
            >
              ← Préc
            </button>
            <p
              className="capitalize"
              style={{ fontSize: '0.875rem', fontWeight: 600, color: '#432F2E', fontFamily: 'Satoshi' }}
            >
              {format(weekDays[3], 'MMMM yyyy', { locale: fr })}
            </p>
            <button
              onClick={() => {
                const next = addWeeks(new Date(), weekOffset + 1)
                setWeekOffset(o => o + 1)
                setSelectedDay(startOfWeek(next, { weekStartsOn: 1 }))
              }}
              className="active:opacity-50 transition-opacity"
              style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi' }}
            >
              Suiv →
            </button>
          </div>

          <div className="flex gap-1.5">
            {weekDays.map(day => {
              const isSelected = isSameDay(day, selectedDay)
              const isToday    = isSameDay(day, new Date())
              const hasOrders  = allOrders.some(o => {
                try { return isSameDay(parseISO(o.pickupDate), day) } catch { return false }
              })
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className="flex-1 flex flex-col items-center py-3 transition-all active:scale-95"
                  style={{
                    borderRadius: 14,
                    backgroundColor: isSelected
                      ? '#432F2E'
                      : isToday
                      ? '#E5F0F5'
                      : '#FFF0B5',
                    border: isSelected
                      ? 'none'
                      : isToday
                      ? '1.5px solid #B8D5E5'
                      : '1px solid rgba(237,216,61,0.4)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 700,
                      lineHeight: 1,
                      color: isSelected ? '#FFFFFF' : '#111111',
                      fontFamily: 'Satoshi',
                    }}
                  >
                    {format(day, 'd')}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: isSelected ? 'rgba(255,255,255,0.55)' : '#8A7060',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      marginTop: 3,
                      fontFamily: 'Satoshi',
                    }}
                  >
                    {format(day, 'EEE', { locale: fr })}
                  </span>
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 9999,
                      marginTop: 5,
                      backgroundColor: hasOrders
                        ? isSelected ? 'rgba(255,255,255,0.45)' : '#EDD83D'
                        : 'transparent',
                      display: 'block',
                    }}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Chips de filtre ────────────────────────────────────────── */}
        <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-none">
          {TABS.map(t => {
            const count = t.id === 'all' ? dayOrders.length : kpiReady
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-shrink-0 active:scale-95 transition-transform"
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: 9999,
                  backgroundColor: isActive ? '#432F2E' : '#FFF0B5',
                  color: isActive ? '#FFFFFF' : '#432F2E',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: isActive ? 'none' : '1px solid rgba(237,216,61,0.5)',
                  cursor: 'pointer',
                  fontFamily: 'Satoshi',
                  letterSpacing: '-0.01em',
                }}
              >
                {t.label}{count > 0 && ` · ${count}`}
              </button>
            )
          })}
        </div>

        {/* ── En-tête section ─────────────────────────────────────────── */}
        <div className="flex items-baseline justify-between px-5 mb-4">
          <p
            className="font-display"
            style={{ fontSize: '1rem', color: '#111111', letterSpacing: '-0.015em' }}
          >
            {isSameDay(selectedDay, new Date())
              ? "Aujourd'hui"
              : format(selectedDay, 'EEEE d MMMM', { locale: fr })}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#8A7060', fontWeight: 500, fontFamily: 'Satoshi' }}>
            {dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Liste commandes ───────────────────────────────────────── */}
        <div className="px-5">
          {filtered.length === 0 ? (
            <div
              className="rounded-2xl text-center py-14 animate-fade-up"
              style={{
                backgroundColor: '#FFF0B5',
                border: '1px solid rgba(237,216,61,0.35)',
              }}
            >
              <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>
                {dayOrders.length === 0 ? 'Aucune commande ce jour-là' : 'Aucune commande ici'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((order, i) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={i}
                  onOpen={() => setSelected(order)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {selected && <OrderSheet order={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

/* ── Carte commande ───────────────────────────────────────────────────── */
function OrderCard({ order, index, onOpen }) {
  const reste  = (order.totalAmount || 0) - (order.deposit || 0)
  const card   = CARD_STYLE[order.status] ?? CARD_STYLE.todo
  const isDone = order.status === 'done'
  const hasPay = order.totalAmount > 0
  const isToday = (() => { try { return isSameDay(parseISO(order.pickupDate), new Date()) } catch { return false } })()

  return (
    <div
      className="animate-fade-up"
      style={{
        backgroundColor: card.bg,
        borderRadius: 22,
        border: `1px solid ${card.border}`,
        boxShadow: card.shadow,
        opacity: isDone ? 0.55 : 1,
        overflow: 'hidden',
        animationDelay: `${index * 0.045}s`,
      }}
    >
      {/* ── Zone 1 : Heure pill + Statut ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-4">
        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.7)',
            borderRadius: 14,
            padding: '9px 13px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDone ? '#C0B8A8' : '#432F2E'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
            </svg>
            <span style={{ fontSize: '1.375rem', fontWeight: 800, color: isDone ? '#C0B8A8' : '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {format(parseISO(order.pickupDate), 'HH:mm')}
            </span>
          </div>
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi', marginTop: 3 }}>
            {isToday ? "Aujourd'hui" : format(parseISO(order.pickupDate), 'EEE d MMM', { locale: fr })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Séparateur */}
      <div style={{ height: 1, backgroundColor: 'rgba(67,47,46,0.07)', margin: '0 16px' }} />

      {/* ── Zone 2 : Client + Articles ── */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: '1.625rem', fontWeight: 800, color: isDone ? '#B0A090' : '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 4 }}>
              {order.clientName}
            </p>
            <p style={{ fontSize: '0.875rem', color: isDone ? '#C0B0A0' : '#7A6A5A', fontFamily: 'Satoshi' }}>
              {order.articles}
            </p>
          </div>
          {order.clientPhone && !isDone && (
            <a
              href={`tel:${order.clientPhone}`}
              onClick={e => e.stopPropagation()}
              className="flex-shrink-0 flex items-center justify-center active:opacity-70"
              style={{ width: 38, height: 38, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.65)', color: '#432F2E' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* ── Zone 3 : Paiement 3 colonnes ── */}
      {hasPay && (
        <>
          <div style={{ height: 1, backgroundColor: 'rgba(67,47,46,0.07)', margin: '0 16px' }} />
          <div className="flex">
            {/* Payé */}
            <div className="flex-1 px-4 py-3">
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(21,128,61,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <p style={{ fontSize: '0.6875rem', color: '#8A7060', fontFamily: 'Satoshi', fontWeight: 500, marginBottom: 2 }}>Payé</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: '#15803D', fontFamily: 'Satoshi', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {(order.deposit || 0).toFixed(2)} €
              </p>
            </div>
            {/* Reste */}
            <div className="flex-1 px-4 py-3" style={{ borderLeft: '1px solid rgba(67,47,46,0.07)', borderRight: '1px solid rgba(67,47,46,0.07)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: reste > 0 ? 'rgba(237,210,60,0.25)' : 'rgba(21,128,61,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={reste > 0 ? '#92400E' : '#15803D'} strokeWidth="2.2" strokeLinecap="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M12 9v6M9 12h6"/>
                </svg>
              </div>
              <p style={{ fontSize: '0.6875rem', color: '#8A7060', fontFamily: 'Satoshi', fontWeight: 500, marginBottom: 2 }}>Reste à payer</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: reste > 0 ? '#92400E' : '#15803D', fontFamily: 'Satoshi', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {reste.toFixed(2)} €
              </p>
            </div>
            {/* Total */}
            <div className="flex-1 px-4 py-3">
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(67,47,46,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              </div>
              <p style={{ fontSize: '0.6875rem', color: '#8A7060', fontFamily: 'Satoshi', fontWeight: 500, marginBottom: 2 }}>Total</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {order.totalAmount.toFixed(2)} €
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Zone 4 : Footer ── */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(67,47,46,0.07)' }}>
        {hasPay ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.3rem 0.75rem', borderRadius: 9999, backgroundColor: reste === 0 ? 'rgba(21,128,61,0.1)' : 'rgba(237,210,60,0.3)', color: reste === 0 ? '#15803D' : '#92400E', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Satoshi' }}>
            {reste === 0 ? '✓ Soldé' : 'Solde partiel'}
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={onOpen}
          className="flex items-center gap-1 active:opacity-70"
          style={{ padding: '0.3rem 0.875rem', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.65)', color: '#432F2E', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Satoshi', border: 'none', cursor: 'pointer' }}
        >
          Voir le détail
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ── Bottom sheet détail ─────────────────────────────────────────────── */
function OrderSheet({ order, onClose }) {
  const pickup = parseISO(order.pickupDate)
  const reste  = (order.totalAmount || 0) - (order.deposit || 0)

  const handleStatus = async (newStatus) => {
    await setStatus(order.id, newStatus)
    if (newStatus === 'done')  toast.success(`${order.clientName} — commande récupérée`)
    if (newStatus === 'ready') toast('Statut annulé')
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(17,17,17,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50 animate-slide-up"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px 24px 0 0',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 40px rgba(67,47,46,0.15)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="rounded-full"
            style={{ width: 36, height: 4, backgroundColor: 'rgba(67,47,46,0.12)' }}
          />
        </div>

        {/* Header */}
        <div
          className="px-5 pt-1 pb-4"
          style={{ borderBottom: '1px solid rgba(67,47,46,0.07)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="label-xs mb-2">Retrait</p>
              <p
                style={{
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  letterSpacing: '-0.035em',
                  color: '#111111',
                  lineHeight: 1,
                  fontFamily: 'Satoshi',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {format(pickup, 'HH:mm')}
              </p>
              <p
                className="text-sm capitalize mt-1.5"
                style={{ color: '#8A7060', fontWeight: 500, fontFamily: 'Satoshi' }}
              >
                {format(pickup, 'EEEE d MMMM', { locale: fr })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <StatusBadge status={order.status} />
              <button
                onClick={onClose}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.375rem 0.75rem',
                  borderRadius: 9999,
                  backgroundColor: 'rgba(67,47,46,0.07)',
                  color: '#8A7060',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Satoshi',
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>

          {/* Client */}
          <div>
            <p className="label-xs mb-1.5">Client</p>
            <p style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>
              {order.clientName}
            </p>
            {order.clientPhone && (
              <a
                href={`tel:${order.clientPhone}`}
                style={{ fontSize: '0.875rem', color: '#8A7060', textDecoration: 'underline', display: 'block', marginTop: 2 }}
              >
                {order.clientPhone}
              </a>
            )}
          </div>

          {/* Commande */}
          <div
            className="rounded-2xl px-4 py-3.5"
            style={{ backgroundColor: 'rgba(67,47,46,0.04)' }}
          >
            <p className="label-xs mb-2">Commande</p>
            <p style={{ fontWeight: 600, color: '#111111', lineHeight: 1.5, fontFamily: 'Satoshi' }}>
              {order.articles}
            </p>
          </div>

          {/* Paiement */}
          {order.totalAmount > 0 && (
            <div
              className="rounded-2xl px-4 py-3.5"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(67,47,46,0.08)',
              }}
            >
              <p className="label-xs mb-3">Paiement</p>
              <div className="flex gap-6">
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginBottom: 2 }}>Total</p>
                  <p style={{ fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>{order.totalAmount} €</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginBottom: 2 }}>Acompte</p>
                  <p style={{ fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>{order.deposit || 0} €</p>
                </div>
                {reste > 0 ? (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginBottom: 2 }}>Reste</p>
                    <p style={{ fontWeight: 700, color: '#92400E', fontFamily: 'Satoshi' }}>{reste} €</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginBottom: 2 }}>Solde</p>
                    <p style={{ fontWeight: 700, color: '#166534', fontFamily: 'Satoshi' }}>Soldé ✓</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div
              className="rounded-2xl px-4 py-3 flex gap-2.5"
              style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
            >
              <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>⚠</span>
              <p style={{ fontSize: '0.8125rem', lineHeight: 1.5, color: '#92400E', fontFamily: 'Satoshi' }}>
                {order.notes}
              </p>
            </div>
          )}

          {/* Actions statut */}
          {(order.status === 'ready' || order.status === 'done') && (
            <div className="flex gap-2.5 pt-1 pb-2">
              <button
                onClick={() => handleStatus('ready')}
                className="flex-1 transition-all active:scale-95"
                style={{
                  padding: '0.875rem',
                  borderRadius: 14,
                  backgroundColor: order.status !== 'done' ? 'rgba(67,47,46,0.07)' : 'rgba(67,47,46,0.04)',
                  color: order.status !== 'done' ? '#432F2E' : '#B0A090',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Satoshi',
                }}
              >
                Pas encore
              </button>
              <button
                onClick={() => handleStatus('done')}
                className="flex-1 transition-all active:scale-95"
                style={{
                  padding: '0.875rem',
                  borderRadius: 14,
                  backgroundColor: order.status === 'done' ? '#432F2E' : 'rgba(67,47,46,0.07)',
                  color: order.status === 'done' ? '#FFFFFF' : '#8A7060',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Satoshi',
                }}
              >
                Récupérée ✓
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
