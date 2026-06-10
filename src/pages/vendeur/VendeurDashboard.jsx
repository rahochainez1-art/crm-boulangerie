import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeTodayOrders, setStatus } from '../../lib/orders'
import StatusBadge from '../../components/ui/StatusBadge'
import BottomNav from '../../components/layout/BottomNav'

const TABS = [
  { id: 'all',   label: 'Toutes' },
  { id: 'ready', label: 'Prêtes' },
]

export default function VendeurDashboard() {
  const [orders, setOrders]       = useState([])
  const [tab, setTab]             = useState('all')
  const [selected, setSelected]   = useState(null)
  const [prevReady, setPrevReady] = useState(new Set())

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

  // Synchronise la commande sélectionnée si le statut change en temps réel
  useEffect(() => {
    if (!selected) return
    const updated = orders.find(o => o.id === selected.id)
    if (updated) setSelected(updated)
  }, [orders]) // eslint-disable-line react-hooks/exhaustive-deps

  const today = format(new Date(), 'EEEE d MMMM', { locale: fr })
  const ready = orders.filter((o) => o.status === 'ready').length

  const filtered =
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

      {/* Tabs */}
      <div className="flex gap-2 px-4 mt-4">
        {TABS.map((t) => {
          const count =
            t.id === 'all' ? orders.length :
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
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-sm font-semibold text-ink capitalize">Commandes d'aujourd'hui</p>
          <p className="text-xs text-dust capitalize">{format(new Date(), 'EEEE d MMMM', { locale: fr })}</p>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-chalk border border-warm rounded-2xl px-5 py-12 text-center">
            <p className="text-dust text-sm">
              {orders.length === 0 ? "Aucune commande prévue aujourd'hui" : 'Aucune commande ici'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} onOpen={() => setSelected(order)} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Bottom sheet détail */}
      {selected && (
        <OrderSheet order={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

/* ── Carte résumée ────────────────────────────────────────────────────── */
function OrderCard({ order, onOpen }) {
  const reste = (order.totalAmount || 0) - (order.deposit || 0)

  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-chalk border border-warm rounded-2xl overflow-hidden active:opacity-80 transition-opacity"
    >
      <div className="px-4 py-3.5 flex items-start gap-3">
        <div className="flex-shrink-0 text-right">
          <p className="text-[10px] font-bold text-dust uppercase tracking-wide">Retrait à</p>
          <p className="text-2xl font-bold text-ink leading-none tabular-nums tracking-tight">
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </p>
        </div>

        <div className="w-px self-stretch bg-warm flex-shrink-0" />

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

        <span className="flex-shrink-0 self-center text-dust/40 text-lg">›</span>
      </div>
    </button>
  )
}

/* ── Bottom sheet détail ──────────────────────────────────────────────── */
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
      {/* Fond sombre */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50 bg-cream rounded-t-3xl overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Poignée */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-warm" />
        </div>

        {/* Header sheet */}
        <div className="flex items-start justify-between px-5 pt-2 pb-4 border-b border-warm">
          <div>
            <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-0.5">Retrait</p>
            <p className="text-3xl font-bold text-ink tabular-nums tracking-tight leading-none">
              {format(pickup, 'HH:mm')}
            </p>
            <p className="text-sm text-dust capitalize mt-1">
              {format(pickup, 'EEEE d MMMM', { locale: fr })}
            </p>
          </div>
          <div className="text-right">
            <StatusBadge status={order.status} />
            <button onClick={onClose} className="mt-3 text-xs font-semibold text-dust px-3 py-1.5 rounded-xl bg-chalk border border-warm active:opacity-70 block ml-auto">
              Fermer
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[60vh]">

          {/* Client */}
          <div>
            <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1">Client</p>
            <p className="font-semibold text-ink text-lg leading-tight">{order.clientName}</p>
            {order.clientPhone && (
              <a
                href={`tel:${order.clientPhone}`}
                className="text-sm text-dust underline mt-0.5 block active:opacity-70"
              >
                {order.clientPhone}
              </a>
            )}
          </div>

          {/* Articles */}
          <div className="bg-parchment rounded-2xl px-4 py-3.5">
            <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1.5">Commande</p>
            <p className="font-semibold text-ink leading-snug">{order.articles}</p>
          </div>

          {/* Paiement */}
          {order.totalAmount > 0 && (
            <div className="bg-chalk border border-warm rounded-2xl px-4 py-3.5">
              <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-2.5">Paiement</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-dust">Total</p>
                  <p className="font-bold text-ink">{order.totalAmount} €</p>
                </div>
                <div>
                  <p className="text-xs text-dust">Acompte</p>
                  <p className="font-bold text-ink">{order.deposit || 0} €</p>
                </div>
                {reste > 0 ? (
                  <div>
                    <p className="text-xs text-dust">Reste</p>
                    <p className="font-bold text-amber-700">{reste} €</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-dust">Solde</p>
                    <p className="font-bold text-green-700">Soldé ✓</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex gap-2.5">
              <span className="flex-shrink-0">⚠</span>
              <p className="text-sm text-amber-800 leading-relaxed">{order.notes}</p>
            </div>
          )}

          {/* Toggle récupération */}
          {(order.status === 'ready' || order.status === 'done') && (
            <div className="flex rounded-2xl overflow-hidden border border-warm">
              <button
                onClick={() => handleStatus('ready')}
                className={`flex-1 py-3.5 text-sm font-bold transition-colors ${
                  order.status !== 'done'
                    ? 'bg-parchment text-ink'
                    : 'bg-chalk text-dust active:bg-parchment'
                }`}
              >
                Pas encore récupérée
              </button>
              <div className="w-px bg-warm" />
              <button
                onClick={() => handleStatus('done')}
                className={`flex-1 py-3.5 text-sm font-bold transition-colors ${
                  order.status === 'done'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-chalk text-dust active:bg-green-50'
                }`}
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
