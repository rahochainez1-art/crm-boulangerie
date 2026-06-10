import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeTodayOrders, advanceStatus } from '../../lib/orders'
import StatusBadge from '../../components/ui/StatusBadge'
import BottomNav from '../../components/layout/BottomNav'

const TABS = [
  { id: 'all',   label: 'Toutes' },
  { id: 'todo',  label: 'À faire' },
  { id: 'ready', label: 'Prêtes' },
]

export default function VendeurDashboard() {
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('all')
  const [prevReady, setPrevReady] = useState(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    return subscribeTodayOrders((newOrders) => {
      const newReady = new Set(newOrders.filter((o) => o.status === 'ready').map((o) => o.id))
      newReady.forEach((id) => {
        if (!prevReady.has(id)) {
          const order = newOrders.find((o) => o.id === id)
          toast.success(`Prête — ${order?.clientName}`, { duration: 6000 })
        }
      })
      setPrevReady(newReady)
      setOrders(newOrders)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const today = format(new Date(), 'EEEE d MMMM', { locale: fr })
  const ready = orders.filter((o) => o.status === 'ready').length

  const filtered =
    tab === 'todo'  ? orders.filter((o) => o.status === 'todo' || o.status === 'inprogress') :
    tab === 'ready' ? orders.filter((o) => o.status === 'ready') :
    orders

  return (
    <div className="min-h-dvh bg-cream flex flex-col max-w-lg mx-auto">

      {/* Header */}
      <header
        className="bg-cream px-5 pb-5 border-b border-warm"
        style={{ paddingTop: 'max(48px, env(safe-area-inset-top))' }}
      >
        <p className="label-xs mb-2">Au Grand Jour · {today}</p>
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold text-ink">Bonjour 👋</h1>
          {ready > 0 && (
            <span className="bg-lime text-ink text-xs font-bold px-3 py-1.5 rounded-full">
              {ready} prête{ready > 1 ? 's' : ''} ✓
            </span>
          )}
        </div>
      </header>

      {/* CTA */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate('/vendeur/nouvelle-commande')}
          className="w-full bg-ink text-chalk rounded-2xl px-5 py-4 flex items-center justify-between active:opacity-80 transition-opacity"
        >
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-chalk/40 mb-0.5">
              Nouvelle commande
            </p>
            <p className="font-bold text-base">Saisir une commande</p>
          </div>
          <span className="w-10 h-10 bg-chalk/10 rounded-xl flex items-center justify-center text-xl font-light">
            +
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mt-4">
        {TABS.map((t) => {
          const count =
            t.id === 'all'   ? orders.length :
            t.id === 'todo'  ? orders.filter((o) => o.status === 'todo' || o.status === 'inprogress').length :
                               orders.filter((o) => o.status === 'ready').length
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                tab === t.id ? 'bg-ink text-chalk' : 'bg-chalk text-dust border border-warm'
              }`}
            >
              {t.label}{count > 0 && ` ${count}`}
            </button>
          )
        })}
      </div>

      {/* Liste */}
      <main className="flex-1 px-4 pt-4 pb-28 overflow-y-auto">

        {/* Titre section */}
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-sm font-semibold text-ink capitalize">
            Commandes d'aujourd'hui
          </p>
          <p className="text-xs text-dust capitalize">
            {format(new Date(), 'EEEE d MMMM', { locale: fr })}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-chalk border border-warm rounded-2xl px-5 py-12 text-center">
            <p className="text-dust text-sm">
              {orders.length === 0 ? 'Aucune commande prévue aujourd\'hui' : 'Aucune commande ici'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((order) => {
              const reste = (order.totalAmount || 0) - (order.deposit || 0)
              return (
                <div key={order.id} className="bg-chalk border border-warm rounded-2xl px-4 py-3.5 flex items-start gap-3">
                  {/* Heure */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] font-bold text-dust uppercase tracking-wide">Retrait à</p>
                    <p className="text-2xl font-bold text-ink leading-none tabular-nums tracking-tight">
                      {format(parseISO(order.pickupDate), 'HH:mm')}
                    </p>
                  </div>

                  <div className="w-px self-stretch bg-warm flex-shrink-0" />

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">{order.clientName}</p>
                    <p className="text-sm text-dust truncate mt-0.5">{order.articles}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <StatusBadge status={order.status} />
                      {reste > 0 && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                          {reste} € à encaisser
                        </span>
                      )}
                      {reste === 0 && order.totalAmount > 0 && (
                        <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                          Soldé ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Avancer */}
                  {order.status !== 'done' && (
                    <button
                      onClick={() => advanceStatus(order.id, order.status).then(() => toast.success('Mis à jour'))}
                      className="flex-shrink-0 self-center w-11 h-11 flex items-center justify-center rounded-xl bg-parchment text-dust text-lg active:bg-ink active:text-chalk transition-colors"
                    >
                      →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
