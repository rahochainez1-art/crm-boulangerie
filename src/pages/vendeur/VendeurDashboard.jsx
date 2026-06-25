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

const STATUS_META = {
  todo:       { accentColor: '#EDD83D' },
  inprogress: { accentColor: '#432F2E' },
  ready:      { accentColor: '#10B981' },
  done:       { accentColor: '#E5E7EB' },
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
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#F5F2EB' }}>

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
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(67,47,46,0.08)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(67,47,46,0.06)',
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
                textColor: kpiReady > 0 ? '#065F46' : '#B0A090',
                bg: kpiReady > 0 ? '#D1FAE5' : null,
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
                  borderRight: i < 2 ? '1px solid rgba(67,47,46,0.08)' : 'none',
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
                      ? '#111111'
                      : isToday
                      ? 'rgba(67,47,46,0.06)'
                      : 'rgba(255,255,255,0.6)',
                    border: isSelected
                      ? 'none'
                      : isToday
                      ? '1.5px solid rgba(67,47,46,0.2)'
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
                  backgroundColor: isActive ? '#432F2E' : 'rgba(67,47,46,0.07)',
                  color: isActive ? '#FFFFFF' : '#8A7060',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: 'none',
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
                backgroundColor: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(67,47,46,0.07)',
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
  const reste = (order.totalAmount || 0) - (order.deposit || 0)
  const meta  = STATUS_META[order.status] ?? STATUS_META.todo

  return (
    <button
      onClick={onOpen}
      className="w-full text-left transition-all active:scale-[0.99] active:opacity-90 animate-fade-up"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid rgba(67,47,46,0.08)',
        borderLeft: `3px solid ${meta.accentColor}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(67,47,46,0.06)',
        opacity: order.status === 'done' ? 0.55 : 1,
        overflow: 'hidden',
        animationDelay: `${index * 0.04}s`,
      }}
    >
      <div className="px-4 py-4">

        {/* Heure + badge */}
        <div className="flex items-start justify-between mb-2.5">
          <span
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: order.status === 'done' ? '#B0A090' : '#111111',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontFamily: 'Satoshi',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </span>
          <StatusBadge status={order.status} />
        </div>

        {/* Nom client */}
        <p
          style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: order.status === 'done' ? '#B0A090' : '#111111',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'Satoshi',
            marginBottom: '0.25rem',
          }}
        >
          {order.clientName}
        </p>

        {/* Articles */}
        <p
          style={{
            fontSize: '0.8125rem',
            color: '#8A7060',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'Satoshi',
          }}
        >
          {order.articles}
        </p>

        {/* Paiement */}
        {order.status !== 'done' && reste > 0 && (
          <div className="flex items-center gap-1.5" style={{ marginTop: '0.625rem' }}>
            <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: '#F59E0B', flexShrink: 0, display: 'block' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E', fontFamily: 'Satoshi' }}>
              {reste} € à encaisser
            </span>
          </div>
        )}
        {order.status !== 'done' && reste === 0 && order.totalAmount > 0 && (
          <div className="flex items-center gap-1.5" style={{ marginTop: '0.625rem' }}>
            <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: '#22C55E', flexShrink: 0, display: 'block' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', fontFamily: 'Satoshi' }}>
              Soldé ✓
            </span>
          </div>
        )}
      </div>
    </button>
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
