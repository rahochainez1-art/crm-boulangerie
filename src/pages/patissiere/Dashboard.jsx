import { useEffect, useState, useMemo } from 'react'
import {
  format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval,
  parseISO, isSameDay, differenceInHours,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeOrders, advanceStatus, STATUS_NEXT, STATUS_LABELS } from '../../lib/orders'
import AppLayout from '../../components/layout/AppLayout'

function weekDays(offset = 0) {
  const base = addWeeks(new Date(), offset)
  return eachDayOfInterval({
    start: startOfWeek(base, { weekStartsOn: 1 }),
    end:   endOfWeek(base,   { weekStartsOn: 1 }),
  })
}

function urgency(pickupDate) {
  const h = differenceInHours(parseISO(pickupDate), new Date())
  if (h < 0)  return { bar: 'bg-red-500',   pill: 'bg-red-50 text-red-700 border-red-100',     label: '● En retard' }
  if (h < 24) return { bar: 'bg-red-400',   pill: 'bg-red-50 text-red-700 border-red-100',     label: "● Aujourd'hui" }
  if (h < 48) return { bar: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 border-amber-100', label: '● Demain' }
  return       { bar: 'bg-sage',            pill: null, label: null }
}

const STATUS_STYLE = {
  todo:       'bg-parchment text-dust border-warm',
  inprogress: 'bg-amber-50 text-amber-800 border-amber-100',
  ready:      'bg-green-50 text-green-800 border-green-100',
}

export default function PatissiereDashboard() {
  const [orders, setOrders]       = useState([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(() => new Date())

  useEffect(() => subscribeOrders(setOrders), [])

  const days = useMemo(() => weekDays(weekOffset), [weekOffset])

  const handleWeekChange = (offset) => {
    setWeekOffset(offset)
    setSelectedDay(offset === 0 ? new Date() : weekDays(offset)[0])
  }

  const activeOrders = useMemo(
    () => orders.filter(o => o.status !== 'done'),
    [orders]
  )

  const countForDay = (day) =>
    activeOrders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), day)).length

  const weekTotal = days.reduce((sum, d) => sum + countForDay(d), 0)

  const dayOrders = useMemo(() =>
    activeOrders
      .filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), selectedDay))
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate)),
    [activeOrders, selectedDay]
  )

  return (
    <AppLayout title="Production">

      {/* Sélecteur de semaine */}
      <div className="flex gap-2 mb-5">
        {[0, 1].map(offset => {
          const total = weekDays(offset).reduce(
            (sum, d) => sum + activeOrders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), d)).length,
            0
          )
          return (
            <button
              key={offset}
              onClick={() => handleWeekChange(offset)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                weekOffset === offset
                  ? 'bg-ink text-chalk'
                  : 'bg-chalk text-dust border border-warm'
              }`}
            >
              {offset === 0 ? 'Cette semaine' : 'Semaine pro'}
              {total > 0 && (
                <span className={`ml-1.5 text-xs ${weekOffset === offset ? 'opacity-50' : 'opacity-60'}`}>
                  {total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bande de jours */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none mb-5">
        {days.map(day => {
          const count      = countForDay(day)
          const isSelected = isSameDay(day, selectedDay)
          const isToday    = isSameDay(day, new Date())
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 flex flex-col items-center rounded-2xl px-2.5 py-2.5 min-w-[46px] transition-colors ${
                isSelected ? 'bg-ink text-chalk' :
                isToday    ? 'bg-lime text-ink border border-lime/30' :
                             'bg-chalk text-ink border border-warm'
              }`}
            >
              <span className="text-[9px] font-bold uppercase tracking-wide opacity-60">
                {format(day, 'EEE', { locale: fr })}
              </span>
              <span className="text-base font-bold leading-snug">{format(day, 'd')}</span>
              <span className={`text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center mt-0.5 ${
                count > 0
                  ? isSelected ? 'bg-chalk/20 text-chalk' : 'bg-ink/10 text-ink'
                  : 'opacity-0'
              }`}>
                {count || '·'}
              </span>
            </button>
          )
        })}
      </div>

      {/* En-tête du jour */}
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

      {/* Liste des commandes */}
      {dayOrders.length === 0 ? (
        <div className="bg-chalk border border-warm rounded-2xl text-center py-16">
          <p className="text-3xl mb-3">✓</p>
          <p className="font-bold text-ink">Rien ce jour-là</p>
          <p className="text-sm text-dust mt-1">Sélectionne un autre jour</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayOrders.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      )}

    </AppLayout>
  )
}

function OrderCard({ order }) {
  const [busy, setBusy] = useState(false)
  const u = urgency(order.pickupDate)
  const canAdvance = !!STATUS_NEXT[order.status]

  const handleAdvance = async () => {
    setBusy(true)
    try {
      await advanceStatus(order.id, order.status)
      toast.success(
        order.status === 'inprogress' ? '✓ Prêt — vendeur notifié' : 'Mis à jour'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-chalk border border-warm rounded-2xl overflow-hidden">
      {/* Barre urgence */}
      <div className={`h-1.5 ${u.bar}`} />

      <div className="p-4 space-y-3">

        {/* Ligne 1 : heure + client + statut */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-3xl font-bold text-ink leading-none tabular-nums tracking-tight">
              {format(parseISO(order.pickupDate), 'HH:mm')}
            </p>
            <p className="text-sm font-semibold text-ink mt-1">{order.clientName}</p>
            {order.clientPhone && (
              <a href={`tel:${order.clientPhone}`} className="text-xs text-dust underline mt-0.5 block">
                {order.clientPhone}
              </a>
            )}
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${STATUS_STYLE[order.status] ?? STATUS_STYLE.todo}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Bloc article — zone la plus lisible */}
        <div className="bg-parchment rounded-xl px-3.5 py-3">
          <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1">Commande</p>
          <p className="font-semibold text-ink leading-snug text-base">{order.articles}</p>
        </div>

        {/* Allergies / notes */}
        {order.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 flex gap-2">
            <span className="text-sm flex-shrink-0">⚠</span>
            <p className="text-xs text-amber-800 leading-relaxed">{order.notes}</p>
          </div>
        )}

        {/* Ligne bas : urgence + bouton action */}
        <div className="flex items-center justify-between pt-0.5">
          <div>
            {u.label && (
              <span className={`text-xs font-bold ${u.pill ? '' : 'text-dust'}`}>
                {u.label}
              </span>
            )}
          </div>
          {canAdvance && (
            <button
              onClick={handleAdvance}
              disabled={busy}
              className={`font-bold rounded-xl px-5 py-2.5 text-sm min-h-[44px] transition-opacity active:opacity-70 disabled:opacity-40 ${
                order.status === 'inprogress'
                  ? 'bg-lime text-ink'
                  : 'bg-ink text-chalk'
              }`}
            >
              {busy ? '…' : order.status === 'todo' ? 'Démarrer →' : 'Prêt ✓'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
