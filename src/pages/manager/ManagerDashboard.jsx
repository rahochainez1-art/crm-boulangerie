import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay, isSameMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth, addMonths, subMonths,
  addDays, subDays, differenceInHours,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { subscribeOrders, isAssignedTo } from '../../lib/orders'
import { getPrenom } from '../../lib/settings'

const ASSIGNED = {
  patissiere:  'Pâtisserie',
  boulangerie: 'Boulangerie',
  vendeur:     'Vendeur·se',
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

// ── Icônes ────────────────────────────────────────────────────────────────
const IconClipboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
    <path d="M9 12h6M9 16h4"/>
  </svg>
)
const IconHourglass = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 22h14M5 2h14"/>
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
  </svg>
)
const IconCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IconAlertCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconCalendar = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8"  y1="2" x2="8"  y2="6"/>
    <line x1="3"  y1="10" x2="21" y2="10"/>
  </svg>
)
const IconAlertSmall = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconCakeSmall = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
    <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
    <path d="M2 21h20"/>
    <path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/>
    <circle cx="12" cy="6" r="1" fill="#432F2E"/>
  </svg>
)
const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)
const IconList = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6"  x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

// ── Chip info header ───────────────────────────────────────────────────────
function Chip({ icon, label, urgent }) {
  return (
    <div
      className="inline-flex items-center gap-1.5"
      style={{
        padding: '0.28rem 0.65rem',
        borderRadius: 9999,
        backgroundColor: urgent ? '#FEE2E2' : '#F5F2EB',
        border: `1px solid ${urgent ? 'rgba(220,38,38,0.2)' : 'rgba(67,47,46,0.09)'}`,
      }}
    >
      <span style={{ color: urgent ? '#DC2626' : '#8A7060', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: urgent ? '#DC2626' : '#432F2E', fontFamily: 'Satoshi', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  )
}

// ── KPI Strip ─────────────────────────────────────────────────────────────
function KpiStrip({ orders }) {
  const today     = new Date()
  const yesterday = subDays(today, 1)

  const todayAll      = orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), today) && o.status !== 'cancelled')
  const yesterdayAll  = orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), yesterday) && o.status !== 'cancelled')
  const todayDiff     = todayAll.length - yesterdayAll.length

  const inProg        = orders.filter(o => o.status === 'inprogress')
  const patisInProg   = inProg.filter(o => isAssignedTo(o, 'patissiere')).length
  const boulaInProg   = inProg.filter(o => isAssignedTo(o, 'boulangerie')).length

  const readyNow      = orders.filter(o => o.status === 'ready').length
  const readyYesterday = orders.filter(o => {
    if (o.status !== 'ready') return false
    const h = o.statusHistory?.find(h => h.status === 'ready')
    if (!h) return false
    return isSameDay(parseISO(h.at), yesterday)
  }).length
  const readyDiff = readyNow - readyYesterday

  const urgentOrders = todayAll.filter(o => {
    if (o.status === 'done' || o.status === 'cancelled') return false
    const h = differenceInHours(parseISO(o.pickupDate), today)
    return h <= 2
  })

  const kpis = [
    {
      Icon: IconClipboard,
      iconBg: '#FFF8D6', iconColor: '#92400E',
      value: todayAll.length,
      label: "Aujourd'hui",
      detail: todayDiff !== 0 ? (
        <span style={{ color: todayDiff > 0 ? '#10B981' : '#EF4444', fontSize: '0.625rem', fontWeight: 600, fontFamily: 'Satoshi' }}>
          {todayDiff > 0 ? `+${todayDiff}` : todayDiff} vs hier {todayDiff > 0 ? '↗' : '↘'}
        </span>
      ) : null,
    },
    {
      Icon: IconHourglass,
      iconBg: '#FFF8D6', iconColor: '#92400E',
      value: inProg.length,
      label: 'En cours',
      detail: (
        <div style={{ marginTop: 6 }}>
          {patisInProg > 0 && (
            <div className="flex items-center gap-1 mb-0.5">
              <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: '#F472B6', display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: '0.6rem', color: '#8A7060', fontFamily: 'Satoshi' }}>{patisInProg} pâtisserie</span>
            </div>
          )}
          {boulaInProg > 0 && (
            <div className="flex items-center gap-1">
              <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: '#EDD83D', display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: '0.6rem', color: '#8A7060', fontFamily: 'Satoshi' }}>{boulaInProg} boulangerie</span>
            </div>
          )}
        </div>
      ),
    },
    {
      Icon: IconCheckCircle,
      iconBg: '#DCFCE7', iconColor: '#166534',
      value: readyNow,
      label: 'Prêtes',
      detail: readyDiff !== 0 ? (
        <span style={{ color: '#10B981', fontSize: '0.625rem', fontWeight: 600, fontFamily: 'Satoshi' }}>
          {readyDiff > 0 ? `+${readyDiff}` : readyDiff} vs hier ↗
        </span>
      ) : null,
    },
    {
      Icon: IconAlertCircle,
      iconBg: '#FEE2E2', iconColor: '#DC2626',
      value: urgentOrders.length,
      label: 'Urgentes',
      urgent: urgentOrders.length > 0,
      detail: urgentOrders.length > 0 ? (
        <span style={{ color: '#DC2626', fontSize: '0.625rem', fontWeight: 600, fontFamily: 'Satoshi' }}>
          Retrait &lt; 2h
        </span>
      ) : null,
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-2 mb-5">
      {kpis.map((k, i) => (
        <div
          key={i}
          className="rounded-[18px] p-3 animate-fade-up"
          style={{
            backgroundColor: '#FFFFFF',
            border: k.urgent ? '1px solid rgba(220,38,38,0.18)' : '1px solid rgba(67,47,46,0.07)',
            boxShadow: k.urgent ? '0 2px 12px rgba(220,38,38,0.08)' : '0 2px 12px rgba(67,47,46,0.05)',
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: k.iconBg, color: k.iconColor, flexShrink: 0 }}>
              <k.Icon />
            </div>
            <p className="font-display" style={{ fontSize: '1.75rem', color: k.urgent ? '#DC2626' : '#111111', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {k.value}
            </p>
          </div>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: k.urgent ? '#DC2626' : '#111111', fontFamily: 'Satoshi', marginBottom: 4 }}>
            {k.label}
          </p>
          {k.detail && <div>{k.detail}</div>}
        </div>
      ))}
    </div>
  )
}

// ── À surveiller aujourd'hui ───────────────────────────────────────────────
function SurveillanceCard({ orders, onViewAll }) {
  const today = new Date()
  const urgent = orders.filter(o => {
    if (!o.pickupDate || o.status === 'done' || o.status === 'cancelled') return false
    if (!isSameDay(parseISO(o.pickupDate), today)) return false
    const h = differenceInHours(parseISO(o.pickupDate), today)
    return h <= 2
  }).sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))

  if (urgent.length === 0) return null

  return (
    <div
      className="rounded-[20px] mb-5 overflow-hidden animate-fade-up"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)', boxShadow: '0 2px 16px rgba(67,47,46,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>
            À surveiller aujourd'hui
          </p>
          <span style={{ minWidth: 20, height: 20, borderRadius: 9999, backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'Satoshi', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
            {urgent.length}
          </span>
        </div>
        <button onClick={onViewAll} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi', display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer' }}>
          Voir tout
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Rows */}
      {urgent.map((o, i) => {
        const poleStr = Array.isArray(o.assignedTo)
          ? o.assignedTo.map(p => ASSIGNED[p] ?? p).join(' + ')
          : (ASSIGNED[o.assignedTo] ?? '—')
        const isPatis = o.assignedTo === 'patissiere' || (Array.isArray(o.assignedTo) && o.assignedTo.includes('patissiere'))
        const poleBg    = isPatis ? '#DCFCE7' : '#FEF3C7'
        const poleColor = isPatis ? '#166534'  : '#92400E'

        return (
          <div
            key={o.id}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderTop: i > 0 ? '1px solid rgba(67,47,46,0.06)' : undefined }}
          >
            {/* Heure rouge */}
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#DC2626', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums', minWidth: 40, flexShrink: 0 }}>
              {format(parseISO(o.pickupDate), 'HH:mm')}
            </p>
            {/* Icône cake */}
            <div style={{ flexShrink: 0 }}>
              <IconCakeSmall />
            </div>
            {/* Article + client + urgent */}
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111111', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {o.articles}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 1 }}>{o.clientName}</p>
              <div className="flex items-center gap-1 mt-1">
                <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: '#EF4444', display: 'block' }} />
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#EF4444', fontFamily: 'Satoshi' }}>Urgent</span>
              </div>
            </div>
            {/* Pôle + retrait */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span style={{ backgroundColor: poleBg, color: poleColor, padding: '2px 10px', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 600, fontFamily: 'Satoshi' }}>
                {poleStr}
              </span>
              <div className="text-right">
                <p style={{ fontSize: '0.5625rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Retrait</p>
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#DC2626', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums' }}>
                  {format(parseISO(o.pickupDate), 'HH:mm')}
                </p>
              </div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C0B8A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        )
      })}
    </div>
  )
}

// ── Mini bar chart ─────────────────────────────────────────────────────────
function MiniBar({ ratio, isToday }) {
  const color  = isToday ? '#EDD83D' : '#E8E0D5'
  const seeds  = [0.35, 0.65, 1, 0.55, 0.8, 0.42]
  const heights = seeds.map(s => Math.max(Math.round(s * ratio * 13 + 1), 2))
  return (
    <svg width="30" height="14" viewBox="0 0 30 14" style={{ display: 'block', marginTop: 6 }}>
      {heights.map((h, i) => (
        <rect key={i} x={i * 5} y={14 - h} width="4" height={h} rx="1" fill={color} />
      ))}
    </svg>
  )
}

// ── Planning semaine ───────────────────────────────────────────────────────
function WeekPlanningCard({ orders }) {
  const today     = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const DAY_ABR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  const counts = weekDays.map(d =>
    orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), d) && o.status !== 'cancelled').length
  )
  const maxCount = Math.max(...counts, 1)

  return (
    <div
      className="rounded-[20px] p-4 mb-5 animate-fade-up"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)', boxShadow: '0 2px 16px rgba(67,47,46,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div style={{ color: '#432F2E' }}><IconCalendar /></div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>
            Planning de la semaine
          </p>
        </div>
      </div>

      {/* Jours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today)
          const count   = counts[i]
          const ratio   = count / maxCount

          return (
            <div
              key={i}
              className="flex flex-col items-center rounded-2xl py-2"
              style={{ backgroundColor: isToday ? '#FFF8D6' : 'transparent' }}
            >
              <p style={{ fontSize: '0.5625rem', fontWeight: 700, color: isToday ? '#92400E' : '#8A7060', fontFamily: 'Satoshi', textAlign: 'center', marginBottom: 2 }}>
                {DAY_ABR[i]}<br />{format(day, 'd')}
              </p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: isToday ? '#432F2E' : '#111111', fontFamily: 'Satoshi', lineHeight: 1.2 }}>
                {count}
              </p>
              <p style={{ fontSize: '0.5rem', color: isToday ? '#92400E' : '#B0A090', fontFamily: 'Satoshi' }}>cmdes</p>
              <MiniBar ratio={ratio} isToday={isToday} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── À anticiper sur 3 jours ────────────────────────────────────────────────
function AnticipationCard({ orders, onViewAll }) {
  const today = new Date()
  const cols  = [
    { label: 'Demain',       day: addDays(today, 1), iconBg: '#DCFCE7', iconColor: '#166534', countColor: '#166634', dotColor: '#10B981' },
    { label: 'Après-demain', day: addDays(today, 2), iconBg: '#FEF3C7', iconColor: '#92400E', countColor: '#D97706', dotColor: '#F59E0B' },
    { label: 'Dans 3 jours', day: addDays(today, 3), iconBg: '#FEE2E2', iconColor: '#991B1B', countColor: '#DC2626', dotColor: '#EF4444' },
  ]

  return (
    <div
      className="rounded-[20px] p-4 mb-4 animate-fade-up"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)', boxShadow: '0 2px 16px rgba(67,47,46,0.06)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div style={{ color: '#432F2E' }}><IconCalendar /></div>
        <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>
          À anticiper sur 3 jours
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {cols.map(({ label, day, iconBg, iconColor, countColor, dotColor }) => {
          const dayOrders = orders
            .filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), day) && o.status !== 'cancelled')
            .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))

          return (
            <div key={label}>
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: iconBg, color: iconColor }}>
                  <IconCalendar size={14} />
                </div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: countColor, fontFamily: 'Satoshi' }}>
                  {dayOrders.length} commandes
                </span>
              </div>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', marginBottom: 8 }}>
                {label}
              </p>

              {/* Orders */}
              <div className="space-y-1.5">
                {dayOrders.slice(0, 2).map(o => (
                  <div key={o.id} className="flex items-start gap-1.5">
                    <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#8A7060', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums', flexShrink: 0, paddingTop: 1 }}>
                      {format(parseISO(o.pickupDate), 'HH:mm')}
                    </span>
                    <span style={{ fontSize: '0.5625rem', color: '#111111', fontFamily: 'Satoshi', fontWeight: 600, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {o.articles}
                    </span>
                  </div>
                ))}
                {dayOrders.length > 2 && (
                  <button style={{ fontSize: '0.5625rem', fontWeight: 700, color: dotColor, fontFamily: 'Satoshi', display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }}>
                    +{dayOrders.length - 2} autres
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                )}
                {dayOrders.length === 0 && (
                  <p style={{ fontSize: '0.5625rem', color: '#B0A090', fontFamily: 'Satoshi' }}>Aucune commande</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Voir tout */}
      <button
        onClick={onViewAll}
        className="w-full flex items-center justify-between mt-5 pt-4 active:opacity-70"
        style={{ borderTop: '1px solid rgba(67,47,46,0.07)', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0 0 0' }}
      >
        <div className="flex items-center gap-2">
          <div style={{ color: '#432F2E' }}><IconCalendar /></div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>
            Voir tout le planning
          </span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0B8A8" strokeWidth="2.5" strokeLinecap="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    </div>
  )
}

// ── Nav constants ─────────────────────────────────────────────────────────
const ACTIVE   = '#111111'
const INACTIVE = '#B0A090'

// ── Manager Dashboard ─────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const [orders, setOrders] = useState([])
  const [tab, setTab]       = useState('home')
  const navigate            = useNavigate()

  useEffect(() => subscribeOrders(setOrders), [])

  const changeTab = (t) => {
    if (t === 'reglages')  { navigate('/settings'); return }
    if (t === 'commandes') { navigate('/manager/toutes'); return }
    setTab(t)
  }

  const today = new Date()
  const prenom = getPrenom()

  const todayCount = useMemo(() =>
    orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), today) && o.status !== 'cancelled').length,
  [orders])

  const urgentCount = useMemo(() =>
    orders.filter(o => {
      if (!o.pickupDate || o.status === 'done' || o.status === 'cancelled') return false
      if (!isSameDay(parseISO(o.pickupDate), today)) return false
      return differenceInHours(parseISO(o.pickupDate), today) <= 2
    }).length,
  [orders])

  const dateLabel = useMemo(() => {
    const s = format(today, 'EEEE d MMMM', { locale: fr })
    return s.charAt(0).toUpperCase() + s.slice(1)
  }, [])

  const NAV = [
    { id: 'home',      label: 'Accueil',   Icon: IconHome },
    { id: 'commandes', label: 'Commandes', Icon: IconList },
    { id: 'planning',  label: 'Planning',  Icon: IconCalendar },
    { id: 'reglages',  label: 'Réglages',  Icon: IconSettings },
  ]

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>

      {/* ── Header ── */}
      <header className="px-5 pb-3" style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}>
        <div className="flex items-start justify-between animate-fade-up">

          <div className="flex-1 pr-2">
            <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#8A7060', fontFamily: 'Satoshi', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Au Grand Jour · Manager
            </p>
            <h1 className="font-display" style={{ fontSize: '2.25rem', color: '#111111', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 14 }}>
              Bonjour{prenom ? ` ${prenom}` : ''} ! 👋
            </h1>
            {/* Chips */}
            <div className="flex flex-wrap gap-1.5">
              <Chip icon={<IconCalendar size={12} />} label={dateLabel} />
              <Chip icon={<IconCalendar size={12} />} label={`${todayCount} commandes aujourd'hui`} />
              {urgentCount > 0 && (
                <Chip icon={<IconAlertSmall />} label={`${urgentCount} urgente${urgentCount > 1 ? 's' : ''}`} urgent />
              )}
            </div>
          </div>

          <div style={{ width: 118, height: 108, flexShrink: 0 }}>
            <IllustrationBoulangerie />
          </div>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="flex-1 px-4 pt-2 pb-36 overflow-y-auto">

        {tab === 'home' && (
          <>
            <KpiStrip orders={orders} />
            <SurveillanceCard orders={orders} onViewAll={() => navigate('/manager/toutes')} />
            <WeekPlanningCard orders={orders} />
            <AnticipationCard orders={orders} onViewAll={() => navigate('/manager/toutes')} />
          </>
        )}

        {tab === 'planning' && (
          <PlanningView orders={orders} />
        )}

      </main>

      {/* ── Bottom nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-lg mx-auto" style={{ borderTop: '1px solid rgba(67,47,46,0.08)', paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}>
          <div className="flex items-end pt-3 pb-1">

            {NAV.slice(0, 2).map(item => {
              const active = tab === item.id
              return (
                <button key={item.id} onClick={() => changeTab(item.id)}
                  className="flex-1 flex flex-col items-center gap-0.5 pb-1"
                  style={{ color: active ? ACTIVE : INACTIVE }}>
                  <item.Icon />
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? ACTIVE : INACTIVE, fontFamily: 'Satoshi' }}>{item.label}</span>
                  <span style={{ width: active ? 16 : 0, height: 2, borderRadius: 9999, backgroundColor: '#EDD83D', marginTop: 2, transition: 'width 0.2s', display: 'block' }} />
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

            {NAV.slice(2).map(item => {
              const active = tab === item.id
              return (
                <button key={item.id} onClick={() => changeTab(item.id)}
                  className="flex-1 flex flex-col items-center gap-0.5 pb-1"
                  style={{ color: active ? ACTIVE : INACTIVE }}>
                  <item.Icon />
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? ACTIVE : INACTIVE, fontFamily: 'Satoshi' }}>{item.label}</span>
                  <span style={{ width: active ? 16 : 0, height: 2, borderRadius: 9999, backgroundColor: '#EDD83D', marginTop: 2, transition: 'width 0.2s', display: 'block' }} />
                </button>
              )
            })}

          </div>
        </div>
      </nav>

    </div>
  )
}

// ── Vue Planning (tab) ────────────────────────────────────────────────────
function PlanningView({ orders }) {
  const [viewMonth, setViewMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [expandedId, setExpandedId]   = useState(null)
  const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  const mStart   = startOfMonth(viewMonth)
  const mEnd     = endOfMonth(viewMonth)
  const calStart = startOfWeek(mStart, { weekStartsOn: 1 })
  const calEnd   = endOfWeek(mEnd, { weekStartsOn: 1 })
  const days     = eachDayOfInterval({ start: calStart, end: calEnd })

  const dayOrders = useMemo(() => {
    if (!selectedDay) return []
    return orders
      .filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), selectedDay) && o.status !== 'cancelled')
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
  }, [orders, selectedDay])

  const sectionTitle = useMemo(() => {
    if (!selectedDay) return 'Sélectionne un jour'
    if (isSameDay(selectedDay, new Date())) return "Aujourd'hui"
    return format(selectedDay, 'EEEE d MMMM', { locale: fr })
  }, [selectedDay])

  return (
    <>
      {/* Calendrier mensuel */}
      <div className="rounded-[20px] p-4 mb-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)', boxShadow: '0 2px 16px rgba(67,47,46,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setViewMonth(m => subMonths(m, 1))} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ color: '#8A7060', fontSize: '1.25rem' }}>‹</button>
          <p className="capitalize" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>
            {format(viewMonth, 'MMMM yyyy', { locale: fr })}
          </p>
          <button onClick={() => setViewMonth(m => addMonths(m, 1))} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ color: '#8A7060', fontSize: '1.25rem' }}>›</button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d, i) => (
            <p key={i} className="text-center" style={{ fontSize: '9px', fontWeight: 700, color: '#B0A090', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Satoshi' }}>{d}</p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {days.map(day => {
            const inMonth    = isSameMonth(day, viewMonth)
            const count      = inMonth ? orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), day)).length : 0
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const isToday    = isSameDay(day, new Date())
            return (
              <button key={day.toISOString()} disabled={!inMonth}
                onClick={() => setSelectedDay(isSelected ? new Date() : day)}
                className="flex flex-col items-center py-1.5 rounded-xl"
                style={{ backgroundColor: isSelected ? '#432F2E' : isToday ? '#FFF0B5' : 'transparent', opacity: inMonth ? 1 : 0.12 }}>
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

      {/* Liste du jour */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-display capitalize" style={{ fontSize: '1rem', color: '#111111' }}>{sectionTitle}</p>
        <span className="label-xs">{dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}</span>
      </div>
      {dayOrders.length === 0 ? (
        <div className="rounded-[20px] text-center py-14" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)' }}>
          <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Aucune commande ce jour</p>
        </div>
      ) : (
        dayOrders.map(o => (
          <PlanOrderRow key={o.id} order={o} expanded={expandedId === o.id} onToggle={() => setExpandedId(p => p === o.id ? null : o.id)} />
        ))
      )}
    </>
  )
}

function PlanOrderRow({ order, expanded, onToggle }) {
  const reste  = (order.totalAmount || 0) - (order.deposit || 0)
  const isDone = order.status === 'done'
  return (
    <div className="rounded-[18px] overflow-hidden mb-2.5" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', opacity: isDone ? 0.55 : 1 }}>
      <button className="w-full px-4 py-3.5 flex items-center gap-3 text-left" onClick={onToggle}>
        <div style={{ backgroundColor: '#FFF0B5', padding: '0.3rem 0.55rem', borderRadius: 10, flexShrink: 0 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#432F2E', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums' }}>
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontWeight: 700, color: '#111111', fontSize: '0.9375rem', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.articles}</p>
          <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.clientName}</p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(67,47,46,0.07)', color: '#432F2E', padding: '0.2rem 0.65rem', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'Satoshi', flexShrink: 0 }}>
          {order.status === 'done' ? 'Récupérée' : order.status === 'ready' ? 'Prête' : order.status === 'inprogress' ? 'En cours' : 'À faire'}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C0B8A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
      {expanded && (
        <div className="px-5 pb-4 pt-3 space-y-3" style={{ borderTop: '1px solid rgba(67,47,46,0.06)' }}>
          <p style={{ fontSize: '0.875rem', color: '#111111', lineHeight: 1.5, fontFamily: 'Satoshi' }}>{order.articles}</p>
          {order.clientPhone && (
            <a href={`tel:${order.clientPhone}`} style={{ fontSize: '0.875rem', fontWeight: 600, color: '#432F2E', textDecoration: 'underline', fontFamily: 'Satoshi', display: 'block' }}>
              {order.clientPhone}
            </a>
          )}
          {order.totalAmount > 0 && (
            <div className="flex gap-6">
              <div>
                <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Total</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi', marginTop: 2 }}>{order.totalAmount} €</p>
              </div>
              {reste > 0 && (
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Reste dû</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400E', fontFamily: 'Satoshi', marginTop: 2 }}>{reste} €</p>
                </div>
              )}
            </div>
          )}
          {order.notes && (
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E', fontFamily: 'Satoshi' }}>⚠ {order.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
