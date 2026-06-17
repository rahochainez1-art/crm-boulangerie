import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay,
  startOfWeek, endOfWeek, eachDayOfInterval, addWeeks,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeOrders, setStatus } from '../../lib/orders'
import { getPrenom } from '../../lib/settings'

const BLAGUES = [
  "🥐 Le croissant n'est pas français à l'origine ! Il vient de Vienne (Autriche). Marie-Antoinette l'aurait popularisé en France au XVIIIᵉ siècle. La forme en lune croissante rappelait le drapeau ottoman après la victoire de Vienne en 1683.",
  "🧩 Je suis fabriqué avec de la farine, de l'eau et du sel. Je suis long, doré, croustillant. On me retrouve sous le bras de presque tous les Français. Qui suis-je ? (La baguette !)",
  "🌍 La France est le pays qui consomme le plus de pain par habitant en Europe. Un Français mange en moyenne 130 g de pain par jour, soit une demi-baguette. 🥖",
  "🥐 Un vrai croissant au beurre contient entre 25 et 30 % de beurre dans sa pâte. C'est ce qui lui donne ses couches feuilletées et son goût incomparable.",
  "🧩 Je me compose de mille couches (enfin, 729 en théorie !), je suis crème et feuilleté. Mon nom signifie littéralement ce que je suis. Qui suis-je ? (Le mille-feuille !)",
  "🌍 Le chocolat chaud a été inventé par les Mayas il y a plus de 3 000 ans. Ils le buvaient froid et épicé, sans sucre. ☕",
  "🥐 Le Paris-Brest a été créé en 1910 par le pâtissier Louis Durand pour célébrer la course cycliste Paris-Brest-Paris. Sa forme ronde imite une roue de vélo. 🚴",
  "🧩 Plus je sèche, plus je suis dure. Je commence tendre et dorée, mais je vieillis vite. La soupe m'aime encore quand personne d'autre ne veut de moi. Qui suis-je ? (La baguette rassis !)",
  "🌍 La tour Eiffel mesure 6 cm de plus en été qu'en hiver. La chaleur dilate le métal. 🗼",
  "🥐 Le macaron parisien (deux coques avec une ganache) a été inventé par la maison Ladurée au début du XXᵉ siècle. 🫐",
  "🧩 Je suis ronde, je parfume toute la boulangerie, je suis feuilletée et je viens de Bretagne. Qui suis-je ? (Le kouign-amann !)",
  "🌍 Le mot 'boulanger' vient du flamand 'boulenc', qui désignait celui qui faisait des pains ronds. 🍞",
  "🥐 La pâte à choux gonfle uniquement grâce à la vapeur d'eau emprisonnée lors de la cuisson. Le four ne doit jamais être ouvert pendant la cuisson ! 💨",
  "🧩 Je suis léger comme l'air, je fonds en bouche, et mon nom évoque la vitesse. On me garnit de crème et on me recouvre de fondant. Qui suis-je ? (L'éclair !)",
  "🌍 Les abeilles visitent environ 2 millions de fleurs pour produire 500 g de miel. 🐝",
  "🥐 Saint Honoré est le patron des boulangers et pâtissiers. Sa fête est le 16 mai. 🙏",
  "🧩 On me pétrit, on me laisse reposer, on me façonne, on me cuit. Je suis l'âme de la boulangerie. Qui suis-je ? (La pâte !)",
  "🌍 La France compte environ 33 000 boulangeries artisanales. Chaque jour, les Français achètent environ 6 millions de baguettes. 🇫🇷",
  "🥐 La brioche doit son nom au verbe 'brier', qui signifie pétrir en normand. Elle contient jusqu'autant de beurre que de farine dans les recettes riches. 🧈",
  "🧩 Je suis petit, doré, rectangulaire. Les financiers de la Bourse de Paris me mangeaient sans se salir les mains. Qui suis-je ? (Le financier !)",
  "🌍 Le Groenland est la plus grande île du monde (non continentale). Sa superficie est 5 fois celle de la France. 🗺️",
  "🥐 La loi française encadre strictement la baguette de tradition : sans additif, uniquement farine, eau, sel et levure. 🏆",
  "🧩 Plus on me chauffe, plus je deviens solide. Je suis la preuve que la cuisine peut défier la logique. Qui suis-je ? (L'œuf en cuisson !)",
  "🌍 Une banane n'est pas un fruit au sens botanique — c'est une baie ! Et les fraises sont des 'faux-fruits'. 🍓",
  "🥐 Le feuilletage d'un croissant classique compte 27 couches, obtenues par 3 tours doubles. C'est le 'tourage'. 🧈",
  "🧩 Je suis composée de 3 boules de tailles différentes, je suis beurrée et moelleuse. Qui suis-je ? (La brioche à tête !)",
  "🌍 Le mot 'salaire' vient du latin 'salarium', car les soldats romains étaient parfois payés en sel. 🧂",
  "🥐 L'Opéra est un gâteau parisien inventé par la maison Dalloyau. Ses couches : génoise café, crème au beurre café, ganache chocolat. 🎭",
  "🧩 Je suis blanc, je viens de la mer, sans moi le pain est fade, trop de moi et il ne lève pas. Qui suis-je ? (Le sel !)",
  "🌍 Le cacao est originaire d'Amérique centrale. Les fèves servaient de monnaie chez les Aztèques. 🍫",
  "🥐 Le levain est vivant ! Certaines boulangeries entretiennent le même levain depuis des décennies. Il peut se transmettre comme un héritage. 🌱",
]

const TABS = [
  { id: 'all',   label: 'Toutes' },
  { id: 'ready', label: 'Prêtes' },
]

const STATUS_META = {
  todo:       { label: 'À faire',   topColor: '#E8E4C4', bg: '#E8E4C4', color: 'rgba(35,39,38,0.65)' },
  inprogress: { label: 'En cours',  topColor: '#FEE18B', bg: '#FEF3C7', color: '#92400e' },
  ready:      { label: 'Prête ✓',   topColor: '#86EFAC', bg: '#C5E6D3', color: '#166534' },
  done:       { label: 'Récupérée', topColor: '#D4D4D8', bg: '#F4F4F5', color: 'rgba(35,39,38,0.35)' },
}

function greeting(prenom) {
  const h = new Date().getHours()
  const name = prenom ? ` ${prenom}` : ''
  if (h < 10) return `Bonne journée${name} 🌅`
  if (h < 14) return `Coucou${name} 👋`
  return `On tient bon${name} ! 💪`
}

export default function VendeurDashboard() {
  const [allOrders, setAllOrders] = useState([])
  const [tab, setTab]             = useState('all')
  const [selected, setSelected]   = useState(null)
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [weekOffset, setWeekOffset]   = useState(0)
  const [prevReady, setPrevReady] = useState(new Set())
  const prenom = getPrenom()

  useEffect(() => {
    return subscribeOrders((newOrders) => {
      const todayOrders = newOrders.filter(o => {
        try { return isSameDay(parseISO(o.pickupDate), new Date()) } catch { return false }
      })
      const newReady = new Set(todayOrders.filter(o => o.status === 'ready').map(o => o.id))
      newReady.forEach(id => {
        if (!prevReady.has(id)) {
          const order = newOrders.find(o => o.id === id)
          toast.success(`Prête — ${order?.clientName}`, { duration: 6000 })
        }
      })
      setPrevReady(newReady)
      setAllOrders(newOrders)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selected) return
    const updated = allOrders.find(o => o.id === selected.id)
    if (updated) setSelected(updated)
  }, [allOrders]) // eslint-disable-line react-hooks/exhaustive-deps

  const weekDays = useMemo(() => {
    const base = addWeeks(new Date(), weekOffset)
    return eachDayOfInterval({
      start: startOfWeek(base, { weekStartsOn: 1 }),
      end:   endOfWeek(base,   { weekStartsOn: 1 }),
    })
  }, [weekOffset])

  const dayOrders = useMemo(() =>
    allOrders.filter(o => {
      try { return isSameDay(parseISO(o.pickupDate), selectedDay) } catch { return false }
    }),
    [allOrders, selectedDay]
  )

  const ready = dayOrders.filter(o => o.status === 'ready').length

  const filtered = (
    tab === 'ready' ? dayOrders.filter(o => o.status === 'ready') : dayOrders
  ).slice().sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1
    if (a.status !== 'done' && b.status === 'done') return -1
    return 0
  })

  const blague = BLAGUES[(new Date().getDate() - 1) % BLAGUES.length]

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#F5EEB5' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        className="px-5 pb-4"
        style={{ paddingTop: 'max(48px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="label-xs mb-2">Au Grand Jour</p>
            <h1 className="font-serif text-ink leading-none" style={{ fontSize: '2.1rem' }}>
              {greeting(prenom)}
            </h1>
            <p className="text-sm mt-1.5 capitalize" style={{ color: '#6E6B4E' }}>
              {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1"
            style={{ backgroundColor: 'rgba(35,39,38,0.08)' }}
          >
            <span className="text-base font-bold text-ink">
              {prenom ? prenom[0].toUpperCase() : 'V'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-28">

        {/* ── Calendrier semaine ─────────────────────────────────────── */}
        <div className="px-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                const prev = addWeeks(new Date(), weekOffset - 1)
                setWeekOffset(o => o - 1)
                setSelectedDay(startOfWeek(prev, { weekStartsOn: 1 }))
              }}
              className="text-sm font-semibold active:opacity-50 transition-opacity"
              style={{ color: '#6E6B4E' }}
            >
              ← Préc
            </button>
            <p className="font-semibold text-ink capitalize" style={{ fontSize: '0.9rem' }}>
              {format(weekDays[3], 'MMMM yyyy', { locale: fr })}
            </p>
            <button
              onClick={() => {
                const next = addWeeks(new Date(), weekOffset + 1)
                setWeekOffset(o => o + 1)
                setSelectedDay(startOfWeek(next, { weekStartsOn: 1 }))
              }}
              className="text-sm font-semibold active:opacity-50 transition-opacity"
              style={{ color: '#6E6B4E' }}
            >
              Suiv →
            </button>
          </div>

          <div className="flex gap-1.5">
            {weekDays.map(day => {
              const isSelected = isSameDay(day, selectedDay)
              const isToday    = isSameDay(day, new Date())
              const hasOrders  = allOrders.some(o => {
                try { return isSameDay(parseISO(o.pickupDate), day) } catch { return false }
              })
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className="flex-1 flex flex-col items-center py-3 rounded-2xl transition-all active:scale-95"
                  style={{
                    backgroundColor: isSelected
                      ? '#232726'
                      : isToday
                      ? 'rgba(255,255,255,0.85)'
                      : 'rgba(255,255,255,0.45)',
                    border: isSelected ? 'none' : '1px solid rgba(221,217,176,0.6)',
                  }}
                >
                  <span
                    className="font-bold leading-none"
                    style={{ fontSize: '1.15rem', color: isSelected ? '#fff' : '#232726' }}
                  >
                    {format(day, 'd')}
                  </span>
                  <span
                    className="capitalize mt-1"
                    style={{ fontSize: 10, fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.55)' : '#6E6B4E' }}
                  >
                    {format(day, 'EEE', { locale: fr })}
                  </span>
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5"
                    style={{
                      backgroundColor: hasOrders
                        ? isSelected ? 'rgba(255,255,255,0.45)' : '#EBDF28'
                        : 'transparent',
                    }}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Bonne humeur du jour ───────────────────────────────────── */}
        <div className="px-4 mb-4">
          <div
            className="rounded-3xl p-4"
            style={{
              backgroundColor: '#FEFDF5',
              border: '1px solid rgba(221,217,176,0.5)',
              boxShadow: '0 2px 12px rgba(35,39,38,0.05)',
            }}
          >
            <p className="label-xs mb-2">Du jour ✨</p>
            <p className="text-sm leading-relaxed" style={{ color: '#6E6B4E' }}>{blague}</p>
          </div>
        </div>

        {/* ── Statut commandes prêtes ────────────────────────────────── */}
        <div className="px-4 mb-4">
          {ready === 0 ? (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(221,217,176,0.5)',
              }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#22C55E' }} />
              <p className="text-sm font-medium" style={{ color: '#6E6B4E' }}>Tout est à jour</p>
            </div>
          ) : (
            <div
              className="rounded-2xl px-4 py-4 text-center animate-pulse"
              style={{ backgroundColor: '#FEF3C7', border: '2px solid #FDE68A' }}
            >
              <p className="font-serif text-5xl font-bold text-amber-700 leading-none">{ready}</p>
              <p className="text-sm font-semibold text-amber-800 mt-1">
                commande{ready > 1 ? 's' : ''} prête{ready > 1 ? 's' : ''} à remettre
              </p>
            </div>
          )}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div className="flex gap-2 px-4 mb-4">
          {TABS.map(t => {
            const count = t.id === 'all' ? dayOrders.length : ready
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{
                  borderRadius: 9999,
                  backgroundColor: tab === t.id ? '#232726' : 'rgba(255,255,255,0.6)',
                  color: tab === t.id ? '#FEFDF5' : '#6E6B4E',
                  border: tab === t.id ? 'none' : '1px solid rgba(221,217,176,0.7)',
                }}
              >
                {t.label}{count > 0 && ` ${count}`}
              </button>
            )
          })}
        </div>

        {/* ── Titre section ─────────────────────────────────────────── */}
        <div className="flex items-baseline justify-between px-4 mb-3">
          <p className="font-semibold text-ink">
            {isSameDay(selectedDay, new Date())
              ? "Aujourd'hui"
              : format(selectedDay, 'EEEE d MMMM', { locale: fr })}
          </p>
          <p className="text-xs" style={{ color: '#6E6B4E' }}>
            {dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Liste commandes ───────────────────────────────────────── */}
        <main className="px-4">
          {filtered.length === 0 ? (
            <div
              className="rounded-3xl text-center py-14"
              style={{
                backgroundColor: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(221,217,176,0.5)',
              }}
            >
              <p className="text-sm" style={{ color: '#6E6B4E' }}>
                {dayOrders.length === 0 ? 'Aucune commande ce jour-là' : 'Aucune commande ici'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(order => (
                <OrderCard key={order.id} order={order} onOpen={() => setSelected(order)} />
              ))}
            </div>
          )}
        </main>

      </div>

      {selected && <OrderSheet order={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

/* ── Carte commande ───────────────────────────────────────────────────── */
function OrderCard({ order, onOpen }) {
  const reste = (order.totalAmount || 0) - (order.deposit || 0)
  const meta  = STATUS_META[order.status] ?? STATUS_META.todo

  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-3xl overflow-hidden transition-all active:scale-[0.98] active:opacity-75"
      style={{
        backgroundColor: '#FEFDF5',
        border: '1px solid rgba(221,217,176,0.65)',
        boxShadow: '0 2px 16px rgba(35,39,38,0.06)',
        opacity: order.status === 'done' ? 0.45 : 1,
      }}
    >
      {/* Barre couleur statut en haut */}
      <div className="h-1" style={{ backgroundColor: meta.topColor, borderRadius: '1.5rem 1.5rem 0 0' }} />

      <div className="px-4 pt-3.5 pb-4">
        {/* Heure + badge statut */}
        <div className="flex items-center justify-between mb-2.5">
          <span
            className="font-bold tabular-nums tracking-tight leading-none"
            style={{
              fontSize: '2rem',
              color: order.status === 'done' ? '#A1A1AA' : '#232726',
            }}
          >
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </span>
          <span
            className="text-[11px] font-semibold px-3 py-1 flex-shrink-0"
            style={{ backgroundColor: meta.bg, color: meta.color, borderRadius: 9999 }}
          >
            {meta.label}
          </span>
        </div>

        {/* Nom client */}
        <p
          className="font-semibold leading-tight truncate"
          style={{
            fontSize: '1rem',
            color: order.status === 'done' ? '#A1A1AA' : '#232726',
          }}
        >
          {order.clientName}
        </p>

        {/* Articles */}
        <p className="text-sm truncate mt-0.5" style={{ color: '#6E6B4E' }}>
          {order.articles}
        </p>

        {/* Badge paiement */}
        {order.status !== 'done' && reste > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#F59E0B' }} />
            <span className="text-xs font-semibold" style={{ color: '#92400e' }}>
              {reste} € à encaisser
            </span>
          </div>
        )}
        {order.status !== 'done' && reste === 0 && order.totalAmount > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#22C55E' }} />
            <span className="text-xs font-semibold" style={{ color: '#166534' }}>Déjà soldé ✓</span>
          </div>
        )}
        {order.status === 'done' && order.totalAmount > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#22C55E' }} />
            <span className="text-xs font-semibold" style={{ color: '#166534' }}>Soldé ✓</span>
          </div>
        )}
      </div>
    </button>
  )
}

/* ── Bottom sheet détail ─────────────────────────────────────────────── */
function OrderSheet({ order, onClose }) {
  const pickup = parseISO(order.pickupDate)
  const reste  = (order.totalAmount || 0) - (order.deposit || 0)
  const meta   = STATUS_META[order.status] ?? STATUS_META.todo

  const handleStatus = async (newStatus) => {
    await setStatus(order.id, newStatus)
    if (newStatus === 'done')  toast.success(`${order.clientName} — commande récupérée`)
    if (newStatus === 'ready') toast('Statut annulé')
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50 rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: '#FEFDF5', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#DDD9B0' }} />
        </div>

        <div className="px-5 pt-2 pb-5" style={{ borderBottom: '1px solid #EEE9C8' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="label-xs mb-1">Retrait</p>
              <p
                className="font-bold tabular-nums tracking-tight leading-none"
                style={{ fontSize: '2.5rem', color: '#232726' }}
              >
                {format(pickup, 'HH:mm')}
              </p>
              <p className="text-sm capitalize mt-1" style={{ color: '#6E6B4E' }}>
                {format(pickup, 'EEEE d MMMM', { locale: fr })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <span
                className="text-xs font-semibold px-3 py-1.5"
                style={{ backgroundColor: meta.bg, color: meta.color, borderRadius: 9999 }}
              >
                {meta.label}
              </span>
              <button
                onClick={onClose}
                className="text-xs font-semibold px-3 py-1.5 rounded-full active:opacity-70"
                style={{ backgroundColor: '#E8E4C4', color: '#6E6B4E' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          <div>
            <p className="label-xs mb-1">Client</p>
            <p className="font-semibold text-ink" style={{ fontSize: '1.125rem' }}>{order.clientName}</p>
            {order.clientPhone && (
              <a
                href={`tel:${order.clientPhone}`}
                className="text-sm underline mt-0.5 block active:opacity-70"
                style={{ color: '#6E6B4E' }}
              >
                {order.clientPhone}
              </a>
            )}
          </div>

          <div className="rounded-2xl px-4 py-3.5" style={{ backgroundColor: '#E8E4C4' }}>
            <p className="label-xs mb-1.5">Commande</p>
            <p className="font-semibold text-ink leading-snug">{order.articles}</p>
          </div>

          {order.totalAmount > 0 && (
            <div className="rounded-2xl px-4 py-3.5" style={{ backgroundColor: '#FEFDF5', border: '1px solid #EEE9C8' }}>
              <p className="label-xs mb-3">Paiement</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs mb-1" style={{ color: '#6E6B4E' }}>Total</p>
                  <p className="font-bold text-ink">{order.totalAmount} €</p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#6E6B4E' }}>Acompte</p>
                  <p className="font-bold text-ink">{order.deposit || 0} €</p>
                </div>
                {reste > 0 ? (
                  <div>
                    <p className="text-xs mb-1" style={{ color: '#6E6B4E' }}>Reste</p>
                    <p className="font-bold" style={{ color: '#92400e' }}>{reste} €</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs mb-1" style={{ color: '#6E6B4E' }}>Solde</p>
                    <p className="font-bold" style={{ color: '#166534' }}>Soldé ✓</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {order.notes && (
            <div
              className="rounded-2xl px-4 py-3 flex gap-2.5"
              style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
            >
              <span className="flex-shrink-0">⚠</span>
              <p className="text-sm leading-relaxed" style={{ color: '#92400e' }}>{order.notes}</p>
            </div>
          )}

          {(order.status === 'ready' || order.status === 'done') && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleStatus('ready')}
                className="flex-1 py-3.5 text-sm font-semibold rounded-2xl transition-all active:scale-95"
                style={{
                  backgroundColor: order.status !== 'done' ? '#E8E4C4' : '#F5F5F5',
                  color: order.status !== 'done' ? '#232726' : '#A1A1AA',
                }}
              >
                Pas encore
              </button>
              <button
                onClick={() => handleStatus('done')}
                className="flex-1 py-3.5 text-sm font-semibold rounded-2xl transition-all active:scale-95"
                style={{
                  backgroundColor: order.status === 'done' ? '#C5E6D3' : '#F5F5F5',
                  color: order.status === 'done' ? '#166534' : '#A1A1AA',
                }}
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
