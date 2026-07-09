import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  format, parseISO, isSameDay,
  startOfWeek, addDays, differenceInHours, differenceInMinutes,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, Clock, Flame, Users, Bell, ChevronRight } from 'lucide-react'
import { subscribeOrders, isAssignedTo } from '../../lib/orders'
import { getUrgencyHours } from '../../lib/settings'
import { useNewOrderNotification } from '../../hooks/useNewOrderNotification'
import HeaderBrand from '../../components/ui/HeaderBrand'
import HeroIllustration from '../../components/ui/HeroIllustration'

const DAY_ABR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const STATUS_PILL = {
  todo:       { label: 'À faire',  bg: '#FEFCE8', color: '#854D0E' },
  inprogress: { label: 'En cours', bg: '#FEF3C7', color: '#92400E' },
  ready:      { label: 'Prête',    bg: '#D1FAE5', color: '#065F46' },
}

function isUrgent(order) {
  return differenceInHours(parseISO(order.pickupDate), new Date()) < getUrgencyHours()
}

function formatRetraitDans(pickupDate) {
  const mins = differenceInMinutes(parseISO(pickupDate), new Date())
  if (mins < 0) return 'Retrait dépassé'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `Retrait dans ${m} min`
  if (m === 0) return `Retrait dans ${h}h`
  return `Retrait dans ${h}h${String(m).padStart(2, '0')}`
}

function StatusPill({ status }) {
  if (status === 'inprogress') return null
  const c = STATUS_PILL[status] ?? STATUS_PILL.todo
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: c.bg, color: c.color, padding: '0.2rem 0.6rem', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'Satoshi', whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  )
}

function UrgentPill() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '0.2rem 0.6rem', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'Satoshi', whiteSpace: 'nowrap' }}>
      Urgent
    </span>
  )
}

// ── Bandeau nouvelle commande (inchangé) ───────────────────────────────────
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

// ── Bandeau logo + pill "Vue pâtissière" + cloche (son) ───────────────────
function DashboardHeader({ isUnlocked, onUnlock }) {
  return (
    <HeaderBrand
      right={
        <>
          <div
            className="hidden sm:flex items-center gap-1.5"
            style={{ border: '1px solid rgba(67,47,46,0.14)', borderRadius: 9999, padding: '0.5rem 0.875rem' }}
          >
            <Users size={15} color="#432F2E" strokeWidth={1.8} />
            <span style={{ fontSize: '0.75rem', color: '#432F2E', fontWeight: 600, fontFamily: 'Satoshi', whiteSpace: 'nowrap' }}>
              Vue pâtissière
            </span>
          </div>
          <button
            onClick={() => { if (!isUnlocked) onUnlock() }}
            className="flex items-center justify-center relative"
            style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: '#432F2E', flexShrink: 0, border: 'none' }}
            aria-label={isUnlocked ? 'Notifications activées' : 'Activer les notifications sonores'}
          >
            <Bell size={18} color="#FFFCF7" strokeWidth={1.8} />
            {!isUnlocked && (
              <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: 9999, backgroundColor: '#EDD83D', border: '1.5px solid #432F2E' }} />
            )}
          </button>
        </>
      }
    />
  )
}

// ── Résumé de production (1 carte, 4 segments) ────────────────────────────
function ProductionSummary({ orders }) {
  const today = new Date()
  const tomorrow = addDays(today, 1)

  const todayCount    = orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), today)).length
  const tomorrowCount = orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), tomorrow)).length
  const urgentCount   = orders.filter(o => o.status !== 'ready' && isUrgent(o)).length

  const stats = [
    { label: "Aujourd'hui", value: todayCount,    iconBg: '#FFF0B5', iconColor: '#432F2E', Icon: Calendar },
    { label: 'Demain',      value: tomorrowCount, iconBg: '#FFF6DD', iconColor: '#432F2E', Icon: Clock },
    { label: 'Urgente',     value: urgentCount,   iconBg: 'rgba(67,47,46,0.08)', iconColor: '#432F2E', Icon: Flame },
  ]

  return (
    <div
      className="flex rounded-[24px] mb-6 animate-fade-up"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.08)', boxShadow: '0 2px 16px rgba(67,47,46,0.05)' }}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="flex-1 flex items-center gap-2 px-1.5 sm:px-2.5 py-4"
          style={{ minWidth: 0, borderRight: i < stats.length - 1 ? '1px solid rgba(67,47,46,0.08)' : 'none' }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 30, height: 30, borderRadius: 9999, backgroundColor: s.iconBg, color: s.iconColor }}
          >
            <s.Icon size={14} strokeWidth={1.9} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {s.value}
            </p>
            <p style={{ fontSize: '0.5625rem', color: '#8A7060', fontFamily: 'Satoshi', lineHeight: 1.25, marginTop: 3 }}>
              {s.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── À préparer maintenant ──────────────────────────────────────────────────
function PriorityCard({ order, pendingCount, navigate }) {
  return (
    <div className="mb-7 animate-fade-up delay-75">
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>À préparer maintenant</p>
        {pendingCount > 1 && (
          <button
            onClick={() => navigate('/patissiere/historique')}
            className="flex items-center gap-1 active:opacity-70"
            style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Voir toutes ({pendingCount}) <ChevronRight size={12} strokeWidth={2.3}/>
          </button>
        )}
      </div>

      {!order ? (
        <div className="rounded-[24px] text-center py-10" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.08)' }}>
          <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Rien à préparer pour le moment 🎉</p>
        </div>
      ) : (
        <button
          onClick={() => navigate('/calendrier', { state: { date: format(parseISO(order.pickupDate), 'yyyy-MM-dd'), orderId: order.id } })}
          className="w-full text-left active:scale-[0.99] transition-transform"
          style={{ backgroundColor: '#FFF6DD', border: '1px solid rgba(237,216,61,0.4)', borderRadius: 24, padding: 20 }}
        >
          <div className="flex items-start gap-4">
            <div style={{ flexShrink: 0, minWidth: 68 }}>
              {isUrgent(order) && (
                <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#B91C1C', fontFamily: 'Satoshi', letterSpacing: '0.06em', marginBottom: 4 }}>
                  URGENT
                </p>
              )}
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {format(parseISO(order.pickupDate), 'HH:mm')}
              </p>
              <p className="flex items-center gap-1" style={{ fontSize: '0.6875rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 6 }}>
                <Clock size={11} strokeWidth={2} />
                {formatRetraitDans(order.pickupDate)}
              </p>
            </div>

            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#111111', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {order.articles}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Client : {order.clientName}
              </p>
              <div className="flex items-center gap-1.5 mt-2.5">
                {isUrgent(order) && <UrgentPill />}
                <StatusPill status={order.status} />
              </div>
            </div>

            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.1)' }}
            >
              <ChevronRight size={16} color="#432F2E" strokeWidth={2.3} />
            </div>
          </div>
        </button>
      )}
    </div>
  )
}

// ── Vue de la semaine ──────────────────────────────────────────────────────
function WeekView({ orders, selectedDay, onSelectDay }) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd   = addDays(weekStart, 6)
  const days      = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const weekCount = orders.filter(o => {
    if (!o.pickupDate) return false
    const d = parseISO(o.pickupDate)
    return d >= weekStart && d <= weekEnd
  }).length

  const dayInfo = (day) => {
    const dayOrders = orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), day))
    if (dayOrders.length === 0) return { count: 0, dot: 'rgba(67,47,46,0.15)' }
    if (dayOrders.some(o => o.status !== 'ready' && isUrgent(o))) return { count: dayOrders.length, dot: '#B91C1C' }
    if (dayOrders.every(o => o.status === 'ready')) return { count: dayOrders.length, dot: '#7A8C94' }
    return { count: dayOrders.length, dot: '#D9A900' }
  }

  return (
    <div className="mb-7 animate-fade-up delay-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>Vue de la semaine</p>
          <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 2 }}>
            {weekCount} commande{weekCount > 1 ? 's' : ''} prévue{weekCount > 1 ? 's' : ''}
          </p>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 12 }}>
          {format(weekStart, 'd')} – {format(weekEnd, 'd MMMM yyyy', { locale: fr })}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => {
          const isSelected = isSameDay(day, selectedDay)
          const isToday     = isSameDay(day, new Date())
          const { count, dot } = dayInfo(day)
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className="flex flex-col items-center py-2.5 transition-all active:scale-95"
              style={{
                borderRadius: 14,
                backgroundColor: isSelected ? '#432F2E' : isToday ? '#FFF6DD' : '#FFFFFF',
                border: isSelected ? 'none' : '1px solid rgba(67,47,46,0.08)',
              }}
            >
              <span style={{ fontSize: '0.625rem', fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.6)' : '#8A7060', fontFamily: 'Satoshi' }}>
                {DAY_ABR[i]}
              </span>
              <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: isSelected ? '#FFFFFF' : '#111111', fontFamily: 'Satoshi', marginTop: 2 }}>
                {format(day, 'd')}
              </span>
              <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: isSelected ? 'rgba(255,255,255,0.6)' : dot, margin: '5px 0 4px' }} />
              <span style={{ fontSize: '0.5625rem', color: isSelected ? 'rgba(255,255,255,0.6)' : '#B0A090', fontFamily: 'Satoshi', whiteSpace: 'nowrap' }}>
                {count} cmde{count > 1 ? 's' : ''}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
        {[
          { label: 'Commandes', dot: '#D9A900' },
          { label: 'Urgente',   dot: '#B91C1C' },
          { label: 'Prêtes',    dot: '#7A8C94' },
          { label: 'Aucune',    dot: 'rgba(67,47,46,0.15)' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: l.dot }} />
            <span style={{ fontSize: '0.625rem', color: '#B0A090', fontFamily: 'Satoshi' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Ligne de commande — section du jour sélectionné ────────────────────────
function TodayOrderRow({ order, isLast, isNew, navigate }) {
  return (
    <div style={{ borderBottom: !isLast ? '1px solid rgba(67,47,46,0.08)' : 'none', backgroundColor: isNew ? 'rgba(237,216,61,0.10)' : 'transparent' }}>
      <button
        onClick={() => navigate('/calendrier', { state: { date: format(parseISO(order.pickupDate), 'yyyy-MM-dd'), orderId: order.id } })}
        className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-black/[0.02]"
      >
        {isNew && <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#EDD83D', flexShrink: 0 }} />}
        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {format(parseISO(order.pickupDate), 'HH:mm')}
        </span>

        <div className="flex-1 min-w-0">
          <p style={{ fontWeight: 700, color: '#111111', fontSize: '0.9375rem', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.articles}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
            Client : {order.clientName}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isUrgent(order) && order.status !== 'ready' && <UrgentPill />}
          <StatusPill status={order.status} />
        </div>

        <ChevronRight size={15} color="#C0B8A8" strokeWidth={2.3} className="flex-shrink-0" />
      </button>
    </div>
  )
}

// ── Section commandes du jour sélectionné ──────────────────────────────────
function DaySection({ title, orders, newOrders, navigate }) {
  return (
    <div className="mb-7 animate-fade-up delay-150">
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>{title}</p>
        {orders.length > 0 && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi', backgroundColor: 'rgba(67,47,46,0.06)', padding: '0.3rem 0.65rem', borderRadius: 9999 }}>
            {orders.length} commande{orders.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[22px] text-center py-12" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.08)' }}>
          <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Aucune commande ce jour-là</p>
        </div>
      ) : (
        <div className="rounded-[22px] overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.08)', boxShadow: '0 2px 16px rgba(67,47,46,0.05)' }}>
          {orders.map((order, i) => (
            <TodayOrderRow
              key={order.id}
              order={order}
              isLast={i === orders.length - 1}
              isNew={newOrders.some(n => n.id === order.id)}
              navigate={navigate}
            />
          ))}
          <button
            onClick={() => navigate('/calendrier')}
            className="w-full flex items-center justify-center gap-1.5 active:bg-black/[0.02]"
            style={{ padding: '14px 16px', borderTop: '1px solid rgba(67,47,46,0.08)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#432F2E', fontFamily: 'Satoshi' }}>Voir toutes les commandes du jour</span>
            <ChevronRight size={14} color="#432F2E" strokeWidth={2.3} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Carousel "À anticiper" ──────────────────────────────────────────────────
function UpcomingCarousel({ days, navigate }) {
  const scrollRef = useRef(null)
  const cardRef   = useRef(null)
  const [active, setActive] = useState(0)

  const handleScroll = () => {
    const el   = scrollRef.current
    const card = cardRef.current
    if (!el || !card) return
    const step = card.offsetWidth + 12
    setActive(Math.round(el.scrollLeft / step))
  }

  return (
    <div className="mb-7 animate-fade-up delay-200">
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>À anticiper</p>
        <button
          onClick={() => navigate('/calendrier')}
          className="flex items-center gap-1 active:opacity-70"
          style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Voir le planning complet <ChevronRight size={12} strokeWidth={2.3} />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', paddingBottom: 4, marginRight: -24 }}
      >
        {days.map(({ day, orders }, i) => {
          const hasOrders = orders.length > 0
          const isTomorrow = i === 0
          const bg     = isTomorrow ? '#FFF6DD' : hasOrders ? '#EFF6FA' : '#F5F2EB'
          const border = isTomorrow ? 'rgba(237,216,61,0.4)' : hasOrders ? 'rgba(67,47,46,0.08)' : 'rgba(67,47,46,0.06)'
          const dayName = format(day, 'EEEE', { locale: fr })
          const dayLabel = dayName.charAt(0).toUpperCase() + dayName.slice(1)

          return (
            <div
              key={day.toISOString()}
              ref={i === 0 ? cardRef : null}
              className="rounded-[22px] flex flex-col"
              style={{ backgroundColor: bg, border: `1px solid ${border}`, padding: 18, flexShrink: 0, width: 'calc(100% - 56px)', scrollSnapAlign: 'start' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', fontWeight: 600 }}>
                    {isTomorrow ? `Demain · ${dayLabel}` : dayLabel}
                  </p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.01em' }}>
                    {format(day, 'd MMMM', { locale: fr })}
                  </p>
                </div>
                {hasOrders && (
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#432F2E', fontFamily: 'Satoshi', backgroundColor: 'rgba(67,47,46,0.08)', padding: '0.3rem 0.6rem', borderRadius: 9999, whiteSpace: 'nowrap' }}>
                    {orders.length} commande{orders.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {hasOrders ? (
                <div className="space-y-1 mb-4" style={{ borderTop: '1px dashed rgba(67,47,46,0.15)', paddingTop: 8 }}>
                  {orders.slice(0, 3).map(o => (
                    <button
                      key={o.id}
                      onClick={() => navigate('/calendrier', { state: { date: format(day, 'yyyy-MM-dd'), orderId: o.id } })}
                      className="w-full flex items-center gap-2 active:opacity-60 transition-opacity"
                      style={{ padding: '4px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {format(parseISO(o.pickupDate), 'HH:mm')}
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#5C4A38', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                        {o.articles}
                      </span>
                      <ChevronRight size={12} color="#C0B8A8" strokeWidth={2.3} style={{ flexShrink: 0 }} />
                    </button>
                  ))}
                  {orders.length > 3 && (
                    <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', padding: '4px 0' }}>+{orders.length - 3} autre{orders.length - 3 > 1 ? 's' : ''}</p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: '#B0A090', fontFamily: 'Satoshi', flex: 1, marginBottom: 16 }}>Aucune commande</p>
              )}

              <button
                onClick={() => navigate('/calendrier', { state: { date: format(day, 'yyyy-MM-dd') } })}
                className="w-full flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                style={{ marginTop: 'auto', padding: '0.75rem', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(67,47,46,0.1)' }}
              >
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#432F2E', fontFamily: 'Satoshi' }}>Voir le détail</span>
                <ChevronRight size={14} color="#432F2E" strokeWidth={2.3} />
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        {days.map((_, i) => (
          <span key={i} style={{ width: i === active ? 16 : 6, height: 6, borderRadius: 9999, backgroundColor: i === active ? '#432F2E' : 'rgba(67,47,46,0.15)', transition: 'width 0.2s ease' }} />
        ))}
      </div>
    </div>
  )
}

// ── Dashboard pâtissière ──────────────────────────────────────────────────
export default function PatissiereDashboard() {
  const [orders, setOrders]           = useState([])
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const navigate = useNavigate()

  const { newOrders, clearNew, isUnlocked, unlock } = useNewOrderNotification('patissiere')

  useEffect(() => subscribeOrders(setOrders), [])

  const poleOrders = useMemo(
    () => orders.filter(o => o.status !== 'done' && isAssignedTo(o, 'patissiere')),
    [orders]
  )

  const selectedDayOrders = useMemo(() => {
    return poleOrders
      .filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), selectedDay))
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
  }, [poleOrders, selectedDay])

  const priorityOrder = useMemo(() => {
    return poleOrders
      .filter(o => o.status !== 'ready' && o.pickupDate)
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))[0] ?? null
  }, [poleOrders])

  const pendingCount = useMemo(
    () => poleOrders.filter(o => o.status !== 'ready').length,
    [poleOrders]
  )

  const upcomingDays = useMemo(() => {
    return [1, 2, 3, 4].map(offset => {
      const day = addDays(new Date(), offset)
      const dayOrders = poleOrders
        .filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), day))
        .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
      return { day, orders: dayOrders }
    })
  }, [poleOrders])

  const weekLabel = useMemo(() => {
    const ws = startOfWeek(new Date(), { weekStartsOn: 1 })
    const we = addDays(ws, 6)
    return `Semaine du ${format(ws, 'd')} au ${format(we, 'd MMMM yyyy', { locale: fr })}`
  }, [])

  const dayTitle = useMemo(() => {
    if (isSameDay(selectedDay, new Date())) return "Aujourd'hui"
    const label = format(selectedDay, 'EEEE d MMMM', { locale: fr })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [selectedDay])

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#F5F2EB' }}>

      {newOrders.length > 0 && (
        <NewOrderBanner
          newOrders={newOrders}
          isUnlocked={isUnlocked}
          onUnlock={unlock}
          onDismiss={clearNew}
        />
      )}

      <div className="px-6" style={{ paddingTop: 'max(28px, env(safe-area-inset-top))' }}>

        <div className="mb-7 animate-fade-up">
          <DashboardHeader isUnlocked={isUnlocked} onUnlock={unlock} />
        </div>

        {/* ── Hero compact ── */}
        <div className="flex items-center gap-4 mb-6 animate-fade-up">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(2rem, 8vw, 2.5rem)', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 6 }}>
              Production
            </h1>
            <span style={{ display: 'block', width: 44, height: 4, borderRadius: 9999, backgroundColor: '#FFF0B5', marginBottom: 10 }} />
            <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi' }}>
              {weekLabel}
            </p>
          </div>
          <div className="flex-shrink-0" style={{ width: 'clamp(78px, 22vw, 108px)', height: 'clamp(93px, 26vw, 128px)' }}>
            <HeroIllustration />
          </div>
        </div>

        <ProductionSummary orders={poleOrders} />

        <PriorityCard order={priorityOrder} pendingCount={pendingCount} navigate={navigate} />

        <WeekView orders={poleOrders} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

        <DaySection
          title={dayTitle}
          orders={selectedDayOrders}
          newOrders={newOrders}
          navigate={navigate}
        />

        <UpcomingCarousel days={upcomingDays} navigate={navigate} />

      </div>

      <div style={{ paddingBottom: 112 }} />

    </div>
  )
}
