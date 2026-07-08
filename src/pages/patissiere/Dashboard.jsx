import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  format, parseISO, isSameDay,
  startOfWeek, addDays, differenceInHours,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { Calendar, Clock, Hourglass, CheckCircle2, Users, Bell, ChevronRight } from 'lucide-react'
import { subscribeOrders, setStatus, isAssignedTo } from '../../lib/orders'
import { getUrgencyHours } from '../../lib/settings'
import { useNewOrderNotification } from '../../hooks/useNewOrderNotification'
import HeaderBrand from '../../components/ui/HeaderBrand'
import HeroIllustration from '../../components/ui/HeroIllustration'

const PRODUCTION_STATUSES = ['todo', 'inprogress', 'ready']
const STATUS_PICKER = {
  todo:       { label: 'Pas commencé', activeBg: '#111111', activeColor: '#FFFFFF', idleBg: 'rgba(67,47,46,0.06)', idleColor: '#8A7060' },
  inprogress: { label: 'En cours',     activeBg: '#FEFCE8', activeColor: '#854D0E', idleBg: 'rgba(67,47,46,0.06)', idleColor: '#8A7060' },
  ready:      { label: 'Prêt ✓',       activeBg: '#D1FAE5', activeColor: '#065F46', idleBg: 'rgba(67,47,46,0.06)', idleColor: '#8A7060' },
}
const STATUS_PILL = {
  todo:       { label: 'À faire',  bg: '#FEFCE8', color: '#854D0E' },
  inprogress: { label: 'En cours', bg: '#FEF3C7', color: '#92400E' },
  ready:      { label: 'Prête',    bg: '#D1FAE5', color: '#065F46' },
}

function isUrgent(order) {
  return differenceInHours(parseISO(order.pickupDate), new Date()) < getUrgencyHours()
}

function StatusPill({ status }) {
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

// ── KPI Strip (4 colonnes) ─────────────────────────────────────────────────
function KpiStrip({ orders }) {
  const today = new Date()
  const ws    = startOfWeek(today, { weekStartsOn: 1 })
  const we    = addDays(ws, 6)

  const weekCount = orders.filter(o => {
    if (!o.pickupDate) return false
    const d = parseISO(o.pickupDate)
    return d >= ws && d <= we
  }).length
  const todoCount = orders.filter(o => o.status === 'todo').length
  const inprog    = orders.filter(o => o.status === 'inprogress').length
  const ready     = orders.filter(o => o.status === 'ready').length

  const kpis = [
    { label: 'Cette semaine', value: weekCount, iconBg: '#FFF0B5',            iconColor: '#432F2E', Icon: Calendar },
    { label: 'À faire',       value: todoCount, iconBg: '#FFF6DD',            iconColor: '#432F2E', Icon: Clock },
    { label: 'En cours',      value: inprog,    iconBg: 'rgba(67,47,46,0.08)', iconColor: '#432F2E', Icon: Hourglass },
    { label: 'Prêtes',        value: ready,     iconBg: '#E5F0F5',            iconColor: '#432F2E', Icon: CheckCircle2 },
  ]

  return (
    <div className="grid grid-cols-4 gap-2 mb-6">
      {kpis.map((k, i) => (
        <div
          key={k.label}
          className="rounded-[18px] py-3.5 px-2 flex flex-col items-center animate-fade-up"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.08)', boxShadow: '0 2px 12px rgba(67,47,46,0.05)', animationDelay: `${i * 0.06}s` }}
        >
          <div
            className="flex items-center justify-center mb-2"
            style={{ width: 38, height: 38, borderRadius: 9999, backgroundColor: k.iconBg, color: k.iconColor }}
          >
            <k.Icon size={17} strokeWidth={1.8} />
          </div>
          <p style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {k.value}
          </p>
          <p style={{ fontSize: '0.625rem', color: '#8A7060', fontFamily: 'Satoshi', textAlign: 'center', lineHeight: 1.3, marginTop: 4 }}>
            {k.label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Ligne de commande — section "Aujourd'hui" ─────────────────────────────
function TodayOrderRow({ order, isLast, isNew, expanded, onToggle }) {
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
    <div style={{ borderBottom: !isLast || expanded ? '1px solid rgba(67,47,46,0.08)' : 'none', backgroundColor: isNew ? 'rgba(237,216,61,0.10)' : 'transparent' }}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-5 py-4 text-left">
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

        <ChevronRight
          size={15}
          color="#C0B8A8"
          strokeWidth={2.3}
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1 space-y-3">
          {order.notes && (
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E', fontFamily: 'Satoshi' }}>⚠ {order.notes}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {PRODUCTION_STATUSES.map(s => {
              const cfg      = STATUS_PICKER[s]
              const isActive = order.status === s
              return (
                <button
                  key={s}
                  onClick={() => handleSetStatus(s)}
                  disabled={busy}
                  className="transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    padding: '0.75rem 0.5rem', borderRadius: 12,
                    backgroundColor: isActive ? cfg.activeBg : cfg.idleBg,
                    color: isActive ? cfg.activeColor : cfg.idleColor,
                    fontWeight: 600, fontSize: '0.75rem', border: 'none', cursor: 'pointer',
                    fontFamily: 'Satoshi', transition: 'background-color 0.15s, color 0.15s',
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

// ── Section "Aujourd'hui" ──────────────────────────────────────────────────
function TodaySection({ orders, newOrders, expandedId, onToggle, navigate }) {
  return (
    <div className="mb-7 animate-fade-up delay-100">
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>Aujourd'hui</p>
        {orders.length > 0 && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi', backgroundColor: 'rgba(67,47,46,0.06)', padding: '0.3rem 0.65rem', borderRadius: 9999 }}>
            {orders.length} commande{orders.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[22px] text-center py-12" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.08)' }}>
          <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Aucune commande aujourd'hui 🎉</p>
        </div>
      ) : (
        <div className="rounded-[22px] overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.08)', boxShadow: '0 2px 16px rgba(67,47,46,0.05)' }}>
          {orders.map((order, i) => (
            <TodayOrderRow
              key={order.id}
              order={order}
              isLast={i === orders.length - 1}
              isNew={newOrders.some(n => n.id === order.id)}
              expanded={expandedId === order.id}
              onToggle={() => onToggle(order.id)}
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

// ── Carousel "Commandes à venir" ───────────────────────────────────────────
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
    <div className="mb-7 animate-fade-up delay-150">
      <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', marginBottom: 4 }}>
        Commandes à venir
      </p>
      <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', marginBottom: 14 }}>
        Les prochaines productions planifiées.
      </p>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', paddingBottom: 4, marginRight: -24 }}
      >
        {days.map(({ day, orders }, i) => {
          const hasOrders = orders.length > 0
          const bg     = i === 0 ? '#FFF6DD' : hasOrders ? '#EFF6FA' : '#F5F2EB'
          const border = i === 0 ? 'rgba(237,216,61,0.4)' : hasOrders ? 'rgba(67,47,46,0.08)' : 'rgba(67,47,46,0.06)'
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
                  <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', fontWeight: 600 }}>{dayLabel}</p>
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
                <div className="space-y-2 mb-4" style={{ borderTop: '1px dashed rgba(67,47,46,0.15)', paddingTop: 12 }}>
                  {orders.slice(0, 3).map(o => (
                    <div key={o.id} className="flex items-center gap-2">
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {format(parseISO(o.pickupDate), 'HH:mm')}
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#5C4A38', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.articles}
                      </span>
                    </div>
                  ))}
                  {orders.length > 3 && (
                    <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>+{orders.length - 3} autre{orders.length - 3 > 1 ? 's' : ''}</p>
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
  const [orders, setOrders]         = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const navigate = useNavigate()

  const { newOrders, clearNew, isUnlocked, unlock } = useNewOrderNotification('patissiere')

  useEffect(() => subscribeOrders(setOrders), [])

  const poleOrders = useMemo(
    () => orders.filter(o => o.status !== 'done' && isAssignedTo(o, 'patissiere')),
    [orders]
  )

  const todayOrders = useMemo(() => {
    const today = new Date()
    return poleOrders
      .filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), today))
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
  }, [poleOrders])

  const upcomingDays = useMemo(() => {
    return [1, 2, 3, 4].map(offset => {
      const day = addDays(new Date(), offset)
      const dayOrders = poleOrders
        .filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), day))
        .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
      return { day, orders: dayOrders }
    })
  }, [poleOrders])

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

        {/* ── Hero ── */}
        <div className="flex items-center gap-4 mb-7 animate-fade-up">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(2rem, 8vw, 2.75rem)', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 8 }}>
              Production<br/>du jour
            </h1>
            <span style={{ display: 'block', width: 60, height: 4, borderRadius: 9999, backgroundColor: '#FFF0B5', marginBottom: 14 }} />
            <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi', lineHeight: 1.55 }}>
              Suivez les commandes, les urgences et l'avancement de la production.
            </p>
          </div>
          <div className="flex-shrink-0" style={{ width: 'clamp(110px, 30vw, 150px)', height: 'clamp(132px, 36vw, 178px)' }}>
            <HeroIllustration />
          </div>
        </div>

        <KpiStrip orders={poleOrders} />

        <TodaySection
          orders={todayOrders}
          newOrders={newOrders}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId(prev => prev === id ? null : id)}
          navigate={navigate}
        />

        <UpcomingCarousel days={upcomingDays} navigate={navigate} />

        <button
          onClick={() => navigate('/calendrier')}
          className="w-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform animate-fade-up"
          style={{ backgroundColor: '#E5F0F5', borderRadius: 18, padding: '1rem', marginBottom: 28 }}
        >
          <Calendar size={17} color="#432F2E" strokeWidth={1.9} />
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#432F2E', fontFamily: 'Satoshi' }}>Voir le calendrier</span>
          <ChevronRight size={16} color="#432F2E" strokeWidth={2.2} />
        </button>

      </div>

      <div style={{ paddingBottom: 112 }} />

    </div>
  )
}
