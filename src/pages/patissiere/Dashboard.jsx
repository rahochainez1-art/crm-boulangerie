import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, differenceInHours,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeOrders, setStatus, seedFakeOrders, isAssignedTo } from '../../lib/orders'
import AppLayout from '../../components/layout/AppLayout'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function urgency(pickupDate) {
  const h = differenceInHours(parseISO(pickupDate), new Date())
  if (h < 0)  return { bar: 'bg-red-500',   pill: 'bg-red-50 text-red-700 border-red-100',       label: '● En retard' }
  if (h < 24) return { bar: 'bg-red-400',   pill: 'bg-red-50 text-red-700 border-red-100',       label: "● Aujourd'hui" }
  if (h < 48) return { bar: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 border-amber-100', label: '● Demain' }
  return       { bar: 'bg-sage', pill: null, label: null }
}

const PRODUCTION_STATUSES = ['todo', 'inprogress', 'ready']
const STATUS_PICKER = {
  todo:       { label: 'Pas commencé', active: 'bg-ink text-chalk',          idle: 'bg-parchment text-dust border border-warm' },
  inprogress: { label: 'En cours',     active: 'bg-amber-500 text-white',    idle: 'bg-amber-50 text-amber-700 border border-amber-200' },
  ready:      { label: 'Prêt ✓',       active: 'bg-lime text-ink font-bold', idle: 'bg-green-50 text-green-700 border border-green-200' },
}

export default function PatissiereDashboard() {
  const [orders, setOrders]           = useState([])
  const [viewMonth, setViewMonth]     = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [expandedId, setExpandedId]   = useState(null)
  const [seeding, setSeeding]         = useState(false)

  useEffect(() => subscribeOrders(setOrders), [])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const n = await seedFakeOrders()
      toast.success(`${n} commandes test injectées`)
    } catch (e) {
      toast.error('Erreur seed: ' + e.message)
    } finally { setSeeding(false) }
  }

  const activeOrders = useMemo(
    () => orders.filter(o => o.status !== 'done' && isAssignedTo(o, 'patissiere')),
    [orders]
  )

  const dayOrders = useMemo(() =>
    activeOrders
      .filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), selectedDay))
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate)),
    [activeOrders, selectedDay]
  )

  return (
    <AppLayout title="Production">

      {/* Calendrier mensuel */}
      <MonthCalendar
        orders={activeOrders}
        viewMonth={viewMonth}
        setViewMonth={setViewMonth}
        selectedDay={selectedDay}
        onSelectDay={(day) => { if (day) { setSelectedDay(day); setExpandedId(null) } }}
      />

      {/* En-tête du jour sélectionné */}
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-sm font-semibold text-ink capitalize">
          {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
        </p>
        {dayOrders.length > 0 && (
          <span className="text-xs font-bold text-dust">
            {dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Liste commandes */}
      {dayOrders.length === 0 ? (
        <div className="bg-chalk border border-warm rounded-2xl text-center py-12 px-6">
          <p className="text-3xl mb-3">✓</p>
          <p className="font-bold text-ink">Rien ce jour-là</p>
          <p className="text-sm text-dust mt-1 mb-6">Sélectionne un autre jour dans le calendrier</p>
          {orders.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="text-xs font-semibold text-dust border border-warm rounded-xl px-4 py-2.5 active:opacity-70 disabled:opacity-40"
            >
              {seeding ? 'Injection...' : '+ Charger données test'}
            </button>
          )}
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

      {orders.length > 0 && (
        <div className="mt-6 text-center">
          <button onClick={handleSeed} disabled={seeding} className="text-[11px] text-dust/40 active:opacity-70 disabled:opacity-30">
            {seeding ? 'Injection...' : '+ données test'}
          </button>
        </div>
      )}

    </AppLayout>
  )
}

/* ── Calendrier mensuel ──────────────────────────────────────────────── */
function MonthCalendar({ orders, viewMonth, setViewMonth, selectedDay, onSelectDay }) {
  const mStart   = startOfMonth(viewMonth)
  const mEnd     = endOfMonth(viewMonth)
  const calStart = startOfWeek(mStart, { weekStartsOn: 1 })
  const calEnd   = endOfWeek(mEnd,   { weekStartsOn: 1 })
  const days     = eachDayOfInterval({ start: calStart, end: calEnd })

  const monthOrders = orders.filter(o =>
    o.pickupDate && isSameMonth(parseISO(o.pickupDate), viewMonth)
  )
  const activeDays = new Set(monthOrders.map(o => format(parseISO(o.pickupDate), 'yyyy-MM-dd')))

  return (
    <div className="bg-white rounded-2xl p-4 mb-5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>

      {/* Navigation mois */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewMonth(m => subMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-xl active:bg-black/5 text-xl"
          style={{ color: '#6B6B6B' }}
        >‹</button>
        <p className="font-serif font-semibold capitalize text-ink" style={{ fontSize: '1.05rem' }}>
          {format(viewMonth, 'MMMM yyyy', { locale: fr })}
        </p>
        <button
          onClick={() => setViewMonth(m => addMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-xl active:bg-black/5 text-xl"
          style={{ color: '#6B6B6B' }}
        >›</button>
      </div>

      {/* Résumé mois */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-ink/70" />
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

      {/* Labels jours */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <p key={i} className="text-center text-[10px] font-bold uppercase py-1" style={{ color: '#B0B0B0' }}>
            {d}
          </p>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map(day => {
          const inMonth    = isSameMonth(day, viewMonth)
          const count      = inMonth ? orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), day)).length : 0
          const isSelected = selectedDay && isSameDay(day, selectedDay)
          const isToday    = isSameDay(day, new Date())

          return (
            <button
              key={day.toISOString()}
              disabled={!inMonth}
              onClick={() => onSelectDay(day)}
              className="flex flex-col items-center py-1 rounded-xl transition-all active:scale-95"
              style={{
                backgroundColor: isSelected ? '#1A1A1A' : isToday ? '#FBF0DC' : 'transparent',
                opacity: inMonth ? 1 : 0.15,
              }}
            >
              <span className="text-sm font-semibold leading-tight" style={{ color: isSelected ? '#fff' : '#1A1A1A' }}>
                {format(day, 'd')}
              </span>
              <div className="h-3.5 flex items-center justify-center mt-0.5">
                {count > 0 ? (
                  <span
                    className="text-[8px] font-bold px-1 min-w-[14px] h-3.5 flex items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : '#EEED9E',
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

/* ── Carte commande (expandable, avec sélecteur statut) ─────────────── */
function OrderCard({ order, expanded, onToggle }) {
  const [busy, setBusy] = useState(false)
  const u = urgency(order.pickupDate)

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
      <div className={`h-1.5 ${u.bar}`} />

      {/* Ligne résumée — tap pour déplier */}
      <button
        className="w-full px-4 py-3.5 flex items-start gap-3 text-left active:bg-black/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink truncate">{order.clientName}</p>
          <p className="text-xs text-dust truncate mt-0.5">{order.articles}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-sm font-bold text-ink tabular-nums">
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </span>
          {u.label && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${u.pill ?? 'bg-parchment text-dust border-warm'}`}>
              {u.label}
            </span>
          )}
        </div>
        <span
          className="text-dust/40 flex-shrink-0 self-center text-base ml-1 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >↓</span>
      </button>

      {/* Détail étendu */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: '1px solid rgba(232,226,216,0.6)' }}>

          <div className="bg-parchment rounded-xl px-3.5 py-3">
            <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1">Commande</p>
            <p className="font-semibold text-ink leading-snug">{order.articles}</p>
          </div>

          {order.clientPhone && (
            <a href={`tel:${order.clientPhone}`} className="block text-sm text-dust underline active:opacity-70">
              {order.clientPhone}
            </a>
          )}

          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 flex gap-2">
              <span className="text-sm flex-shrink-0">⚠</span>
              <p className="text-xs text-amber-800 leading-relaxed">{order.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {PRODUCTION_STATUSES.map(s => {
              const cfg = STATUS_PICKER[s]
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
