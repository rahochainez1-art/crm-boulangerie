import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay, isSameMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth, addMonths, subMonths,
  addDays, differenceInHours,
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
const IconClipboard = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
    <path d="M9 12h6M9 16h4"/>
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
const IconAlertCircle = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

// ── Icônes nav ────────────────────────────────────────────────────────────
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

// ── KPI strip (4 colonnes) ─────────────────────────────────────────────────
function StatWidgets({ orders }) {
  const today      = new Date()
  const todayCount = orders.filter(o =>
    o.pickupDate && isSameDay(parseISO(o.pickupDate), today) && o.status !== 'cancelled'
  ).length
  const inProgress = orders.filter(o => o.status === 'inprogress').length
  const ready      = orders.filter(o => o.status === 'ready').length
  const urgent     = orders.filter(o => {
    if (!o.pickupDate || o.status === 'done' || o.status === 'cancelled') return false
    const h = differenceInHours(parseISO(o.pickupDate), today)
    return h >= 0 && h <= 24 && o.status !== 'ready'
  }).length

  const kpis = [
    { label: "Aujourd'hui", value: todayCount, iconBg: '#FFF8D6', iconColor: '#432F2E', Icon: IconClipboard },
    { label: 'En cours',    value: inProgress, iconBg: '#FFF8D6', iconColor: '#92400E', Icon: IconHourglass },
    { label: 'Prêtes',      value: ready,      iconBg: '#DCFCE7', iconColor: '#166534', Icon: IconCheckCircle },
    { label: 'Urgentes',    value: urgent,     iconBg: '#FEE2E2', iconColor: '#DC2626', Icon: IconAlertCircle, urgent: urgent > 0 },
  ]

  return (
    <div className="grid grid-cols-4 gap-2 mb-5">
      {kpis.map((k, i) => (
        <div
          key={k.label}
          className="rounded-[16px] p-3 flex flex-col items-center animate-fade-up"
          style={{
            backgroundColor: '#FFFFFF',
            border: k.urgent ? '1px solid rgba(220,38,38,0.18)' : '1px solid rgba(67,47,46,0.07)',
            boxShadow: k.urgent
              ? '0 2px 12px rgba(220,38,38,0.08)'
              : '0 2px 12px rgba(67,47,46,0.05)',
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <div
            className="flex items-center justify-center mb-2"
            style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: k.iconBg, color: k.iconColor }}
          >
            <k.Icon />
          </div>
          <p style={{ fontSize: '0.5625rem', fontWeight: 600, color: k.urgent ? '#DC2626' : '#8A7060', fontFamily: 'Satoshi', textAlign: 'center', lineHeight: 1.3, marginBottom: 3 }}>
            {k.label}
          </p>
          <p className="font-display" style={{ fontSize: '1.5rem', color: k.urgent ? '#DC2626' : '#111111', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {k.value}
          </p>
          <p style={{ fontSize: '0.5rem', color: k.urgent ? '#DC2626' : '#B0A090', fontFamily: 'Satoshi', marginTop: 2 }}>
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
        <p className="capitalize font-satoshi" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111111' }}>
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
              className="flex flex-col items-center py-1.5 rounded-xl transition-all active:scale-95"
              style={{
                backgroundColor: isSelected ? '#432F2E' : isToday ? '#FFF0B5' : 'transparent',
                opacity: inMonth ? 1 : 0.12,
              }}
            >
              <span style={{
                fontSize: '0.8125rem',
                fontWeight: isSelected || isToday ? 700 : 500,
                color: isSelected ? '#FFFFFF' : '#111111',
                fontFamily: 'Satoshi',
                lineHeight: 1.3,
              }}>
                {format(day, 'd')}
              </span>
              <div className="h-3 flex items-center justify-center mt-0.5">
                {count > 0 && (
                  <span style={{
                    fontSize: 8, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.22)' : '#EDD83D',
                    color: isSelected ? '#fff' : '#4A4E10',
                    minWidth: 14, height: 14, padding: '0 3px',
                    borderRadius: 9999, fontFamily: 'Satoshi',
                  }}>
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

// ── Carte commande (liste compacte) ───────────────────────────────────────
function OrderCard({ order, expanded, onToggle }) {
  const reste  = (order.totalAmount || 0) - (order.deposit || 0)
  const isDone = order.status === 'done'

  return (
    <div
      className="rounded-[18px] overflow-hidden mb-2.5 animate-fade-up"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(67,47,46,0.07)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(67,47,46,0.04)',
        opacity: isDone ? 0.55 : 1,
      }}
    >
      <button
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-black/[0.015]"
        onClick={onToggle}
      >
        {/* Heure badge */}
        <div
          className="flex-shrink-0"
          style={{ backgroundColor: '#FFF0B5', padding: '0.3rem 0.55rem', borderRadius: 10 }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#432F2E', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums' }}>
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </span>
        </div>

        {/* Nom + article */}
        <div className="flex-1 min-w-0">
          <p style={{ fontWeight: 700, color: '#111111', fontSize: '0.9375rem', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.articles}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.clientName}
          </p>
        </div>

        <StatusBadge status={order.status} />

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
        <div className="px-5 pb-5 pt-4 space-y-4" style={{ borderTop: '1px solid rgba(67,47,46,0.06)' }}>

          <div>
            <p className="label-xs mb-1.5">Articles</p>
            <p style={{ fontSize: '0.875rem', color: '#111111', lineHeight: 1.5, fontFamily: 'Satoshi' }}>
              {order.articles}
            </p>
          </div>

          {order.totalAmount > 0 && (
            <div>
              <p className="label-xs mb-2">Paiement</p>
              <div className="flex gap-6">
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Total</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi', marginTop: 2 }}>{order.totalAmount} €</p>
                </div>
                {order.deposit > 0 && (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Acompte</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi', marginTop: 2 }}>{order.deposit} €</p>
                  </div>
                )}
                {reste > 0 && (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Reste dû</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400E', fontFamily: 'Satoshi', marginTop: 2 }}>{reste} €</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-6">
            {order.assignedTo && (
              <div>
                <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginBottom: 2 }}>Assigné à</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111111', fontFamily: 'Satoshi' }}>
                  {Array.isArray(order.assignedTo)
                    ? order.assignedTo.map(p => ASSIGNED[p] ?? p).join(' + ')
                    : (ASSIGNED[order.assignedTo] ?? order.assignedTo)}
                </p>
              </div>
            )}
            {order.clientPhone && (
              <div>
                <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginBottom: 2 }}>Téléphone</p>
                <a href={`tel:${order.clientPhone}`} style={{ fontSize: '0.875rem', fontWeight: 500, color: '#432F2E', textDecoration: 'underline', fontFamily: 'Satoshi' }}>
                  {order.clientPhone}
                </a>
              </div>
            )}
          </div>

          {order.notes && (
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E', fontFamily: 'Satoshi' }}>⚠ {order.notes}</p>
            </div>
          )}

          {order.statusHistory?.length > 0 && (
            <div>
              <p className="label-xs mb-2">Historique</p>
              <div className="space-y-2">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: i === 0 ? '#EDD83D' : 'rgba(67,47,46,0.15)' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>{STATUS_LABELS[h.status]}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>
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
        {[
          { label: 'Récupérées', value: done.length, sub: 'commandes', dot: '#10B981' },
          { label: 'CA encaissé', value: `${revenue}€`, sub: 'toutes périodes', dot: '#EDD83D' },
        ].map((w, i) => (
          <div key={i} className="rounded-[20px] p-5 flex flex-col animate-fade-up"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(67,47,46,0.06)', minHeight: 108 }}>
            <div className="flex items-center gap-1.5 mb-auto">
              <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: w.dot, display: 'block' }} />
              <p className="label-xs">{w.label}</p>
            </div>
            <p className="font-display" style={{ fontSize: '2.25rem', color: '#111111', letterSpacing: '-0.03em', lineHeight: 1, marginTop: '0.625rem' }}>{w.value}</p>
            <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 4 }}>{w.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="font-display" style={{ fontSize: '1rem', color: '#111111' }}>Historique</p>
        <span className="label-xs">{done.length}</span>
      </div>

      {done.length === 0 ? (
        <div className="rounded-[20px] text-center py-16 animate-fade-up"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: 8, color: '#B0A090' }}>—</p>
          <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Aucune commande récupérée</p>
        </div>
      ) : (
        [...done].sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate)).map(o => (
          <div key={o.id} className="rounded-[18px] px-4 py-3.5 mb-2.5 flex items-center gap-3 animate-fade-up"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111111', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.articles}</p>
              <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{o.clientName}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums' }}>
                {format(parseISO(o.pickupDate), 'dd MMM', { locale: fr })}
              </p>
              {o.totalAmount > 0 && (
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', marginTop: 2 }}>{o.totalAmount}€</p>
              )}
            </div>
          </div>
        ))
      )}
    </>
  )
}

// ── Nav ───────────────────────────────────────────────────────────────────
const ACTIVE   = '#111111'
const INACTIVE = '#B0A090'
const NAV_ITEMS = [
  { id: 'home',     label: 'Accueil',  Icon: IconHome },
  { id: 'toutes',   label: 'Toutes',   Icon: IconList },
  { id: 'analyses', label: 'Analyses', Icon: IconAnalytics },
  { id: 'reglages', label: 'Réglages', Icon: IconSettings },
]

// ── Manager Dashboard ─────────────────────────────────────────────────────
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
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>

      {/* ── Header avec illustration ── */}
      <header
        className="px-5 pb-3"
        style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-start justify-between animate-fade-up">
          <div className="flex-1 pr-2 pt-1">
            <p className="label-xs mb-3">Au Grand Jour · Manager</p>
            <h1
              className="font-display"
              style={{ fontSize: '2rem', color: '#111111', letterSpacing: '-0.025em', lineHeight: 1.1 }}
            >
              {prenom ? `Bonjour ${prenom} 👋` : 'Bonjour 👋'}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#8A7060', marginTop: 6, fontFamily: 'Satoshi', fontWeight: 500 }}>
              {weekCount > 0
                ? `${weekCount} commande${weekCount > 1 ? 's' : ''} cette semaine`
                : 'Aucune commande cette semaine'}
            </p>
          </div>
          <div style={{ width: 128, height: 118, flexShrink: 0 }}>
            <IllustrationBoulangerie />
          </div>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="flex-1 px-4 pt-2 pb-36 overflow-y-auto">

        {tab === 'home' && (
          <>
            <StatWidgets orders={orders} />

            <MonthCalendar
              orders={orders}
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
              <div className="rounded-[20px] text-center py-14 animate-fade-up delay-200"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)' }}>
                <p style={{ fontSize: '1.5rem', color: '#B0A090', marginBottom: 8 }}>—</p>
                <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Aucune commande ce jour</p>
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

      {/* ── Bottom nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          backgroundColor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div
          className="max-w-lg mx-auto"
          style={{
            borderTop: '1px solid rgba(67,47,46,0.08)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 6px)',
          }}
        >
          <div className="flex items-end pt-3 pb-1">

            {NAV_ITEMS.slice(0, 2).map(item => {
              const active = tab === item.id
              return (
                <button key={item.id} onClick={() => changeTab(item.id)}
                  className="flex-1 flex flex-col items-center gap-0.5 pb-1 transition-colors"
                  style={{ color: active ? ACTIVE : INACTIVE }}>
                  <item.Icon />
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? ACTIVE : INACTIVE, fontFamily: 'Satoshi', letterSpacing: '0.01em' }}>
                    {item.label}
                  </span>
                  <span style={{ width: active ? 16 : 0, height: 2, borderRadius: 9999, backgroundColor: '#432F2E', marginTop: 2, transition: 'width 0.2s cubic-bezier(0.16,1,0.3,1)', display: 'block' }} />
                </button>
              )
            })}

            {/* FAB */}
            <button
              onClick={() => navigate('/vendeur/nouvelle-commande')}
              className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ backgroundColor: '#432F2E', boxShadow: '0 8px 24px rgba(67,47,46,0.35)', transform: 'translateY(-14px)', marginBottom: -14 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5"  y1="12" x2="19" y2="12"/>
              </svg>
            </button>

            {NAV_ITEMS.slice(2).map(item => {
              const active = tab === item.id
              return (
                <button key={item.id} onClick={() => changeTab(item.id)}
                  className="flex-1 flex flex-col items-center gap-0.5 pb-1 transition-colors"
                  style={{ color: active ? ACTIVE : INACTIVE }}>
                  <item.Icon />
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? ACTIVE : INACTIVE, fontFamily: 'Satoshi', letterSpacing: '0.01em' }}>
                    {item.label}
                  </span>
                  <span style={{ width: active ? 16 : 0, height: 2, borderRadius: 9999, backgroundColor: '#432F2E', marginTop: 2, transition: 'width 0.2s cubic-bezier(0.16,1,0.3,1)', display: 'block' }} />
                </button>
              )
            })}

          </div>
        </div>
      </nav>

    </div>
  )
}
