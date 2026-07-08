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

  // Saisie du prénom
  if (!vendeurName) {
    return (
      <div
        className="min-h-dvh flex flex-col max-w-lg mx-auto px-5 justify-center"
        style={{ backgroundColor: '#F5F2EB', paddingBottom: 'max(96px, env(safe-area-inset-bottom))' }}
      >
        <p className="label-xs mb-3">Au Grand Jour</p>
        <h1 className="font-display mb-2" style={{ fontSize: '1.75rem', color: '#111111' }}>
          Votre prénom ?
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#8A7060', marginBottom: '2rem', fontFamily: 'Satoshi' }}>
          Pour retrouver vos commandes.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); const t = nameInput.trim(); if (t) setVendeurName(t) }}
          className="space-y-3"
        >
          <input
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="Ex : Sophie"
            className="field"
            style={{ fontSize: '1.0625rem' }}
            required
          />
          <button type="submit" disabled={!nameInput.trim()} className="btn-primary disabled:opacity-40">
            Valider
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#F5F2EB' }}>

      {/* Header */}
      <header
        className="px-5 pb-5"
        style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}
      >
        <p className="label-xs mb-3">Au Grand Jour</p>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: '#111111', letterSpacing: '-0.025em' }}>
              Mes commandes
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 4 }}>
              {vendeurName}
            </p>
          </div>
          {counts.all > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi' }}>
              {counts.all} commande{counts.all > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Chips de filtre */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto scrollbar-none">
        {TABS.map(t => {
          const isTabActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-shrink-0 active:scale-95 transition-transform"
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: 9999,
                backgroundColor: isTabActive ? '#432F2E' : 'rgba(67,47,46,0.07)',
                color: isTabActive ? '#FFFFFF' : '#8A7060',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Satoshi',
                letterSpacing: '-0.01em',
              }}
            >
              {t.label}
              {counts[t.id] > 0 && (
                <span style={{ marginLeft: 4, opacity: isTabActive ? 0.6 : 0.7 }}>
                  · {counts[t.id]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Liste */}
      <main className="flex-1 px-5 pb-28 overflow-y-auto space-y-2.5">
        {filtered.length === 0 ? (
          <div
            className="rounded-[20px] px-5 py-12 text-center mt-2"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)' }}
          >
            <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>
              {myOrders.length === 0 ? 'Aucune commande pour le moment' : 'Aucune commande ici'}
            </p>
          </div>
        ) : (
          filtered.map((order, i) => (
            <OrderCard key={order.id} order={order} index={i} />
          ))
        )}
      </main>
    </div>
  )
}

function OrderCard({ order, index }) {
  const [editing,    setEditing]    = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [busy,       setBusy]       = useState(false)

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
    } finally { setBusy(false) }
  }

  const handleCancel = async () => {
    setBusy(true)
    try {
      await cancelOrder(order.id)
      toast.success('Commande annulée')
      setCancelling(false)
    } catch {
      toast.error("Erreur lors de l'annulation")
    } finally { setBusy(false) }
  }

  const isCancelled = order.status === 'cancelled'
  const isDone      = order.status === 'done'
  const canEdit     = !isCancelled && !isDone
  const reste       = (order.totalAmount || 0) - (order.deposit || 0)

  return (
    <div
      className="overflow-hidden animate-fade-up"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        border: isCancelled ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(67,47,46,0.08)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(67,47,46,0.06)',
        opacity: isCancelled ? 0.75 : 1,
        animationDelay: `${index * 0.03}s`,
      }}
    >
      {/* Vue résumé */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.clientName}
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
              {order.articles}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: 8 }}>
          <span style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>
            {format(pickupDate, 'dd MMM à HH:mm', { locale: fr })}
          </span>
          {order.totalAmount > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>
              {order.totalAmount} €
            </span>
          )}
          {reste > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E', fontFamily: 'Satoshi' }}>
              ({reste} € à encaisser)
            </span>
          )}
        </div>

        {/* Actions */}
        {canEdit && !editing && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setEditing(true)}
              className="flex-1 active:opacity-70"
              style={{
                padding: '0.5rem',
                borderRadius: 10,
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(67,47,46,0.06)',
                color: '#432F2E',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Satoshi',
              }}
            >
              Modifier
            </button>
            {!cancelling ? (
              <button
                onClick={() => setCancelling(true)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 10,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#EF4444',
                  backgroundColor: 'rgba(239,68,68,0.06)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Satoshi',
                }}
              >
                Annuler
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 10,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Satoshi',
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  {busy ? '…' : 'Confirmer'}
                </button>
                <button
                  onClick={() => setCancelling(false)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 10,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: 'rgba(67,47,46,0.06)',
                    color: '#8A7060',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Satoshi',
                  }}
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
        <div
          className="px-4 pb-4 pt-3 space-y-3"
          style={{ borderTop: '1px solid rgba(67,47,46,0.07)' }}
        >
          <p className="label-xs">Modifier</p>

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
              <p style={{ fontSize: '0.6875rem', color: '#8A7060', marginBottom: 4, fontFamily: 'Satoshi' }}>Acompte (€)</p>
              <input type="number" value={form.deposit}     onChange={set('deposit')}     className="field" min="0" step="0.5" />
            </div>
            <div>
              <p style={{ fontSize: '0.6875rem', color: '#8A7060', marginBottom: 4, fontFamily: 'Satoshi' }}>Total (€)</p>
              <input type="number" value={form.totalAmount} onChange={set('totalAmount')} className="field" min="0" step="0.5" />
            </div>
          </div>

          <textarea value={form.notes} onChange={set('notes')} rows={2} className="field resize-none" placeholder="Notes, allergies..." />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={busy}
              className="flex-1 active:opacity-70 disabled:opacity-40"
              style={{
                padding: '0.625rem',
                borderRadius: 12,
                fontSize: '0.875rem',
                fontWeight: 700,
                backgroundColor: '#432F2E',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Satoshi',
              }}
            >
              {busy ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: '0.625rem 1rem',
                borderRadius: 12,
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: 'rgba(67,47,46,0.06)',
                color: '#8A7060',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Satoshi',
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
