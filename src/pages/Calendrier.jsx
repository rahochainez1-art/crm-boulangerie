import { useEffect, useState } from 'react'
import { format, addDays, startOfDay, parseISO, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { subscribeOrders } from '../lib/orders'
import StatusBadge from '../components/ui/StatusBadge'
import AppLayout from '../components/layout/AppLayout'

export default function Calendrier() {
  const [orders, setOrders] = useState([])
  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()))
  const days = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i))

  useEffect(() => subscribeOrders(setOrders), [])

  const countForDay = (day) =>
    orders.filter((o) => o.pickupDate && isSameDay(parseISO(o.pickupDate), day)).length

  const ordersForDay = orders
    .filter((o) => o.pickupDate && isSameDay(parseISO(o.pickupDate), selectedDay))
    .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))

  return (
    <AppLayout title="Calendrier">
      {/* Sélecteur 14 jours */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 scrollbar-none">
        {days.map((day) => {
          const count = countForDay(day)
          const isSelected = isSameDay(day, selectedDay)
          const isToday = isSameDay(day, new Date())
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 flex flex-col items-center rounded-2xl px-3 py-3 min-w-[56px] transition-colors ${
                isSelected
                  ? 'bg-eerie text-white'
                  : isToday
                  ? 'bg-vanilla text-eerie'
                  : 'bg-white text-eerie'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                {format(day, 'EEE', { locale: fr })}
              </span>
              <span className="text-xl font-bold leading-snug">{format(day, 'd')}</span>
              {count > 0 ? (
                <span className={`text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center mt-0.5 ${
                  isSelected ? 'bg-white text-eerie' : 'bg-vanilla text-eerie'
                }`}>
                  {count}
                </span>
              ) : (
                <span className="h-5 mt-0.5" />
              )}
            </button>
          )
        })}
      </div>

      {/* Jour sélectionné */}
      <p className="text-sm font-semibold text-eerie mb-3 capitalize">
        {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
      </p>

      {ordersForDay.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-2xl mb-2">—</p>
          <p className="text-eerie/40 text-sm">Aucune commande ce jour-là</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordersForDay.map((order) => (
            <div key={order.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-eerie truncate">{order.clientName}</p>
                  <p className="text-sm text-eerie/60 mt-0.5 line-clamp-2">{order.articles}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-eerie/40">
                      {format(parseISO(order.pickupDate), 'HH:mm')}
                    </span>
                    {order.clientPhone && (
                      <a href={`tel:${order.clientPhone}`} className="text-xs text-eerie/40 underline">
                        {order.clientPhone}
                      </a>
                    )}
                  </div>
                  {order.notes && (
                    <p className="text-xs text-eerie/50 mt-2 bg-vanilla/40 rounded-xl px-2.5 py-1.5 line-clamp-2">
                      {order.notes}
                    </p>
                  )}
                </div>
                {(order.totalAmount > 0) && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-eerie">{order.totalAmount} €</p>
                    {order.deposit > 0 && (
                      <p className="text-xs text-eerie/40">−{order.deposit} € acompte</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
