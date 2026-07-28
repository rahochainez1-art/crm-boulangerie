import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay,
  startOfWeek, endOfWeek, eachDayOfInterval, addWeeks,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import { subscribeOrders, setStatus } from '../../lib/orders'
import { getPrenom } from '../../lib/settings'
import StatusBadge from '../../components/ui/StatusBadge'

const TABS = [
  { id: 'all',   label: 'Toutes' },
  { id: 'ready', label: 'Prêtes' },
  { id: 'done',  label: 'Récupérées' },
]

const STATUS_LABEL = { todo: 'à faire', inprogress: 'en cours', ready: 'prête' }

// Retrouve le statut réellement fixé par la pâtissière avant la dernière récupération,
// pour ne jamais afficher "Prête" si elle ne l'a pas actualisé elle-même.
function getPreviousStatus(order) {
  if (!Array.isArray(order.statusHistory) || order.statusHistory.length === 0) return 'todo'
  const idx = order.statusHistory.map(h => h.status).lastIndexOf('done')
  if (idx <= 0) return 'todo'
  return order.statusHistory[idx - 1].status
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
    tab === 'ready' ? dayOrders.filter(o => o.status === 'ready') :
    tab === 'done'  ? dayOrders.filter(o => o.status === 'done') :
    dayOrders
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
              style={{ fontSize: 'clamp(1.75rem, 7vw, 2.25rem)', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.02em', lineHeight: 1.15 }}
            >
              {greeting(prenom)}
            </h1>
            <p
              className="capitalize"
              style={{ fontSize: '0.8125rem', color: '#8A7060', fontWeight: 500, fontFamily: 'Satoshi', marginTop: 4 }}
            >
              {format(new Date(), 'EEEE d MMMM', { locale: fr })}
            </p>
          </div>
          <div
            className="rounded-full flex items-center justify-center flex-shrink-0 animate-fade-up"
            style={{ width: 48, height: 48, backgroundColor: '#432F2E' }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', fontFamily: 'Satoshi' }}>
              {initiale}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-28">

        {/* ── KPI Strip ───────────────────────────────────────────── */}
        <div className="px-5 mb-5">
          <div
            className="flex rounded-[24px] overflow-hidden"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(67,47,46,0.08)',
              boxShadow: '0 2px 16px rgba(67,47,46,0.05)',
            }}
          >
            {[
              { count: kpiTodo,  label: 'À préparer' },
              { count: kpiReady, label: 'Prêtes' },
              { count: kpiDone,  label: 'Récupérées' },
            ].map((kpi, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center py-4"
                style={{ borderRight: i < 2 ? '1px solid rgba(67,47,46,0.08)' : 'none' }}
              >
                <span
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: kpi.count > 0 ? '#111111' : '#C0B8A8',
                    fontFamily: 'Satoshi',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {kpi.count}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 500,
                    color: '#8A7060',
                    fontFamily: 'Satoshi',
                    marginTop: 5,
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
                    backgroundColor: isSelected ? '#432F2E' : '#FFFFFF',
                    border: isSelected
                      ? 'none'
                      : isToday
                      ? '1.5px solid rgba(67,47,46,0.35)'
                      : '1px solid rgba(67,47,46,0.08)',
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
                      width: 5,
                      height: 5,
                      borderRadius: 9999,
                      marginTop: 5,
                      backgroundColor: hasOrders
                        ? isSelected ? 'rgba(255,255,255,0.5)' : '#FFF0B5'
                        : 'transparent',
                      border: hasOrders && !isSelected ? '1px solid rgba(67,47,46,0.25)' : 'none',
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
            const count = t.id === 'all' ? dayOrders.length : t.id === 'ready' ? kpiReady : kpiDone
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-shrink-0 active:scale-95 transition-transform"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 9999,
                  backgroundColor: isActive ? '#432F2E' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#432F2E',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: isActive ? 'none' : '1.5px solid #FFF0B5',
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
            style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.01em' }}
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
                backgroundColor: '#F5F2EB',
                border: '1px solid rgba(67,47,46,0.06)',
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
  const [busy, setBusy] = useState(false)
  const reste  = (order.totalAmount || 0) - (order.deposit || 0)
  const isDone = order.status === 'done'
  const hasPay = order.totalAmount > 0
  const isToday = (() => { try { return isSameDay(parseISO(order.pickupDate), new Date()) } catch { return false } })()

  const recoveredAt = useMemo(() => {
    if (!isDone || !Array.isArray(order.statusHistory)) return null
    const doneEntries = order.statusHistory.filter(h => h.status === 'done')
    const last = doneEntries[doneEntries.length - 1]
    if (!last) return null
    try { return parseISO(last.at) } catch { return null }
  }, [isDone, order.statusHistory])

  // Palette : blanc pour une commande active, gris-beige chaud une fois récupérée
  const c = isDone
    ? { cardBg: '#F3F0EC', cardBorder: '#DED8D2', chip: '#E8E3DE', textPrimary: '#746B65', textSecondary: '#968C85' }
    : { cardBg: '#FFFFFF', cardBorder: 'rgba(67,47,46,0.08)', chip: '#E5F0F5', textPrimary: '#111111', textSecondary: '#8A7060' }

  const handleMarkDone = async (e) => {
    e.stopPropagation()
    if (busy || isDone) return
    setBusy(true)
    try {
      await setStatus(order.id, 'done')
      toast.success('Commande marquée comme récupérée')
    } finally { setBusy(false) }
  }

  const handleUndo = async (e) => {
    e.stopPropagation()
    if (busy || !isDone) return
    setBusy(true)
    try {
      const prevStatus = getPreviousStatus(order)
      await setStatus(order.id, prevStatus)
      toast(`Statut annulé — commande remise « ${STATUS_LABEL[prevStatus]} »`)
    } finally { setBusy(false) }
  }

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onOpen() }}
      className="animate-fade-up active:scale-[0.99] transition-transform"
      style={{
        backgroundColor: c.cardBg,
        borderRadius: 22,
        border: `1px solid ${c.cardBorder}`,
        boxShadow: isDone ? 'none' : '0 2px 16px rgba(67,47,46,0.05)',
        overflow: 'hidden',
        cursor: 'pointer',
        animationDelay: `${index * 0.045}s`,
      }}
    >
      {/* ── Zone 1 : Heure pill + Statut ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-4">
        <div style={{ backgroundColor: c.chip, borderRadius: 14, padding: '9px 13px' }}>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.textPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
            </svg>
            <span style={{ fontSize: '1.375rem', fontWeight: 800, color: c.textPrimary, fontFamily: 'Satoshi', letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {format(parseISO(order.pickupDate), 'HH:mm')}
            </span>
          </div>
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: c.textSecondary, fontFamily: 'Satoshi', marginTop: 3 }}>
            {isToday ? "Aujourd'hui" : format(parseISO(order.pickupDate), 'EEE d MMM', { locale: fr })}
          </p>
        </div>
        {isDone ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.7rem', borderRadius: 9999, backgroundColor: '#E8F0E4', color: '#52764B', fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'Satoshi', flexShrink: 0 }}>
            <CheckCircle2 size={12} strokeWidth={2.4} />
            Récupérée
          </span>
        ) : (
          <StatusBadge status={order.status} />
        )}
      </div>

      {/* Séparateur */}
      <div style={{ height: 1, backgroundColor: c.cardBorder, margin: '0 16px' }} />

      {/* ── Zone 2 : Client + Articles ── */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: '1.625rem', fontWeight: 800, color: c.textPrimary, fontFamily: 'Satoshi', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 4 }}>
              {order.clientName}
            </p>
            <p style={{ fontSize: '0.875rem', color: c.textSecondary, fontFamily: 'Satoshi' }}>
              {order.articles}
            </p>
          </div>
          {order.clientPhone && (
            <a
              href={`tel:${order.clientPhone}`}
              onClick={e => e.stopPropagation()}
              className="flex-shrink-0 flex items-center justify-center active:opacity-70"
              style={{ width: 38, height: 38, borderRadius: 9999, backgroundColor: isDone ? c.chip : '#F5F2EB', color: c.textPrimary }}
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
          <div style={{ height: 1, backgroundColor: c.cardBorder, margin: '0 16px' }} />
          <div className="flex">
            {/* Payé */}
            <div className="flex-1 px-4 py-3">
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.textPrimary} strokeWidth="2.2" strokeLinecap="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <p style={{ fontSize: '0.6875rem', color: c.textSecondary, fontFamily: 'Satoshi', fontWeight: 500, marginBottom: 2 }}>Payé</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: c.textPrimary, fontFamily: 'Satoshi', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {(order.deposit || 0).toFixed(2)} €
              </p>
            </div>
            {/* Reste */}
            <div className="flex-1 px-4 py-3" style={{ borderLeft: `1px solid ${c.cardBorder}`, borderRight: `1px solid ${c.cardBorder}` }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: isDone ? c.chip : '#FFF0B5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.textPrimary} strokeWidth="2.2" strokeLinecap="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M12 9v6M9 12h6"/>
                </svg>
              </div>
              <p style={{ fontSize: '0.6875rem', color: c.textSecondary, fontFamily: 'Satoshi', fontWeight: 500, marginBottom: 2 }}>Reste à payer</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: c.textPrimary, fontFamily: 'Satoshi', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {reste.toFixed(2)} €
              </p>
            </div>
            {/* Total */}
            <div className="flex-1 px-4 py-3">
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.textPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              </div>
              <p style={{ fontSize: '0.6875rem', color: c.textSecondary, fontFamily: 'Satoshi', fontWeight: 500, marginBottom: 2 }}>Total</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: c.textPrimary, fontFamily: 'Satoshi', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {order.totalAmount.toFixed(2)} €
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Zone 4 : Footer ── */}
      {isDone ? (
        <div className="flex items-center gap-2" style={{ margin: '0 16px 16px', marginTop: 12 }}>
          <div
            className="flex items-center justify-center gap-1.5 flex-1 min-w-0"
            style={{ backgroundColor: '#EEF2E9', border: '1px solid rgba(82,118,75,0.18)', borderRadius: 14, padding: '10px 12px' }}
          >
            <CheckCircle2 size={13} strokeWidth={2.4} color="#52764B" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52764B', fontFamily: 'Satoshi', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Commande récupérée{recoveredAt ? ` le ${format(recoveredAt, 'dd/MM à HH:mm')}` : ''}
            </span>
          </div>
          <button
            onClick={handleUndo}
            disabled={busy}
            title="Annuler — remettre en attente"
            aria-label="Annuler — remettre en attente"
            className="flex-shrink-0 flex items-center justify-center active:opacity-70 disabled:opacity-50"
            style={{ width: 38, height: 38, borderRadius: 9999, backgroundColor: '#F3F0EC', border: '1px solid #DED8D2', color: '#746B65', cursor: 'pointer' }}
          >
            <RotateCcw size={15} strokeWidth={2.2} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-3 gap-2" style={{ borderTop: '1px solid rgba(67,47,46,0.07)' }}>
          {hasPay ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.3rem 0.75rem', borderRadius: 9999, backgroundColor: reste === 0 ? '#E5F0F5' : '#FFF0B5', color: '#432F2E', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Satoshi', flexShrink: 0 }}>
              {reste === 0 ? '✓ Soldé' : 'Solde partiel'}
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={handleMarkDone}
            disabled={busy}
            className="flex items-center gap-1.5 active:opacity-80 disabled:opacity-50"
            style={{ padding: '0.375rem 1rem', borderRadius: 9999, backgroundColor: '#FFFFFF', color: '#432F2E', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Satoshi', border: '1.5px solid #FFF0B5', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <CheckCircle2 size={14} strokeWidth={2.3} />
            {busy ? 'Mise à jour…' : 'Marquer comme récupérée'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Bottom sheet détail ─────────────────────────────────────────────── */
function OrderSheet({ order, onClose }) {
  const pickup = parseISO(order.pickupDate)
  const reste  = (order.totalAmount || 0) - (order.deposit || 0)

  const handleStatus = async (newStatus) => {
    if (newStatus === 'done') {
      await setStatus(order.id, 'done')
      toast.success(`${order.clientName} — commande récupérée`)
    } else {
      const prevStatus = getPreviousStatus(order)
      await setStatus(order.id, prevStatus)
      toast(`Statut annulé — commande remise « ${STATUS_LABEL[prevStatus]} »`)
    }
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
                    <p style={{ fontWeight: 700, color: '#432F2E', fontFamily: 'Satoshi' }}>{reste} €</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginBottom: 2 }}>Solde</p>
                    <p style={{ fontWeight: 700, color: '#432F2E', fontFamily: 'Satoshi' }}>Soldé ✓</p>
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
                onClick={() => handleStatus('undo')}
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
