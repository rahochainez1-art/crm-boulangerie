import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay,
  startOfWeek, endOfWeek, eachDayOfInterval,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { subscribeOrders, setStatus } from '../../lib/orders'
import StatusBadge from '../../components/ui/StatusBadge'
import BottomNav from '../../components/layout/BottomNav'

// ── Blague / devinette / fait rigolo du jour (index = jour du mois - 1) ──
const BLAGUES = [
  "Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tomberaient dans le bateau. 😄",
  "Qu'est-ce qu'un canif ? Un petit fien. 😅",
  "Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ? Un chat-peint de Noël. 🎄",
  "Qu'est-ce qu'un crocodile qui surveille la cour d'école ? Un sac à dents. 🐊",
  "Pourquoi les fantômes sont-ils de mauvais menteurs ? On voit à travers eux. 👻",
  "Le saviez-vous ? Les pieuvres ont 3 cœurs. Deux pompent le sang vers les branchies, un vers le reste du corps. 🐙",
  "Qu'est-ce qu'un boomerang qui ne revient pas ? Un bâton. 🪃",
  "Pourquoi les vaches portent-elles des cloches ? Parce que leurs cornes ne fonctionnent pas. 🐄",
  "Comment appelle-t-on un chat qui tombe d'un immeuble ? Un chat-ssis. 😸",
  "Le saviez-vous ? Le miel ne se périme jamais — on en a retrouvé dans des tombes égyptiennes vieilles de 3 000 ans, encore comestible. 🍯",
  "Qu'est-ce qu'un Lapon qui fait la vaisselle ? Un Lapon qui fait la vaisselle. (T'attendais quoi ?) 😆",
  "Pourquoi est-ce difficile de jouer aux cartes dans la jungle ? Parce qu'il y a trop de tricheurs. 🃏",
  "Comment appelle-t-on un chat qui fait de la musique ? Un chat-nteur. 🎵",
  "Le saviez-vous ? Les dauphins dorment avec un seul hémisphère du cerveau à la fois. L'autre reste éveillé pour respirer. 🐬",
  "Qu'est-ce qu'un caniche qui se noie ? Un cake. 🎂",
  "Pourquoi les professeurs portent-ils des lunettes ? Pour mieux contrôler leurs classes. 👓",
  "Comment appelle-t-on un chien magicien ? Un labracadabrador. 🐕",
  "Le saviez-vous ? Les chats ont 32 muscles dans chaque oreille — c'est pour ça qu'ils les orientent dans tous les sens. 🐱",
  "Qu'est-ce qu'un boa constructeur ? Un serpent qui fait du bricolage. 🐍",
  "Pourquoi les squelettes ne se battent-ils pas entre eux ? Ils n'ont pas le courage. 💀",
  "Comment appelle-t-on un dinosaure avec un grand vocabulaire ? Un Thésaurus. 🦕",
  "Le saviez-vous ? Les abeilles peuvent reconnaître les visages humains en utilisant le même processus que nous. 🐝",
  "Qu'est-ce qu'une fourmi sur un chewing-gum ? Une fourmi collante. 🐜",
  "Pourquoi les plantes ne peuvent-elles pas utiliser les ordinateurs ? Parce qu'elles ont peur des octets. 🌿",
  "Comment appelle-t-on un escargot sur un bateau ? Un nau-tilus. 🐌",
  "Le saviez-vous ? Les humains et les bananes partagent 50 % de leur ADN. Rassurez-vous, vous restez plus humain que banane. 🍌",
  "Qu'est-ce qu'un Schtroumpf qui tombe dans un puits ? Un fond-Schtroumpf. 😄",
  "Comment appelle-t-on un cerf à la plage ? Un cerf-fins. 🏖️",
  "Pourquoi les livres de maths sont-ils tristes ? Parce qu'ils ont trop de problèmes. 📚",
  "Le saviez-vous ? Une journée sur Vénus est plus longue qu'une année sur Vénus. La planète tourne plus lentement sur elle-même qu'autour du Soleil. 🪐",
  "Qu'est-ce qu'un crocodile qui surveille une cour de prison ? Un sac à barreaux. 😂",
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

  // Jours de la semaine (lun → dim)
  const weekDays = useMemo(() => {
    const now = new Date()
    return eachDayOfInterval({
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end:   endOfWeek(now,   { weekStartsOn: 1 }),
    })
  }, [])

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
        <div className="px-4 pt-4">
          <div className="flex gap-1.5 justify-between">
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
                  className="flex-1 flex flex-col items-center gap-1 py-1"
                >
                  <span className="text-[10px] font-bold text-dust uppercase tracking-wide">
                    {format(day, 'EEEEE', { locale: fr })}
                  </span>
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isSelected
                      ? 'bg-ink text-chalk'
                      : isToday
                      ? 'bg-warm text-ink'
                      : 'text-ink'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    hasOrders
                      ? isSelected ? 'bg-chalk/60' : 'bg-ink/30'
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
              Le saviez-vous ? 😄
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
