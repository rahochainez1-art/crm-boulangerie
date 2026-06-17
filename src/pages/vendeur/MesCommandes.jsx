import { useEffect, useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeOrders, updateOrder, cancelOrder } from '../../lib/orders'
import { useRole } from '../../context/RoleContext'
import StatusBadge from '../../components/ui/StatusBadge'

const TABS = [
  { id: 'all',       label: 'Toutes' },
  { id: 'active',    label: 'En cours' },
  { id: 'done',      label: 'Terminées' },
  { id: 'cancelled', label: 'Annulées' },
]

function isActive(status) {
  return status === 'todo' || status === 'inprogress' || status === 'ready'
}

export default function MesCommandes() {
  const [orders, setOrders] = useState([])
  const [tab, setTab]       = useState('all')
  const { vendeurName, setVendeurName } = useRole()
  const [nameInput, setNameInput] = useState('')

  useEffect(() => subscribeOrders(setOrders), [])

  const myOrders = useMemo(() => {
    if (!vendeurName) return []
    return [...orders.filter(o => o.createdBy === vendeurName)].sort((a, b) => {
      const sa = a.createdAt?.seconds ?? 0
      const sb = b.createdAt?.seconds ?? 0
      return sb - sa
    })
  }, [orders, vendeurName])

  const counts = useMemo(() => ({
    all:       myOrders.length,
    active:    myOrders.filter(o => isActive(o.status)).length,
    done:      myOrders.filter(o => o.status === 'done').length,
    cancelled: myOrders.filter(o => o.status === 'cancelled').length,
  }), [myOrders])

  const filtered = useMemo(() => {
    if (tab === 'active')    return myOrders.filter(o => isActive(o.status))
    if (tab === 'done')      return myOrders.filter(o => o.status === 'done')
    if (tab === 'cancelled') return myOrders.filter(o => o.status === 'cancelled')
    return myOrders
  }, [myOrders, tab])

  // Pas encore de prénom sauvegardé
  if (!vendeurName) {
    return (
      <div className="min-h-dvh bg-cream flex flex-col max-w-lg mx-auto px-5 justify-center"
        style={{ paddingBottom: 'max(96px, env(safe-area-inset-bottom))' }}>
        <h1 className="font-serif text-3xl font-bold text-ink mb-2">Votre prénom ?</h1>
        <p className="text-dust mb-8">Pour retrouver vos commandes.</p>
        <form onSubmit={(e) => { e.preventDefault(); const t = nameInput.trim(); if (t) setVendeurName(t) }}
          className="space-y-4">
          <input
            autoFocus value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="Ex : Sophie" className="field text-lg" required
          />
          <button type="submit" disabled={!nameInput.trim()} className="btn-primary disabled:opacity-40">
            Valider
          </button>
        </form>
  
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream flex flex-col max-w-lg mx-auto">
      <header
        className="bg-cream px-5 pb-4 border-b border-warm"
        style={{ paddingTop: 'max(48px, env(safe-area-inset-top))' }}
      >
        <p className="label-xs mb-1">Au Grand Jour</p>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Mes commandes</h1>
            <p className="text-sm text-dust">{vendeurName}</p>
          </div>
          {counts.all > 0 && (
            <span className="text-xs font-bold text-dust">
              {counts.all} commande{counts.all > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Filtres */}
      <div className="flex gap-1.5 px-4 pt-4 overflow-x-auto scrollbar-none pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-ink text-chalk' : 'bg-chalk text-dust border border-warm'
            }`}
          >
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`ml-1.5 text-xs ${tab === t.id ? 'opacity-50' : 'opacity-60'}`}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      <main className="flex-1 px-4 pt-3 pb-28 overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-chalk border border-warm rounded-2xl px-5 py-12 text-center mt-2">
            <p className="text-dust text-sm">
              {myOrders.length === 0 ? 'Aucune commande pour le moment' : 'Aucune commande dans cette catégorie'}
            </p>
          </div>
        ) : (
          filtered.map(order => <OrderCard key={order.id} order={order} />)
        )}
      </main>


    </div>
  )
}

function OrderCard({ order }) {
  const [editing,     setEditing]     = useState(false)
  const [cancelling,  setCancelling]  = useState(false)
  const [busy,        setBusy]        = useState(false)

  const pickupDate = parseISO(order.pickupDate)
  const [form, setForm] = useState({
    clientName:  order.clientName,
    clientPhone: order.clientPhone || '',
    articles:    order.articles,
    pickupDate:  format(pickupDate, 'yyyy-MM-dd'),
    pickupTime:  format(pickupDate, 'HH:mm'),
    deposit:     order.deposit ?? 0,
    totalAmount: order.totalAmount ?? 0,
    notes:       order.notes || '',
  })

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSave = async () => {
    setBusy(true)
    try {
      await updateOrder(order.id, {
        clientName:  form.clientName,
        clientPhone: form.clientPhone,
        articles:    form.articles,
        pickupDate:  `${form.pickupDate}T${form.pickupTime}:00`,
        deposit:     Number(form.deposit) || 0,
        totalAmount: Number(form.totalAmount) || 0,
        notes:       form.notes,
      })
      toast.success('Commande mise à jour')
      setEditing(false)
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setBusy(false) }
  }

  const handleCancel = async () => {
    setBusy(true)
    try {
      await cancelOrder(order.id)
      toast.success('Commande annulée')
      setCancelling(false)
    } catch {
      toast.error('Erreur lors de l\'annulation')
    } finally {
      setBusy(false)
    }
  }

  const isCancelled = order.status === 'cancelled'
  const isDone      = order.status === 'done'
  const canEdit     = !isCancelled && !isDone

  return (
    <div className={`bg-chalk border rounded-2xl overflow-hidden transition-all ${
      isCancelled ? 'border-red-100 opacity-70' : 'border-warm'
    }`}>

      {/* Vue résumé */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink truncate">{order.clientName}</p>
            <p className="text-sm text-dust truncate mt-0.5">{order.articles}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="flex items-center gap-3 text-xs text-dust mt-2 flex-wrap">
          <span>📅 {format(pickupDate, 'dd MMM à HH:mm', { locale: fr })}</span>
          {order.totalAmount > 0 && (
            <span className="font-semibold text-ink">{order.totalAmount} €</span>
          )}
          {(order.totalAmount - (order.deposit || 0)) > 0 && (
            <span className="text-amber-700 font-semibold">
              ({order.totalAmount - order.deposit} € à encaisser)
            </span>
          )}
        </div>

        {/* Actions */}
        {canEdit && !editing && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setEditing(true)}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-parchment text-dust border border-warm active:opacity-70"
            >
              Modifier
            </button>
            {!cancelling ? (
              <button
                onClick={() => setCancelling(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 border border-red-100 bg-red-50/50 active:opacity-70"
              >
                Annuler
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500 text-white active:opacity-70 disabled:opacity-50"
                >
                  {busy ? '…' : 'Confirmer'}
                </button>
                <button
                  onClick={() => setCancelling(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-parchment text-dust border border-warm active:opacity-70"
                >
                  Non
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formulaire d'édition inline */}
      {editing && (
        <div className="border-t border-warm px-4 pb-4 pt-3 space-y-3">
          <p className="text-[10px] font-bold text-dust uppercase tracking-widest">Modifier</p>

          <div className="space-y-2">
            <input value={form.clientName}  onChange={set('clientName')}  className="field" placeholder="Nom client" />
            <input value={form.clientPhone} onChange={set('clientPhone')} className="field" placeholder="Téléphone" />
          </div>

          <textarea value={form.articles} onChange={set('articles')} rows={2} className="field resize-none" placeholder="Articles" />

          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.pickupDate} onChange={set('pickupDate')} className="field" />
            <input type="time" value={form.pickupTime} onChange={set('pickupTime')} className="field" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-dust mb-1">Acompte (€)</p>
              <input type="number" value={form.deposit}     onChange={set('deposit')}     className="field" min="0" step="0.5" />
            </div>
            <div>
              <p className="text-[10px] text-dust mb-1">Total (€)</p>
              <input type="number" value={form.totalAmount} onChange={set('totalAmount')} className="field" min="0" step="0.5" />
            </div>
          </div>

          <textarea value={form.notes} onChange={set('notes')} rows={2} className="field resize-none" placeholder="Notes, allergies..." />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-ink text-chalk active:opacity-70 disabled:opacity-50"
            >
              {busy ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-parchment text-dust border border-warm active:opacity-70"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
