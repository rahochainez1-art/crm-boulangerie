import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay,
  startOfWeek, endOfWeek, eachDayOfInterval, addWeeks,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeOrders, setStatus } from '../../lib/orders'
import StatusBadge from '../../components/ui/StatusBadge'
import BottomNav from '../../components/layout/BottomNav'

// ── Culture boulangerie · Culture G · Devinettes · Blagues (index = jour du mois - 1) ──
const BLAGUES = [
  "🥐 Boulangerie — Le croissant n'est pas français à l'origine ! Il vient de Vienne (Autriche). Marie-Antoinette l'aurait popularisé en France au XVIIIᵉ siècle. La forme en lune croissante rappelait le drapeau ottoman après la victoire de Vienne en 1683.",
  "🧩 Devinette — Je suis fabriqué avec de la farine, de l'eau et du sel. Je suis long, doré, croustillant. On me retrouve sous le bras de presque tous les Français. Qui suis-je ? (La baguette !)",
  "🌍 Culture G — La France est le pays qui consomme le plus de pain par habitant en Europe. Un Français mange en moyenne 130 g de pain par jour, soit une demi-baguette. 🥖",
  "🥐 Boulangerie — Un vrai croissant au beurre contient entre 25 et 30 % de beurre dans sa pâte. C'est ce qui lui donne ses couches feuilletées et son goût incomparable. Un croissant ordinaire est souvent fait à la margarine.",
  "🧩 Devinette — Je me compose de mille couches (enfin, 729 en théorie !), je suis crème et feuilleté. Mon nom signifie littéralement ce que je suis. Qui suis-je ? (Le mille-feuille !)",
  "🌍 Culture G — Le chocolat chaud a été inventé par les Mayas il y a plus de 3 000 ans. Ils le buvaient froid et épicé, sans sucre. C'est l'arrivée en Europe au XVIᵉ siècle qui l'a transformé en boisson sucrée. ☕",
  "🥐 Boulangerie — Le Paris-Brest a été créé en 1910 par le pâtissier Louis Durand, sur la demande du journal L'Auto, pour célébrer la course cycliste Paris-Brest-Paris. Sa forme ronde imite une roue de vélo. 🚴",
  "🧩 Devinette — Plus je sèche, plus je suis dure. Je commence tendre et dorée, mais je vieillis vite. La soupe m'aime encore quand personne d'autre ne veut de moi. Qui suis-je ? (La baguette rassis !)",
  "🌍 Culture G — La tour Eiffel mesure 6 cm de plus en été qu'en hiver. La chaleur dilate le métal. À 324 mètres, elle se dilate de quelques centimètres selon la température. 🗼",
  "🥐 Boulangerie — Le macaron parisien tel qu'on le connaît (deux coques avec une ganache) a été inventé par la maison Ladurée au début du XXᵉ siècle. Le macaron simple, lui, vient d'Italie et fut apporté par Catherine de Médicis au XVIᵉ siècle. 🫐",
  "🧩 Devinette — Je suis ronde, je parfume toute la boulangerie, je suis feuilletée et je viens de Bretagne. Je suis beurrée, sucrée, et un peu caramélisée. Qui suis-je ? (Le kouign-amann !)",
  "🌍 Culture G — Le mot 'boulanger' vient du flamand 'boulenc', qui désignait celui qui faisait des pains ronds. Avant, on appelait ça un 'talmelier' ou 'panetier'. Le terme boulanger s'impose en France vers le XIIIᵉ siècle. 🍞",
  "🥐 Boulangerie — La pâte à choux n'a pas de levure. Elle gonfle uniquement grâce à la vapeur d'eau emprisonnée dans la pâte lors de la cuisson. C'est pour ça que le four ne doit jamais être ouvert pendant la cuisson ! 💨",
  "🧩 Devinette — Je suis léger comme l'air, je fonds en bouche, et mon nom évoque la vitesse de l'éclair. On me garnit de crème et on me recouvre de fondant. Qui suis-je ? (L'éclair !)",
  "🌍 Culture G — Les abeilles visitent environ 2 millions de fleurs pour produire 500 g de miel. Une ruche entière ne produit qu'une cuillère à soupe de miel par abeille sur toute sa vie. 🐝",
  "🥐 Boulangerie — Saint Honoré est le patron des boulangers et pâtissiers. Sa fête est le 16 mai. La légende raconte qu'il était évêque d'Amiens au VIᵉ siècle et qu'une pelle à enfourner fleurit miraculeusement pour annoncer sa vocation. 🙏",
  "🧩 Devinette — On me pétrit, on me laisse reposer, on me façonne, on me cuit. Je suis l'âme de la boulangerie, la base de tout. Sans moi, pas d'éclair, pas de brioche, pas de baguette. Qui suis-je ? (La pâte !)",
  "🌍 Culture G — La France compte environ 33 000 boulangeries artisanales, soit plus que n'importe quel autre type de commerce alimentaire. Chaque jour, les Français achètent environ 6 millions de baguettes. 🇫🇷",
  "🥐 Boulangerie — La brioche doit son nom au verbe 'brier', qui signifie pétrir en normand. Elle contient une grande quantité de beurre et d'œufs — jusqu'à autant de beurre que de farine dans les recettes riches. C'est pour ça qu'elle est si filante et moelleuse. 🧈",
  "🧩 Devinette — Je suis petit, doré, rectangulaire, et je dois mon nom aux financiers de la Bourse de Paris qui me mangeaient sans se salir les mains entre deux transactions. Qui suis-je ? (Le financier !)",
  "🌍 Culture G — Le Groenland est techniquement une île, mais c'est la plus grande île du monde (non continentale). Sa superficie est 5 fois celle de la France métropolitaine. 🗺️",
  "🥐 Boulangerie — La loi française encadre strictement la baguette de tradition : elle doit être faite sur place, sans additif, uniquement avec de la farine, de l'eau, du sel et de la levure ou du levain. Une boulangerie qui vend du pain surgelé n'a pas le droit de s'appeler 'boulangerie'. 🏆",
  "🧩 Devinette — Plus on me chauffe, plus je deviens solide. Je suis la preuve que la cuisine peut défier la logique. Les pâtissiers me sont très reconnaissants. Qui suis-je ? (L'œuf en cuisson !)",
  "🌍 Culture G — Une banane n'est pas un fruit au sens botanique du terme — c'est une baie ! Et de même, les fraises ne sont pas des fruits : ce sont des 'faux-fruits'. Le vrai fruit de la fraisier, ce sont les petits points noirs à sa surface. 🍓",
  "🥐 Boulangerie — Le feuilletage d'un croissant classique compte 27 couches de pâte et autant de beurre, obtenues par 3 tours doubles. C'est le 'tourage' qui crée ces feuillets si légers et croustillants. 🧈",
  "🧩 Devinette — Je suis composée de 3 boules de tailles différentes, je suis beurrée et moelleuse, et ma tête a tendance à tomber. On me mange au petit-déjeuner avec confiture. Qui suis-je ? (La brioche à tête !)",
  "🌍 Culture G — Le mot 'salaire' vient du latin 'salarium', car les soldats romains étaient parfois payés en sel — une denrée très précieuse à l'époque. D'où l'expression 'ne pas valoir son sel'. 🧂",
  "🥐 Boulangerie — L'Opéra est un gâteau parisien inventé par la maison Dalloyau dans les années 1950-60. Il doit son nom à l'Opéra Garnier, dont il rappelle l'élégance. Ses couches sont : génoise café, crème au beurre café, ganache chocolat. 🎭",
  "🧩 Devinette — Je suis blanc, je viens de la mer, je suis indispensable en boulangerie mais en excès je suis dangereux. Sans moi, le pain est fade. Trop de moi, et il ne lève pas. Qui suis-je ? (Le sel !)",
  "🌍 Culture G — Le cacao est originaire d'Amérique centrale. Les fèves de cacao étaient si précieuses chez les Aztèques qu'elles servaient de monnaie d'échange. Un esclave pouvait s'acheter contre 100 fèves. 🍫",
  "🥐 Boulangerie — Le levain est vivant ! C'est une colonie de bactéries lactiques et de levures sauvages qu'on nourrit chaque jour avec de la farine et de l'eau. Certaines boulangeries entretiennent le même levain depuis des décennies. Un levain peut se transmettre comme un héritage. 🌱",
]

const TABS = [
  { id: 'all',   label: 'Toutes' },
  { id: 'ready', label: 'Prêtes' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 10) return 'Belle journée qui commence ! 🌅'
  if (h < 14) return 'Comment ça se passe ? 😊'
  return 'On tient bon ! 💪'
}

export default function VendeurDashboard() {
  const [allOrders, setAllOrders] = useState([])
  const [tab, setTab]             = useState('all')
  const [selected, setSelected]   = useState(null)
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [weekOffset, setWeekOffset]   = useState(0)
  const [prevReady, setPrevReady] = useState(new Set())

  useEffect(() => {
    return subscribeOrders((newOrders) => {
      // Notifications uniquement pour les commandes du jour réel
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

  // Synchronise la sheet si le statut change en temps réel
  useEffect(() => {
    if (!selected) return
    const updated = allOrders.find(o => o.id === selected.id)
    if (updated) setSelected(updated)
  }, [allOrders]) // eslint-disable-line react-hooks/exhaustive-deps

  // Jours de la semaine (lun → dim) selon l'offset
  const weekDays = useMemo(() => {
    const base = addWeeks(new Date(), weekOffset)
    return eachDayOfInterval({
      start: startOfWeek(base, { weekStartsOn: 1 }),
      end:   endOfWeek(base,   { weekStartsOn: 1 }),
    })
  }, [weekOffset])

  // Commandes du jour sélectionné
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
  const todayLabel = format(new Date(), 'EEEE d MMMM', { locale: fr })

  return (
    <div className="min-h-dvh bg-cream flex flex-col max-w-lg mx-auto">

      {/* ── 1. Header profil ───────────────────────────────────────── */}
      <header
        className="bg-cream px-5 pb-4 border-b border-warm"
        style={{ paddingTop: 'max(48px, env(safe-area-inset-top))' }}
      >
        <p className="label-xs mb-1">Au Grand Jour</p>
        <h1 className="font-serif text-3xl font-bold text-ink leading-tight">Coucou ! 👋</h1>
        <p className="text-sm text-dust mt-0.5">{greeting()}</p>
        <p className="text-sm text-dust capitalize mt-0.5">{todayLabel}</p>
      </header>

      <div className="flex-1 overflow-y-auto pb-28">

        {/* ── 2. Calendrier semaine ──────────────────────────────────── */}
        <div className="pt-5 pb-1">
          {/* Navigation mois */}
          <div className="flex items-center justify-between px-5 mb-3">
            <button
              onClick={() => {
                const prev = addWeeks(new Date(), weekOffset - 1)
                setWeekOffset(o => o - 1)
                setSelectedDay(startOfWeek(prev, { weekStartsOn: 1 }))
              }}
              className="text-sm font-semibold text-dust active:text-ink px-2 py-1"
            >
              ← Préc
            </button>
            <p className="font-bold text-ink capitalize text-base">
              {format(weekDays[3], 'MMMM yyyy', { locale: fr })}
            </p>
            <button
              onClick={() => {
                const next = addWeeks(new Date(), weekOffset + 1)
                setWeekOffset(o => o + 1)
                setSelectedDay(startOfWeek(next, { weekStartsOn: 1 }))
              }}
              className="text-sm font-semibold text-dust active:text-ink px-2 py-1"
            >
              Suiv →
            </button>
          </div>

          {/* Pastilles jours */}
          <div className="flex gap-2 px-4 overflow-x-auto scrollbar-none">
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
                  className={`flex-1 flex flex-col items-center justify-center rounded-3xl py-3.5 min-w-[42px] transition-all ${
                    isSelected
                      ? 'shadow-md'
                      : 'bg-white border border-warm/70 shadow-sm'
                  }`}
                  style={isSelected ? { backgroundColor: '#C8A96E' } : {}}
                >
                  <span className={`text-xl font-bold leading-none ${
                    isSelected ? 'text-white' : isToday ? 'text-[#C8A96E]' : 'text-[#C8A96E]'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  <span className={`text-[11px] font-semibold mt-1 capitalize ${
                    isSelected ? 'text-white/80' : 'text-dust'
                  }`}>
                    {format(day, 'EEE', { locale: fr })}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                    hasOrders
                      ? isSelected ? 'bg-white/60' : 'bg-[#C8A96E]/70'
                      : 'bg-transparent'
                  }`} />
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 3. Bonne humeur du jour ────────────────────────────────── */}
        <div className="px-4 pt-4">
          <div className="rounded-2xl px-4 py-3.5" style={{ backgroundColor: '#FFF3E0' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#C67B2A' }}>
              Du jour ✨
            </p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: '#7B4A1A' }}>
              {blague}
            </p>
          </div>
        </div>

        {/* ── 4. Card commandes prêtes à remettre ───────────────────── */}
        <div className="px-4 pt-4">
          {ready === 0 ? (
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-green-600 text-lg">✓</span>
              <p className="text-sm font-semibold text-green-800">Tout est à jour</p>
            </div>
          ) : (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-4 text-center animate-pulse">
              <p className="font-serif text-5xl font-bold text-amber-700 leading-none">{ready}</p>
              <p className="text-sm font-semibold text-amber-800 mt-1">
                commande{ready > 1 ? 's' : ''} prête{ready > 1 ? 's' : ''} à remettre
              </p>
            </div>
          )}
        </div>

        {/* ── 5. Tabs + liste ───────────────────────────────────────── */}
        <div className="flex gap-2 px-4 mt-4">
          {TABS.map(t => {
            const count = t.id === 'all' ? dayOrders.length : ready
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

        <main className="px-4 pt-4">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-sm font-semibold text-ink capitalize">
              {isSameDay(selectedDay, new Date())
                ? "Commandes d'aujourd'hui"
                : format(selectedDay, 'EEEE d MMMM', { locale: fr })}
            </p>
            <p className="text-xs text-dust">{dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}</p>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-chalk border border-warm rounded-2xl px-5 py-12 text-center">
              <p className="text-dust text-sm">
                {dayOrders.length === 0 ? 'Aucune commande ce jour-là' : 'Aucune commande ici'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(order => (
                <OrderCard key={order.id} order={order} onOpen={() => setSelected(order)} />
              ))}
            </div>
          )}
        </main>

      </div>

      <BottomNav />

      {selected && <OrderSheet order={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

/* ── Carte résumée ───────────────────────────────────────────────────── */
function OrderCard({ order, onOpen }) {
  const reste = (order.totalAmount || 0) - (order.deposit || 0)
  return (
    <button
      onClick={onOpen}
      className={`w-full text-left rounded-2xl overflow-hidden active:opacity-60 transition-opacity border ${
        order.status === 'done'
          ? 'bg-chalk/60 border-warm/30 opacity-40'
          : 'bg-chalk border-warm'
      }`}
    >
      <div className="px-4 py-3.5 flex items-start gap-3">
        <div className="flex-shrink-0 text-right">
          <p className="text-[10px] font-bold text-dust uppercase tracking-wide">Retrait à</p>
          <p className={`text-2xl font-bold leading-none tabular-nums tracking-tight ${
            order.status === 'done' ? 'text-dust' : 'text-ink'
          }`}>
            {format(parseISO(order.pickupDate), 'HH:mm')}
          </p>
        </div>
        <div className="w-px self-stretch bg-warm flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold truncate ${order.status === 'done' ? 'text-dust' : 'text-ink'}`}>
            {order.clientName}
          </p>
          <p className="text-sm text-dust truncate mt-0.5">{order.articles}</p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <StatusBadge status={order.status} />
            {order.status !== 'done' && reste > 0 && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                {reste} € à encaisser
              </span>
            )}
            {(order.status === 'done' || reste === 0) && order.totalAmount > 0 && (
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

/* ── Bottom sheet détail ─────────────────────────────────────────────── */
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
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50 bg-cream rounded-t-3xl overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-warm" />
        </div>
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
          <div>
            <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1">Client</p>
            <p className="font-semibold text-ink text-lg leading-tight">{order.clientName}</p>
            {order.clientPhone && (
              <a href={`tel:${order.clientPhone}`} className="text-sm text-dust underline mt-0.5 block active:opacity-70">
                {order.clientPhone}
              </a>
            )}
          </div>

          <div className="bg-parchment rounded-2xl px-4 py-3.5">
            <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1.5">Commande</p>
            <p className="font-semibold text-ink leading-snug">{order.articles}</p>
          </div>

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

          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex gap-2.5">
              <span className="flex-shrink-0">⚠</span>
              <p className="text-sm text-amber-800 leading-relaxed">{order.notes}</p>
            </div>
          )}

          {(order.status === 'ready' || order.status === 'done') && (
            <div className="flex rounded-2xl overflow-hidden border border-warm">
              <button
                onClick={() => handleStatus('ready')}
                className={`flex-1 py-3.5 text-sm font-bold transition-colors ${
                  order.status !== 'done' ? 'bg-parchment text-ink' : 'bg-chalk text-dust active:bg-parchment'
                }`}
              >
                Pas encore récupérée
              </button>
              <div className="w-px bg-warm" />
              <button
                onClick={() => handleStatus('done')}
                className={`flex-1 py-3.5 text-sm font-bold transition-colors ${
                  order.status === 'done' ? 'bg-green-50 text-green-800' : 'bg-chalk text-dust active:bg-green-50'
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
