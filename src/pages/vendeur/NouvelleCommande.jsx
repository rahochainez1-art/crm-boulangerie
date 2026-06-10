import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { createOrder } from '../../lib/orders'
import { useRole } from '../../context/RoleContext'
import BottomNav from '../../components/layout/BottomNav'

const ARTICLES_SUGGERES = [
  'Gâteau d\'anniversaire', 'Bûche', 'Tarte framboise', 'Éclair',
  'Mille-feuille', 'Paris-Brest', 'Forêt noire', 'Chou craquelin',
]

const makeEmptyForm = () => ({
  clientName: '', clientPhone: '',
  pickupDate: format(new Date(), 'yyyy-MM-dd'),
  pickupTime: '10:00',
  articles: '', deposit: '', totalAmount: '',
  notes: '', assignedTo: 'patissiere',
})

export default function NouvelleCommande() {
  const navigate = useNavigate()
  const { vendeurName } = useRole()
  const [form, setForm] = useState(makeEmptyForm)
  const [loading, setLoading] = useState(false)
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))
  const addArticle = (a) => setForm((p) => ({ ...p, articles: p.articles ? `${p.articles}, ${a}` : a }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.clientName || !form.articles) { toast.error('Nom client et articles requis.'); return }
    setLoading(true)
    try {
      await createOrder({
        ...form,
        pickupDate: `${form.pickupDate}T${form.pickupTime}:00`,
        deposit: Number(form.deposit) || 0,
        totalAmount: Number(form.totalAmount) || 0,
        createdBy: vendeurName || 'inconnu',
      })
      toast.success('Commande enregistrée !')
      navigate('/vendeur')
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement.')
      console.error(err)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-dvh bg-cream flex flex-col max-w-lg mx-auto">
      <header
        className="bg-cream px-5 pb-4 border-b border-warm"
        style={{ paddingTop: 'max(48px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between">
          <p className="label-xs">Au Grand Jour</p>
          <button onClick={() => navigate('/vendeur')} className="text-sm font-semibold text-dust min-h-[44px] px-2">
            ← Retour
          </button>
        </div>
        <h1 className="text-2xl font-bold text-ink mt-1">Nouvelle commande</h1>
        <p className="text-sm text-dust capitalize mt-0.5">
          {format(new Date(), 'EEEE d MMMM', { locale: fr })}
        </p>
      </header>

      <main className="flex-1 px-4 py-4 pb-28 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-3">

          <Section label="Client">
            <input placeholder="Nom du client *" autoFocus autoComplete="name"
              value={form.clientName} onChange={set('clientName')} className="field" required />
            <input type="tel" inputMode="tel" placeholder="Téléphone" autoComplete="tel"
              value={form.clientPhone} onChange={set('clientPhone')} className="field" />
          </Section>

          <Section label="Retrait">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-dust mb-1">Date *</p>
                <input type="date" min={format(new Date(), 'yyyy-MM-dd')} value={form.pickupDate} onChange={set('pickupDate')} className="field" required />
              </div>
              <div>
                <p className="text-xs text-dust mb-1">Heure</p>
                <input type="time" value={form.pickupTime} onChange={set('pickupTime')} className="field" />
              </div>
            </div>
          </Section>

          <Section label="Articles *">
            <textarea placeholder="Ex : 1 gâteau anniversaire 6 parts, 2 éclairs café..."
              value={form.articles} onChange={set('articles')} rows={3} className="field resize-none" required />
            <div className="flex flex-wrap gap-2">
              {ARTICLES_SUGGERES.map((a) => (
                <button key={a} type="button" onClick={() => addArticle(a)}
                  className="text-xs bg-parchment border border-warm rounded-full px-3 py-1.5 text-dust active:bg-ink active:text-chalk active:border-ink transition-colors">
                  + {a}
                </button>
              ))}
            </div>
          </Section>

          <Section label="Paiement">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-dust mb-1">Acompte (€)</p>
                <input type="number" inputMode="decimal" min="0" step="0.50" placeholder="0"
                  value={form.deposit} onChange={set('deposit')} className="field" />
              </div>
              <div>
                <p className="text-xs text-dust mb-1">Total (€)</p>
                <input type="number" inputMode="decimal" min="0" step="0.50" placeholder="0"
                  value={form.totalAmount} onChange={set('totalAmount')} className="field" />
              </div>
            </div>
          </Section>

          <Section label="Détails">
            <div>
              <p className="text-xs text-dust mb-1">Assignée à</p>
              <select value={form.assignedTo} onChange={set('assignedTo')} className="field">
                <option value="patissiere">🍰 Pâtisserie</option>
                <option value="boulangerie">🥖 Boulangerie</option>
                <option value="vendeur">🛍️ Vendeur·se</option>
              </select>
            </div>
            <textarea placeholder="Allergies, inscriptions, instructions spéciales..."
              value={form.notes} onChange={set('notes')} rows={3} className="field resize-none" />
          </Section>

          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-40">
            {loading ? 'Enregistrement...' : 'Enregistrer la commande'}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div className="bg-chalk border border-warm rounded-2xl p-4 space-y-3">
      <p className="label-xs">{label}</p>
      {children}
    </div>
  )
}
