import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay,
  startOfWeek, endOfWeek, addDays, differenceInHours,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeOrders, setStatus, seedFakeOrders, isAssignedTo } from '../../lib/orders'
import { getPrenom, getUrgencyHours } from '../../lib/settings'
import AppLayout from '../../components/layout/AppLayout'

const PRODUCTION_STATUSES = ['todo', 'inprogress', 'ready']
const STATUS_PICKER = {
  todo:       { label: 'Pas commencé', active: 'bg-ink text-chalk',          idle: 'bg-parchment text-dust border border-warm' },
  inprogress: { label: 'En cours',     active: 'bg-amber-500 text-white',    idle: 'bg-amber-50 text-amber-700 border border-amber-200' },
  ready:      { label: 'Prêt ✓',       active: 'bg-lime text-ink font-bold', idle: 'bg-green-50 text-green-700 border border-green-200' },
}

function urgencyBar(pickupDate) {
  const h = differenceInHours(parseISO(pickupDate), new Date())
  const t = getUrgencyHours()
  if (h < 0)      return 'bg-red-500'
  if (h < t)      return 'bg-red-400'
  if (h < t + 24) return 'bg-amber-400'
  return 'bg-sage'
}

/* ── Carte de résumé (identique manager, sans données financières) ───── */
function SummaryCard({ orders }) {
  const weekStart  = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd    = addDays(weekStart, 6)
  const weekOrders = orders.filter(o => {
    if (!o.pickupDate) return false
    const d = parseISO(o.pickupDate)
    return d >= weekStart && d <= weekEnd
  })
  const todoCount = orders.filter(o => o.status === 'todo' || o.status === 'inprogress').length

  const greeting = weekOrders.length === 0
    ? 'Aucune commande\ncette semaine.'
    : weekOrders.length <= 2
    ? 'Calme et maîtrisé —\nbonne semaine.'
    : todoCount > 3
    ? 'Beaucoup à faire,\nbonne organisation !'
    : 'Belle activité,\ntout est sous contrôle.'

  return (
    <>
      <div className="mb-5 px-1">
        <p className="text-sm text-dust mb-1">{getPrenom() ? `Bonjour ${getPrenom()} 👋` : 'Voici ton résumé 👋'}</p>
        <h2
          className="font-serif leading-tight"
          style={{ fontSize: '1.75rem', fontWeight: 600, color: '#1A1A1A', whiteSpace: 'pre-line' }}
        >
          {greeting}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div
          className="rounded-2xl p-4 flex flex-col justify-between bg-white"
          style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.07)', minHeight: 120 }}
        >
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-dust">Semaine</p>
          <div>
            <p className="font-serif leading-none mt-3" style={{ fontSize: '2.8rem', fontWeight: 600, color: '#1A1A1A' }}>
              {weekOrders.length}
            </p>
            <p className="text-xs text-dust mt-1.5">commande{weekOrders.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 flex flex-col justify-between"
          style={{
            backgroundColor: todoCount > 3 ? '#FEF2F2' : todoCount > 0 ? '#FBF0DC' : '#F2F6CC',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            minHeight: 120,
          }}
        >
          <p
            className="text-[10px] font-bold tracking-[0.14em] uppercase"
            style={{ color: todoCount > 3 ? '#dc2626' : '#6B6B6B' }}
          >
            {todoCount > 3 ? '⚠ Urgent' : 'Production'}
          </p>
          <div>
            <p
              className="font-serif leading-none mt-3"
              style={{ fontSize: '2.8rem', fontWeight: 600, color: todoCount > 3 ? '#dc2626' : '#1A1A1A' }}
            >
              {todoCount}
            </p>
            <p className="text-xs mt-1.5" style={{ color: todoCount > 3 ? '#dc2626' : '#6B6B6B' }}>
              à produire
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Dashboard pâtissière ────────────────────────────────────────────── */
export default function PatissiereDashboard() {
  const [orders, setOrders]     = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [seeding, setSeeding]   = useState(false)

  useEffect(() => subscribeOrders(setOrders), [])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const n = await seedFakeOrders()
      toast.success(`${n} commandes test injectées`)
    } catch (e) {
      toast.error('Erreur seed: ' + e.message)
    } finally { setSeeding(false) }
  }

  // Commandes patissière non récupérées, filtrées sur la semaine en cours
  const ws = startOfWeek(new Date(), { weekStartsOn: 1 })
  const we = addDays(ws, 6)

  const poleOrders = useMemo(
    () => orders.filter(o => o.status !== 'done' && isAssignedTo(o, 'patissiere')),
    [orders]
  )

  const weekOrders = useMemo(() =>
    poleOrders
      .filter(o => {
        if (!o.pickupDate) return false
        const d = parseISO(o.pickupDate)
        return d >= ws && d <= we
      })
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate)),
    [poleOrders]
  )

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)

  return (
    <AppLayout title="Production">

      <SummaryCard orders={poleOrders} />

      {/* En-tête section liste */}
      <div className="flex items-baseline justify-between mb-3">
        <p className="font-sans font-semibold text-ink" style={{ fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
          En cours cette semaine
        </p>
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-dust">
          {weekOrders.length} commande{weekOrders.length > 1 ? 's' : ''}
        </span>
      </div>

      {weekOrders.length === 0 ? (
        <div className="bg-chalk border border-warm rounded-2xl text-center py-12 px-6">
          <p className="text-2xl mb-3">✓</p>
          <p className="font-bold text-ink">Rien cette semaine</p>
          <p className="text-sm text-dust mt-1 mb-6">Toutes les commandes sont à jour</p>
          {orders.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="text-xs font-semibold text-dust border border-warm rounded-xl px-4 py-2.5 active:opacity-70 disabled:opacity-40"
            >
              {seeding ? 'Injection...' : '+ Charger données test'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {weekOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => toggleExpand(order.id)}
            />
          ))}
        </div>
      )}

      {orders.length > 0 && (
        <div className="mt-6 text-center">
          <button onClick={handleSeed} disabled={seeding} className="text-[11px] text-dust/40 active:opacity-70 disabled:opacity-30">
            {seeding ? 'Injection...' : '+ données test'}
          </button>
        </div>
      )}

    </AppLayout>
  )
}

/* ── Carte commande expandable avec sélecteur statut ────────────────── */
function OrderCard({ order, expanded, onToggle }) {
  const [busy, setBusy] = useState(false)

  const handleSetStatus = async (newStatus) => {
    if (newStatus === order.status || busy) return
    setBusy(true)
    try {
      await setStatus(order.id, newStatus)
      if (newStatus === 'ready') toast.success('✓ Prêt — vendeur notifié')
    } finally { setBusy(false) }
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className={`h-1.5 ${urgencyBar(order.pickupDate)}`} />

      {/* Ligne résumée */}
      <button
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-black/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm truncate">{order.clientName}</p>
          <p className="text-xs text-dust truncate mt-0.5">{order.articles}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-xs font-bold text-dust tabular-nums">
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </span>
          <StatusPill status={order.status} />
        </div>
        <span
          className="text-dust/40 flex-shrink-0 text-base ml-1 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >↓</span>
      </button>

      {/* Détail étendu */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: '1px solid rgba(232,226,216,0.6)' }}>

          <div className="bg-parchment rounded-xl px-3.5 py-3">
            <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1">Commande</p>
            <p className="font-semibold text-ink leading-snug">{order.articles}</p>
          </div>

          {/* Date de retrait */}
          <div className="px-1">
            <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-0.5">Retrait</p>
            <p className="text-sm font-semibold text-ink capitalize">
              {format(parseISO(order.pickupDate), "EEEE d MMMM 'à' HH:mm", { locale: fr })}
            </p>
          </div>

          {order.notes && (
            <div className="rounded-xl px-3.5 py-3 flex gap-2.5" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <span className="text-base flex-shrink-0">⚠️</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#92400E' }}>Attention</p>
                <p className="text-sm leading-relaxed" style={{ color: '#78350F' }}>{order.notes}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            {PRODUCTION_STATUSES.map(s => {
              const cfg      = STATUS_PICKER[s]
              const isActive = order.status === s
              return (
                <button
                  key={s}
                  onClick={() => handleSetStatus(s)}
                  disabled={busy}
                  className={`rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${isActive ? cfg.active : cfg.idle}`}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>

        </div>
      )}
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    todo:       { label: 'À faire',  cls: 'bg-parchment text-dust border border-warm' },
    inprogress: { label: 'En cours', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    ready:      { label: 'Prêt ✓',   cls: 'bg-green-50 text-green-700 border border-green-200' },
  }
  const cfg = map[status] ?? map.todo
  return (
    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
