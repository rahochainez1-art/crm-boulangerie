import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { createOrder } from '../../lib/orders'

const RACCOURCIS = [
  'Fraisier 4 pers',
  'Fraisier 8 pers',
  'Casse-noisette 4 pers',
  'Casse-noisette 8 pers',
  'Flan',
  'Tartelette moka 4 pers',
  'Tartelette moka 6 pers',
  'Baguettes norvégiennes',
]

const makeEmptyForm = () => ({
  clientName: '', clientPhone: '',
  pickupDate: format(new Date(), 'yyyy-MM-dd'),
  pickupTime: '10:00',
  articles: '', deposit: '', totalAmount: '',
  notes: '', assignedTo: ['patissiere'],
})

const POLE_LABELS = {
  patissiere:  '🍰 Pâtisserie',
  boulangerie: '🥖 Boulangerie',
}

export default function NouvelleCommande() {
  const navigate  = useNavigate()
  const [form, setForm]       = useState(makeEmptyForm)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(null) // données de la commande créée

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))
  const prefillArticle = (a) => setForm((p) => ({ ...p, articles: a }))
  const togglePole = (pole) => setForm(p => {
    const cur = Array.isArray(p.assignedTo) ? p.assignedTo : [p.assignedTo]
    if (cur.includes(pole)) {
      if (cur.length === 1) return p  // au moins un pôle requis
      return { ...p, assignedTo: cur.filter(x => x !== pole) }
    }
    return { ...p, assignedTo: [...cur, pole] }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.clientName || !form.articles) { toast.error('Nom client et articles requis.'); return }
    setLoading(true)
    try {
      const orderData = {
        ...form,
        pickupDate:  `${form.pickupDate}T${form.pickupTime}:00`,
        deposit:     Number(form.deposit) || 0,
        totalAmount: Number(form.totalAmount) || 0,
      }
      await createOrder(orderData)
      setConfirmed(orderData)
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement.')
      console.error(err)
    } finally { setLoading(false) }
  }

  // ── Vue confirmation ──────────────────────────────────────────────
  if (confirmed) {
    const pickup  = parseISO(confirmed.pickupDate)
    const reste   = confirmed.totalAmount - confirmed.deposit
    const polesLabel = (Array.isArray(confirmed.assignedTo) ? confirmed.assignedTo : [confirmed.assignedTo])
      .map(p => POLE_LABELS[p] ?? p).join(' + ')

    return (
      <div className="min-h-dvh bg-cream flex flex-col max-w-lg mx-auto">
        <header
          className="bg-cream px-5 pb-4 border-b border-warm"
          style={{ paddingTop: 'max(48px, env(safe-area-inset-top))' }}
        >
          <p className="label-xs">Au Grand Jour</p>
          <h1 className="text-2xl font-bold text-ink mt-1">Commande enregistrée</h1>
        </header>

        <main className="flex-1 px-4 py-5 pb-28 overflow-y-auto space-y-3">

          {/* Indicateur succès */}
          <div className="bg-lime/40 border border-lime rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-2xl font-bold text-ink">✓</span>
            <div>
              <p className="font-bold text-ink">Commande bien enregistrée</p>
              <p className="text-sm text-dust">Transmise à {polesLabel}</p>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="bg-chalk border border-warm rounded-2xl divide-y divide-warm">

            <div className="px-4 py-3.5">
              <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1">Client</p>
              <p className="font-semibold text-ink text-lg">{confirmed.clientName}</p>
              {confirmed.clientPhone && (
                <a href={`tel:${confirmed.clientPhone}`} className="text-sm text-dust underline mt-0.5 block">
                  {confirmed.clientPhone}
                </a>
              )}
            </div>

            <div className="px-4 py-3.5">
              <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1">Retrait</p>
              <p className="font-semibold text-ink capitalize">
                {format(pickup, 'EEEE d MMMM', { locale: fr })}
              </p>
              <p className="text-2xl font-bold text-ink tabular-nums tracking-tight leading-snug mt-0.5">
                {format(pickup, 'HH:mm')}
              </p>
            </div>

            <div className="px-4 py-3.5">
              <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1">Commande</p>
              <p className="font-semibold text-ink leading-snug">{confirmed.articles}</p>
            </div>

            {(confirmed.totalAmount > 0 || confirmed.deposit > 0) && (
              <div className="px-4 py-3.5">
                <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-2">Paiement</p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-dust">Total</p>
                    <p className="font-bold text-ink">{confirmed.totalAmount} €</p>
                  </div>
                  <div>
                    <p className="text-xs text-dust">Acompte reçu</p>
                    <p className="font-bold text-ink">{confirmed.deposit} €</p>
                  </div>
                  {reste > 0 && (
                    <div>
                      <p className="text-xs text-dust">Reste à encaisser</p>
                      <p className="font-bold text-amber-700">{reste} €</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {confirmed.notes && (
              <div className="px-4 py-3.5">
                <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1">Notes</p>
                <p className="text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2">{confirmed.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <button
            onClick={() => { setForm(makeEmptyForm()); setConfirmed(null) }}
            className="btn-primary"
          >
            + Nouvelle commande
          </button>
          <button
            onClick={() => navigate('/vendeur')}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-dust bg-chalk border border-warm active:opacity-70"
          >
            Retour à l'accueil
          </button>

        </main>
  
      </div>
    )
  }

  // ── Formulaire ────────────────────────────────────────────────────
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
            <div className="flex flex-wrap gap-1.5">
              {RACCOURCIS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => prefillArticle(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    form.articles === r
                      ? 'bg-ink text-chalk border-ink'
                      : 'bg-parchment text-dust border-warm active:bg-ink active:text-chalk active:border-ink'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea placeholder="Ou décris la commande manuellement…"
              value={form.articles} onChange={set('articles')} rows={3} className="field resize-none" required />
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
              <p className="text-xs text-dust mb-2">Envoyer à</p>
              <div className="flex gap-2">
                {Object.entries(POLE_LABELS).map(([id, label]) => {
                  const checked = (Array.isArray(form.assignedTo) ? form.assignedTo : [form.assignedTo]).includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => togglePole(id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-colors ${
                        checked
                          ? 'bg-ink text-chalk border-ink'
                          : 'bg-parchment text-dust border-warm active:bg-ink active:text-chalk active:border-ink'
                      }`}
                    >
                      {label}
                      {checked && <span className="text-xs opacity-70">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
            <textarea placeholder="Allergies, inscriptions, instructions spéciales..."
              value={form.notes} onChange={set('notes')} rows={3} className="field resize-none" />
          </Section>

          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-40">
            {loading ? 'Enregistrement...' : 'Enregistrer la commande'}
          </button>
        </form>
      </main>


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
