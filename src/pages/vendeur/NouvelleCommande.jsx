import { useEffect, useRef, useState } from 'react'
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
  patissiere:  'Pâtisserie',
  boulangerie: 'Boulangerie',
}

export default function NouvelleCommande() {
  const navigate  = useNavigate()
  const [form, setForm]       = useState(makeEmptyForm)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(null)
  const mainRef = useRef(null)

  // Remonte en haut à chaque bascule formulaire <-> confirmation
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [confirmed])

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))
  const prefillArticle = (a) => setForm((p) => ({ ...p, articles: a }))
  const togglePole = (pole) => setForm(p => {
    const cur = Array.isArray(p.assignedTo) ? p.assignedTo : [p.assignedTo]
    if (cur.includes(pole)) {
      if (cur.length === 1) return p
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
      toast.error("Erreur lors de l'enregistrement.")
      console.error(err)
    } finally { setLoading(false) }
  }

  // ── Vue confirmation ──────────────────────────────────────────
  if (confirmed) {
    const pickup     = parseISO(confirmed.pickupDate)
    const reste      = confirmed.totalAmount - confirmed.deposit
    const polesLabel = (Array.isArray(confirmed.assignedTo) ? confirmed.assignedTo : [confirmed.assignedTo])
      .map(p => POLE_LABELS[p] ?? p).join(' + ')

    return (
      <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#F5F2EB' }}>
        <header
          className="px-5 pb-5"
          style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}
        >
          <p className="label-xs mb-3">Au Grand Jour</p>
          <h1 className="font-display" style={{ fontSize: '1.75rem', color: '#111111', letterSpacing: '-0.025em' }}>
            Commande enregistrée
          </h1>
        </header>

        <main ref={mainRef} className="flex-1 px-5 pb-28 overflow-y-auto space-y-3">

          {/* Succès */}
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
            style={{ backgroundColor: '#D1FAE5', border: '1px solid #A7F3D0' }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: '#10B981' }}
            >
              <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.875rem', fontFamily: 'Satoshi' }}>✓</span>
            </div>
            <div>
              <p style={{ fontWeight: 700, color: '#065F46', fontFamily: 'Satoshi' }}>Commande bien enregistrée</p>
              <p style={{ fontSize: '0.8125rem', color: '#10B981', fontFamily: 'Satoshi', marginTop: 2 }}>
                Transmise à {polesLabel}
              </p>
            </div>
          </div>

          {/* Récapitulatif */}
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.08)', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(67,47,46,0.06)' }}
          >
            <ConfirmRow label="Client">
              <p style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#111111', fontFamily: 'Satoshi' }}>
                {confirmed.clientName}
              </p>
              {confirmed.clientPhone && (
                <a href={`tel:${confirmed.clientPhone}`} style={{ fontSize: '0.875rem', color: '#8A7060', textDecoration: 'underline', fontFamily: 'Satoshi', display: 'block', marginTop: 2 }}>
                  {confirmed.clientPhone}
                </a>
              )}
            </ConfirmRow>

            <ConfirmRow label="Retrait">
              <p style={{ fontWeight: 600, color: '#111111', fontFamily: 'Satoshi', textTransform: 'capitalize', fontSize: '0.875rem' }}>
                {format(pickup, 'EEEE d MMMM', { locale: fr })}
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.03em', lineHeight: 1, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                {format(pickup, 'HH:mm')}
              </p>
            </ConfirmRow>

            <ConfirmRow label="Commande">
              <p style={{ fontWeight: 600, color: '#111111', fontFamily: 'Satoshi', lineHeight: 1.5 }}>
                {confirmed.articles}
              </p>
            </ConfirmRow>

            {(confirmed.totalAmount > 0 || confirmed.deposit > 0) && (
              <ConfirmRow label="Paiement">
                <div className="flex gap-6">
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Total</p>
                    <p style={{ fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', marginTop: 2 }}>{confirmed.totalAmount} €</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Acompte reçu</p>
                    <p style={{ fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', marginTop: 2 }}>{confirmed.deposit} €</p>
                  </div>
                  {reste > 0 && (
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Reste à encaisser</p>
                      <p style={{ fontWeight: 700, color: '#92400E', fontFamily: 'Satoshi', marginTop: 2 }}>{reste} €</p>
                    </div>
                  )}
                </div>
              </ConfirmRow>
            )}

            {confirmed.notes && (
              <ConfirmRow label="Notes">
                <p style={{ fontSize: '0.875rem', color: '#92400E', backgroundColor: '#FFFBEB', borderRadius: 10, padding: '0.5rem 0.75rem', fontFamily: 'Satoshi' }}>
                  {confirmed.notes}
                </p>
              </ConfirmRow>
            )}
          </div>

          <button
            onClick={() => { setForm(makeEmptyForm()); setConfirmed(null) }}
            className="btn-primary"
          >
            + Nouvelle commande
          </button>
          <button
            onClick={() => navigate('/vendeur')}
            className="btn-secondary"
          >
            Retour à l'accueil
          </button>

        </main>
      </div>
    )
  }

  // ── Formulaire ────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#F5F2EB' }}>

      <header
        className="px-5 pb-4"
        style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="label-xs">Au Grand Jour</p>
          <button
            onClick={() => navigate('/vendeur')}
            style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi', minHeight: 44, padding: '0 8px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Retour
          </button>
        </div>
        <h1 className="font-display" style={{ fontSize: '1.75rem', color: '#111111', letterSpacing: '-0.025em' }}>
          Nouvelle commande
        </h1>
        <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 6, textTransform: 'capitalize' }}>
          {format(new Date(), 'EEEE d MMMM', { locale: fr })}
        </p>
      </header>

      <main ref={mainRef} className="flex-1 px-5 py-4 pb-28 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-3">

          <Section label="Client">
            <input
              placeholder="Nom du client *"
              autoFocus
              autoComplete="name"
              value={form.clientName}
              onChange={set('clientName')}
              className="field"
              required
            />
            <input
              type="tel"
              inputMode="tel"
              placeholder="Téléphone"
              autoComplete="tel"
              value={form.clientPhone}
              onChange={set('clientPhone')}
              className="field"
            />
          </Section>

          <Section label="Retrait">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p style={{ fontSize: '0.6875rem', color: '#8A7060', fontFamily: 'Satoshi', fontWeight: 600, marginBottom: 6 }}>Date *</p>
                <input
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={form.pickupDate}
                  onChange={set('pickupDate')}
                  className="field"
                  required
                />
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', color: '#8A7060', fontFamily: 'Satoshi', fontWeight: 600, marginBottom: 6 }}>Heure</p>
                <input type="time" value={form.pickupTime} onChange={set('pickupTime')} className="field" />
              </div>
            </div>
          </Section>

          <Section label="Articles *">
            <div className="flex flex-wrap gap-1.5">
              {RACCOURCIS.map((r) => {
                const selected = form.articles === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => prefillArticle(r)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: 9999,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      fontFamily: 'Satoshi',
                      backgroundColor: selected ? '#432F2E' : 'rgba(67,47,46,0.07)',
                      color: selected ? '#FFFFFF' : '#8A7060',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s',
                    }}
                  >
                    {r}
                  </button>
                )
              })}
            </div>
            <textarea
              placeholder="Ou décris la commande manuellement…"
              value={form.articles}
              onChange={set('articles')}
              rows={3}
              className="field resize-none"
              required
            />
          </Section>

          <Section label="Paiement">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p style={{ fontSize: '0.6875rem', color: '#8A7060', fontFamily: 'Satoshi', fontWeight: 600, marginBottom: 6 }}>Acompte (€)</p>
                <input type="number" inputMode="decimal" min="0" step="0.50" placeholder="0" value={form.deposit} onChange={set('deposit')} className="field" />
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', color: '#8A7060', fontFamily: 'Satoshi', fontWeight: 600, marginBottom: 6 }}>Total (€)</p>
                <input type="number" inputMode="decimal" min="0" step="0.50" placeholder="0" value={form.totalAmount} onChange={set('totalAmount')} className="field" />
              </div>
            </div>
          </Section>

          <Section label="Détails">
            <div>
              <p style={{ fontSize: '0.6875rem', color: '#8A7060', fontFamily: 'Satoshi', fontWeight: 600, marginBottom: 8 }}>
                Envoyer à
              </p>
              <div className="flex gap-2">
                {Object.entries(POLE_LABELS).map(([id, label]) => {
                  const checked = (Array.isArray(form.assignedTo) ? form.assignedTo : [form.assignedTo]).includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => togglePole(id)}
                      className="flex-1 flex items-center justify-center gap-2 transition-colors"
                      style={{
                        padding: '0.75rem',
                        borderRadius: 12,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        fontFamily: 'Satoshi',
                        backgroundColor: checked ? '#432F2E' : 'rgba(67,47,46,0.07)',
                        color: checked ? '#FFFFFF' : '#8A7060',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                      {checked && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
            <textarea
              placeholder="Allergies, inscriptions, instructions spéciales..."
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="field resize-none"
            />
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
    <div
      className="rounded-[20px] p-4 space-y-3"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(67,47,46,0.07)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <p className="label-xs">{label}</p>
      {children}
    </div>
  )
}

function ConfirmRow({ label, children }) {
  return (
    <div
      className="px-5 py-3.5"
      style={{ borderBottom: '1px solid rgba(67,47,46,0.07)' }}
    >
      <p className="label-xs mb-1.5">{label}</p>
      {children}
    </div>
  )
}
