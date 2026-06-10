import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, differenceInHours,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeOrders, setStatus, isAssignedTo } from '../lib/orders'
import { getUrgencyHours } from '../lib/settings'
import { useRole } from '../context/RoleContext'
import AppLayout from '../components/layout/AppLayout'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// Badge jour : rouge si ≥1 todo · orange si ≥1 inprogress · vert si tout ready/done
function dayBadge(orders) {
  if (orders.length === 0) return null
  if (orders.some(o => o.status === 'todo'))       return { bg: '#FEE2E2', color: '#DC2626', ring: '#FCA5A5' }
  if (orders.some(o => o.status === 'inprogress')) return { bg: '#FEF3C7', color: '#D97706', ring: '#FCD34D' }
  return                                                  { bg: '#DCFCE7', color: '#16A34A', ring: '#86EFAC' }
}

function urgencyBar(pickupDate) {
  const h = differenceInHours(parseISO(pickupDate), new Date())
  const t = getUrgencyHours()
  if (h < 0)      return 'bg-red-500'
  if (h < t)      return 'bg-red-400'
  if (h < t + 24) return 'bg-amber-400'
  return 'bg-sage'
}

const PRODUCTION_STATUSES = ['todo', 'inprogress', 'ready']
const STATUS_PICKER = {
  todo:       { label: 'Pas commencé', active: 'bg-ink text-chalk',          idle: 'bg-parchment text-dust border border-warm' },
  inprogress: { label: 'En cours',     active: 'bg-amber-500 text-white',    idle: 'bg-amber-50 text-amber-700 border border-amber-200' },
  ready:      { label: 'Prêt ✓',       active: 'bg-lime text-ink font-bold', idle: 'bg-green-50 text-green-700 border border-green-200' },
}

export default function Calendrier() {
  const { role }   = useRole()
  const pole       = role === 'boulangerie' ? 'boulangerie' : 'patissiere'

  const [allOrders, setAllOrders]     = useState([])
  const [viewMonth, setViewMonth]     = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [expandedId, setExpandedId]   = useState(null)

  useEffect(() => subscribeOrders(setAllOrders), [])

  // Uniquement les commandes du pôle actuel, non récupérées
  const poleOrders = useMemo(
    () => allOrders.filter(o => o.status !== 'done' && isAssignedTo(o, pole)),
    [allOrders, pole]
  )

  // Commandes du jour sélectionné
  const dayOrders = useMemo(() =>
    poleOrders
      .filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), selectedDay))
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate)),
    [poleOrders, selectedDay]
  )

  // Grille du mois
  const calDays = useMemo(() => {
    const mStart = startOfMonth(viewMonth)
    const mEnd   = endOfMonth(viewMonth)
    return eachDayOfInterval({
      start: startOfWeek(mStart, { weekStartsOn: 1 }),
      end:   endOfWeek(mEnd,     { weekStartsOn: 1 }),
    })
  }, [viewMonth])

  const monthOrders = useMemo(
    () => poleOrders.filter(o => o.pickupDate && isSameMonth(parseISO(o.pickupDate), viewMonth)),
    [poleOrders, viewMonth]
  )
  const activeDays = useMemo(
    () => new Set(monthOrders.map(o => format(parseISO(o.pickupDate), 'yyyy-MM-dd'))),
    [monthOrders]
  )

  // Commandes par jour (pour les badges)
  const ordersByDay = useMemo(() => {
    const map = {}
    monthOrders.forEach(o => {
      const key = format(parseISO(o.pickupDate), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(o)
    })
    return map
  }, [monthOrders])

  return (
    <AppLayout title="Calendrier">

      {/* ── Calendrier mensuel ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 mb-5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>

        {/* Navigation mois */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { setViewMonth(m => subMonths(m, 1)); setExpandedId(null) }}
            className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-black/5 text-2xl font-light"
            style={{ color: '#6B6B6B' }}
          >‹</button>
          <p className="font-serif font-semibold capitalize text-ink" style={{ fontSize: '1.05rem' }}>
            {format(viewMonth, 'MMMM yyyy', { locale: fr })}
          </p>
          <button
            onClick={() => { setViewMonth(m => addMonths(m, 1)); setExpandedId(null) }}
            className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-black/5 text-2xl font-light"
            style={{ color: '#6B6B6B' }}
          >›</button>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-3 mb-4 px-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-[10px] text-dust">À faire</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[10px] text-dust">En cours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-[10px] text-dust">Tout prêt</span>
          </div>
          <span className="text-[10px] text-dust ml-auto">
            <span className="font-bold text-ink">{monthOrders.length}</span> cmd · <span className="font-bold text-ink">{activeDays.size}</span> jour{activeDays.size > 1 ? 's' : ''}
          </span>
        </div>

        {/* Labels colonnes */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d, i) => (
            <p key={i} className="text-center text-[10px] font-bold uppercase py-1" style={{ color: '#B0B0B0' }}>
              {d}
            </p>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7 gap-y-1">
          {calDays.map(day => {
            const inMonth    = isSameMonth(day, viewMonth)
            const key        = format(day, 'yyyy-MM-dd')
            const dayOrd     = inMonth ? (ordersByDay[key] ?? []) : []
            const badge      = dayBadge(dayOrd)
            const isSelected = isSameDay(day, selectedDay)
            const isToday    = isSameDay(day, new Date())

            return (
              <button
                key={day.toISOString()}
                disabled={!inMonth}
                onClick={() => { setSelectedDay(day); setExpandedId(null) }}
                className="flex flex-col items-center py-1.5 rounded-xl transition-all active:scale-95"
                style={{
                  backgroundColor: isSelected ? '#1A1A1A' : isToday ? '#FBF0DC' : 'transparent',
                  opacity: inMonth ? 1 : 0.12,
                }}
              >
                <span
                  className="text-sm font-semibold leading-tight"
                  style={{ color: isSelected ? '#fff' : '#1A1A1A' }}
                >
                  {format(day, 'd')}
                </span>

                {/* Badge coloré */}
                <div className="h-4 flex items-center justify-center mt-0.5">
                  {badge ? (
                    <span
                      className="text-[9px] font-bold px-1.5 min-w-[18px] h-4 flex items-center justify-center rounded-full leading-none"
                      style={isSelected
                        ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }
                        : { backgroundColor: badge.bg, color: badge.color, outline: `1.5px solid ${badge.ring}` }
                      }
                    >
                      {dayOrd.length}
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Liste commandes du jour ────────────────────────────────── */}
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-semibold text-ink capitalize">
          {isSameDay(selectedDay, new Date())
            ? "Commandes d'aujourd'hui"
            : `Commandes du ${format(selectedDay, 'd MMMM', { locale: fr })}`}
        </p>
        {dayOrders.length > 0 && (
          <span className="text-xs font-bold text-dust">
            {dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {dayOrders.length === 0 ? (
        <div className="bg-chalk border border-warm rounded-2xl text-center py-12 px-6">
          <p className="text-2xl mb-3">—</p>
          <p className="font-bold text-ink">Rien ce jour-là</p>
          <p className="text-sm text-dust mt-1">Sélectionne un jour coloré dans le calendrier</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId(prev => prev === order.id ? null : order.id)}
            />
          ))}
        </div>
      )}

    </AppLayout>
  )
}

/* ── Carte commande ──────────────────────────────────────────────────── */
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
    <div className="bg-chalk border border-warm rounded-2xl overflow-hidden">
      <div className={`h-1.5 ${urgencyBar(order.pickupDate)}`} />

      {/* Résumé cliquable */}
      <button
        className="w-full px-4 py-3.5 flex items-start gap-3 text-left active:bg-black/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-shrink-0 text-right min-w-[44px]">
          <p className="text-[10px] font-bold text-dust uppercase tracking-wide leading-none mb-1">Retrait</p>
          <p className="text-xl font-bold text-ink tabular-nums leading-none">
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </p>
        </div>

        <div className="w-px self-stretch bg-warm flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink truncate">{order.clientName}</p>
          <p className="text-sm text-dust truncate mt-0.5">{order.articles}</p>
          {/* Badge statut visible en résumé */}
          <div className="mt-2">
            <StatusPill status={order.status} />
          </div>
        </div>

        <span
          className="text-dust/40 flex-shrink-0 self-center text-base transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >↓</span>
      </button>

      {/* Détail déplié */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: '1px solid rgba(232,226,216,0.6)' }}>

          {/* Articles */}
          <div className="bg-parchment rounded-xl px-3.5 py-3">
            <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1.5">Commande</p>
            <p className="font-semibold text-ink leading-relaxed">{order.articles}</p>
          </div>

          {/* Notes / allergies — fond jaune pâle mis en évidence */}
          {order.notes && (
            <div className="rounded-xl px-3.5 py-3 flex gap-2.5" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <span className="text-base flex-shrink-0">⚠️</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#92400E' }}>
                  Attention
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#78350F' }}>{order.notes}</p>
              </div>
            </div>
          )}

          {/* Sélecteur de statut */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
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
    todo:       { label: 'À faire',      cls: 'bg-parchment text-dust border border-warm' },
    inprogress: { label: 'En cours',     cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    ready:      { label: 'Prêt ✓',       cls: 'bg-green-50 text-green-700 border border-green-200' },
    done:       { label: 'Récupéré',     cls: 'bg-chalk text-dust/60 border border-warm/50' },
    cancelled:  { label: 'Annulée',      cls: 'bg-red-50 text-red-400 border border-red-100' },
  }
  const cfg = map[status] ?? map.todo
  return (
    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
