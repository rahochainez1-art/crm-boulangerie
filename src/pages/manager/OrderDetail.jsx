import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { updateOrder, STATUS_LABELS } from '../../lib/orders'
import AppLayout from '../../components/layout/AppLayout'
import StatusBadge from '../../components/ui/StatusBadge'

export default function OrderDetail({ order, onBack }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...order })
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const save = async () => {
    setLoading(true)
    try {
      await updateOrder(order.id, {
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        articles: form.articles,
        pickupDate: `${form.pickupDate.slice(0, 10)}T${form.pickupTime || '10:00'}:00`,
        deposit: Number(form.deposit) || 0,
        totalAmount: Number(form.totalAmount) || 0,
        notes: form.notes,
        assignedTo: form.assignedTo,
        status: form.status,
      })
      toast.success('Commande mise à jour')
      setEditing(false)
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const pickupDate = parseISO(order.pickupDate)
  const pickupDateOnly = format(pickupDate, 'yyyy-MM-dd')
  const pickupTimeOnly = format(pickupDate, 'HH:mm')

  return (
    <AppLayout title={editing ? 'Modifier' : order.clientName}>
      <div className="space-y-3">
        {/* Back */}
        <button onClick={onBack} className="btn-secondary">
          ← Retour
        </button>

        {!editing ? (
          <>
            {/* Infos */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={order.status} />
                <span className="text-sm text-eerie/50">
                  {format(pickupDate, 'dd MMMM à HH:mm', { locale: fr })}
                </span>
              </div>
              <div>
                <p className="text-xs text-eerie/40 mb-0.5">Articles</p>
                <p className="font-medium">{order.articles}</p>
              </div>
              {order.clientPhone && (
                <div>
                  <p className="text-xs text-eerie/40 mb-0.5">Téléphone</p>
                  <a href={`tel:${order.clientPhone}`} className="font-medium underline">
                    {order.clientPhone}
                  </a>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-eerie/40 mb-0.5">Acompte</p>
                  <p className="font-semibold">{order.deposit ?? 0} €</p>
                </div>
                <div>
                  <p className="text-xs text-eerie/40 mb-0.5">Total</p>
                  <p className="font-semibold">{order.totalAmount ?? 0} €</p>
                </div>
              </div>
              {order.notes && (
                <div>
                  <p className="text-xs text-eerie/40 mb-0.5">Notes</p>
                  <p className="text-sm bg-vanilla/40 rounded-xl px-3 py-2">{order.notes}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-eerie/40 mb-0.5">Assigné à</p>
                <p className="text-sm">{{
                  patissiere: '🍰 Pâtisserie',
                  boulangerie: '🥖 Boulangerie',
                  vendeur: '🛍️ Vendeur·se',
                }[order.assignedTo] ?? order.assignedTo}</p>
              </div>
            </div>

            <button onClick={() => setEditing(true)} className="btn-primary">
              Modifier cette commande
            </button>
          </>
        ) : (
          <>
            <div className="card space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-eerie/40">Client</p>
              <input value={form.clientName} onChange={set('clientName')} className="field" placeholder="Nom" />
              <input value={form.clientPhone} onChange={set('clientPhone')} className="field" placeholder="Téléphone" />
            </div>

            <div className="card space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-eerie/40">Retrait</p>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={pickupDateOnly} onChange={set('pickupDate')} className="field" />
                <input type="time" defaultValue={pickupTimeOnly} onChange={set('pickupTime')} className="field" />
              </div>
            </div>

            <div className="card space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-eerie/40">Articles</p>
              <textarea value={form.articles} onChange={set('articles')} rows={3} className="field resize-none" />
            </div>

            <div className="card space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-eerie/40">Statut</p>
              <select value={form.status} onChange={set('status')} className="field">
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="card space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-eerie/40 mb-1 block">Acompte (€)</label>
                  <input type="number" value={form.deposit} onChange={set('deposit')} className="field" />
                </div>
                <div>
                  <label className="text-xs text-eerie/40 mb-1 block">Total (€)</label>
                  <input type="number" value={form.totalAmount} onChange={set('totalAmount')} className="field" />
                </div>
              </div>
              <textarea value={form.notes} onChange={set('notes')} rows={3} className="field resize-none" placeholder="Notes..." />
              <div>
                <label className="text-xs text-eerie/40 mb-1 block">Assignée à</label>
                <select value={form.assignedTo} onChange={set('assignedTo')} className="field">
                  <option value="patissiere">🍰 Pâtisserie</option>
                  <option value="boulangerie">🥖 Boulangerie</option>
                  <option value="vendeur">🛍️ Vendeur·se</option>
                </select>
              </div>
            </div>

            <button onClick={save} disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary">
              Annuler
            </button>
          </>
        )}
      </div>
    </AppLayout>
  )
}
