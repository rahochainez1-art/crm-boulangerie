import { useEffect, useState, useMemo } from 'react'
import {
  format, parseISO, isSameDay, isSameMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth, addMonths, subMonths,
  addDays, subDays, differenceInHours,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { subscribeOrders, isAssignedTo } from '../../lib/orders'
import { getPrenom } from '../../lib/settings'

// ── Anecdotes florales ────────────────────────────────────────────────────
const ANECDOTES = [
  { fleur: 'Lys',        texte: 'Le lys symbolise la pureté et l\'élégance. En composition florale, il apporte une allure raffinée et aristocratique.' },
  { fleur: 'Rose',       texte: 'La rose est la reine des fleurs depuis l\'Antiquité. Chaque couleur exprime une émotion : rouge pour l\'amour, blanc pour l\'innocence.' },
  { fleur: 'Pivoine',    texte: 'La pivoine est l\'une des fleurs les plus parfumées. Son eau de fleur sublime délicatement les crèmes et les macarons.' },
  { fleur: 'Lavande',    texte: 'La lavande de Provence est emblématique du sud de la France. Elle s\'associe merveilleusement au miel et aux desserts.' },
  { fleur: 'Tulipe',     texte: 'Originaire d\'Asie centrale, la tulipe déclencha la célèbre "Tulipomania" hollandaise au 17ème siècle. Elle symbolise l\'amour parfait.' },
  { fleur: 'Jasmin',     texte: 'Le jasmin possède l\'un des parfums les plus complexes du règne végétal. Il entre dans les thés les plus fins et les pâtisseries orientales.' },
  { fleur: 'Magnolia',   texte: 'Le magnolia est l\'une des plus anciennes fleurs, antérieure aux abeilles. Ses pétales ont un délicat parfum citronné.' },
  { fleur: 'Orchidée',   texte: 'La famille des orchidées est l\'une des plus diversifiées avec plus de 25 000 espèces. La vanille est une orchidée tropicale.' },
  { fleur: 'Dahlia',     texte: 'Le dahlia est la fleur nationale du Mexique. Ses tubercules étaient consommés par les Aztèques comme légume nourrissant.' },
  { fleur: 'Violette',   texte: 'La violette de Toulouse est protégée en France. Son parfum délicat est utilisé dans la confiserie et les parfums de luxe.' },
  { fleur: 'Iris',       texte: 'L\'iris tire son nom de la déesse grecque de l\'arc-en-ciel. Sa racine (orris) est un fixateur de parfum très prisé en haute parfumerie.' },
  { fleur: 'Coquelicot', texte: 'Le coquelicot symbolise le souvenir et la paix. Ses pétales s\'utilisent en sirop, en confiture artisanale et pour colorer les desserts.' },
  { fleur: 'Camomille',  texte: 'La camomille possède des propriétés apaisantes depuis l\'Antiquité. Elle entre dans de nombreuses recettes de ganaches et d\'infusions pâtissières.' },
  { fleur: 'Hortensia',  texte: 'L\'hortensia change de couleur selon le pH du sol : rose en sol alcalin, bleu en sol acide. Un vrai caméléon du jardin.' },
  { fleur: 'Tournesol',  texte: 'Le tournesol suit le soleil (héliotropisme) uniquement dans sa jeunesse. À maturité, il reste orienté vers l\'est tout au long de sa vie.' },
  { fleur: 'Chrysanthème', texte: 'En Asie, le chrysanthème symbolise la longévité et la joie. Il est largement utilisé dans la cuisine japonaise et les tisanes médicinales.' },
  { fleur: 'Muguet',     texte: 'Le muguet du 1er mai porte bonheur selon la tradition française depuis 1561. Il est l\'une des fleurs les plus toxiques de nos jardins.' },
  { fleur: 'Mimosa',     texte: 'Le mimosa fleurit en hiver et annonce le printemps. Le "Train du Mimosa" part de Bormes-les-Mimosas à Grasse chaque février.' },
  { fleur: 'Clématite',  texte: 'Parfois appelée "reine des lianes", la clématite peut grimper jusqu\'à 10 mètres de hauteur et fleurir deux fois par an.' },
  { fleur: 'Glaïeul',    texte: 'Le glaïeul tire son nom du latin "gladius" (épée) en référence à ses feuilles en lame. Il symbolise la sincérité et la force morale.' },
]

function getAnecdoteduJour() {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const dayOfYear = Math.floor((new Date() - start) / 86400000)
  return ANECDOTES[dayOfYear % ANECDOTES.length]
}

// ── Illustrations SVG ─────────────────────────────────────────────────────
function IllustrationLys() {
  return (
    <svg viewBox="0 0 110 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Décorations */}
      <path d="M95 8 L96 11 L99 12 L96 13 L95 16 L94 13 L91 12 L94 11Z" fill="#EDD83D" opacity="0.7"/>
      <path d="M104 26 L105 28 L107 29 L105 30 L104 32 L103 30 L101 29 L103 28Z" fill="#EDD83D" opacity="0.5"/>
      {/* Tige */}
      <path d="M55 126 L55 72" stroke="#6B9E5E" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Feuilles */}
      <path d="M55 96 C42 86 26 80 18 68 C30 76 44 85 55 96Z" fill="#7CAD6A"/>
      <path d="M55 88 C68 78 84 72 92 60 C80 70 66 79 55 88Z" fill="#5D8A52"/>
      {/* Pétales arrière */}
      <path d="M55 63 C53 46 44 28 47 11 C51 28 55 46 55 63Z" fill="#F7F3E2" stroke="#C8B870" strokeWidth="0.8"/>
      <path d="M55 63 C70 56 86 48 93 34 C80 46 68 56 55 63Z" fill="#F7F3E2" stroke="#C8B870" strokeWidth="0.8"/>
      <path d="M55 63 C40 56 24 48 17 34 C30 46 42 56 55 63Z" fill="#F7F3E2" stroke="#C8B870" strokeWidth="0.8"/>
      {/* Pétales avant */}
      <path d="M55 63 C57 46 66 28 61 11 C55 28 53 46 55 63Z" fill="#FFFCEE" stroke="#C8B870" strokeWidth="1"/>
      <path d="M55 63 C72 58 90 64 98 56 C85 58 70 59 55 63Z" fill="#FFFCEE" stroke="#C8B870" strokeWidth="1"/>
      <path d="M55 63 C38 58 20 64 12 56 C25 58 40 59 55 63Z" fill="#FFFCEE" stroke="#C8B870" strokeWidth="1"/>
      {/* Étamines */}
      <path d="M55 61 L55 40" stroke="#C8960C" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="55" cy="38" r="3" fill="#EDD83D"/>
      <path d="M55 61 L66 45" stroke="#C8960C" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="67" cy="43" r="2.5" fill="#EDD83D"/>
      <path d="M55 61 L44 45" stroke="#C8960C" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="43" cy="43" r="2.5" fill="#EDD83D"/>
      <path d="M55 61 L62 52" stroke="#C8960C" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="63" cy="50" r="2" fill="#EDD83D"/>
      <path d="M55 61 L48 52" stroke="#C8960C" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="47" cy="50" r="2" fill="#EDD83D"/>
    </svg>
  )
}

function IllustrationBoulangerie() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <path d="M108 22 C140 14 182 28 192 72 C202 116 180 155 148 165 C116 175 76 160 64 128 C52 96 60 50 86 34 C94 28 100 24 108 22Z" fill="#FFF0B5"/>
      <path d="M52 150 C63 133 96 130 106 154 C116 178 92 196 68 189 C44 182 41 167 52 150Z" fill="#FAE0C8"/>
      <ellipse cx="108" cy="176" rx="30" ry="5.5" fill="white" stroke="#432F2E" strokeWidth="1.9"/>
      <rect x="104" y="150" width="8" height="27" rx="4" fill="white" stroke="#432F2E" strokeWidth="1.9"/>
      <ellipse cx="108" cy="150" rx="24" ry="4.5" fill="white" stroke="#432F2E" strokeWidth="1.9"/>
      <ellipse cx="108" cy="106" rx="27" ry="5" fill="#FEFEFE" stroke="#432F2E" strokeWidth="1.9"/>
      <path d="M81 106 L81 150" stroke="#432F2E" strokeWidth="1.9"/>
      <path d="M135 106 L135 150" stroke="#432F2E" strokeWidth="1.9"/>
      <path d="M81 150 Q108 156 135 150" stroke="#432F2E" strokeWidth="1.9" fill="none"/>
      <path d="M81 127 C85 121 89 133 93 127 C97 121 101 133 105 127 C109 121 113 133 117 127 C121 121 125 133 129 127 L135 127" stroke="#432F2E" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <path d="M108 99 C106 94 106 89 109 86 C112 83 116 85 115 89 C114 93 110 92 111 88" stroke="#432F2E" strokeWidth="1.9" strokeLinecap="round" fill="none"/>
      <circle cx="108" cy="101" r="2.5" fill="white" stroke="#432F2E" strokeWidth="1.6"/>
      <path d="M136 154 C138 138 158 129 173 136 C184 141 186 158 176 168 C166 178 140 174 136 160 Z" fill="white" stroke="#432F2E" strokeWidth="1.9" strokeLinejoin="round"/>
      <path d="M147 136 C145 148 146 159 147 168" stroke="#432F2E" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M159 131 C157 144 158 156 159 166" stroke="#432F2E" strokeWidth="1.4" strokeLinecap="round"/>
      <ellipse cx="120" cy="180" rx="14" ry="9.5" fill="white" stroke="#432F2E" strokeWidth="1.9"/>
      <path d="M109 179 C113 173 128 173 131 179" stroke="#432F2E" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// ── Icônes ────────────────────────────────────────────────────────────────
const IconFleurBadge = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 4 C10.2 7 8 8 5 7.5 C7.5 10 7.5 13 5 14.5 C8 14 10.2 15 11 18 C11.8 15 14 14 17 14.5 C14.5 13 14.5 10 17 7.5 C14 8 11.8 7 11 4Z" fill="#B8860B"/>
    <circle cx="11" cy="11" r="3" fill="#EDD83D"/>
  </svg>
)
const IconClipboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>
    <path d="M9 12h6M9 16h4"/>
  </svg>
)
const IconHourglass = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 22h14M5 2h14"/>
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
  </svg>
)
const IconCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IconAlertCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconCalendar = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconAlertSmall = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconCakeSmall = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
    <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
    <path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/>
    <circle cx="12" cy="6" r="1" fill="#432F2E"/>
  </svg>
)
const IconCakePole = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
    <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
    <path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/>
    <circle cx="12" cy="6" r="1" fill="currentColor"/>
  </svg>
)
const IconBreadPole = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10a5 5 0 0 1 5-5h8a5 5 0 0 1 0 10H6l-3 3V10z"/>
  </svg>
)
const IconCupcakePole = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4z"/>
    <path d="M6.5 6h11l-1.5 10h-8L6.5 6z"/>
    <path d="M9 16v4"/><path d="M12 16v4"/><path d="M15 16v4"/>
    <path d="M8 20h8"/>
  </svg>
)
const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)
const IconList = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6"  x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

// ── Carte Anecdote du jour ─────────────────────────────────────────────────
function AnecdoteCard() {
  const anecdote = useMemo(() => getAnecdoteduJour(), [])

  return (
    <div
      className="rounded-[20px] px-4 py-3.5 mb-4 flex items-center gap-3 animate-fade-up overflow-hidden"
      style={{
        backgroundColor: '#FFF8D6',
        border: '1px solid rgba(200,150,12,0.2)',
        boxShadow: '0 2px 12px rgba(200,150,12,0.08)',
        position: 'relative',
      }}
    >
      {/* Icône fleur gauche */}
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(200,150,12,0.15)' }}>
        <IconFleurBadge />
      </div>

      {/* Texte */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#432F2E', fontFamily: 'Satoshi' }}>
            Anecdote du jour
          </p>
          <span style={{ fontSize: '0.5625rem', fontWeight: 700, padding: '1px 7px', borderRadius: 9999, backgroundColor: 'rgba(200,150,12,0.18)', color: '#92400E', fontFamily: 'Satoshi' }}>
            🌸 {anecdote.fleur}
          </span>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#5C4A30', fontFamily: 'Satoshi', lineHeight: 1.45 }}>
          {anecdote.texte}
        </p>
      </div>

      {/* Illustration lys (droite) */}
      <div className="flex-shrink-0" style={{ width: 72, height: 86, opacity: 0.9 }}>
        <IllustrationLys />
      </div>
    </div>
  )
}

// ── Chips ─────────────────────────────────────────────────────────────────
function Chip({ icon, label, urgent }) {
  return (
    <div className="inline-flex items-center gap-1.5" style={{ padding: '0.25rem 0.6rem', borderRadius: 9999, backgroundColor: urgent ? '#FEE2E2' : 'rgba(67,47,46,0.07)', border: `1px solid ${urgent ? 'rgba(220,38,38,0.2)' : 'rgba(67,47,46,0.08)'}` }}>
      <span style={{ color: urgent ? '#DC2626' : '#8A7060', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: urgent ? '#DC2626' : '#432F2E', fontFamily: 'Satoshi', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

// ── KPI Strip ─────────────────────────────────────────────────────────────
function KpiStrip({ orders, navigate }) {
  const today     = new Date()
  const yesterday = subDays(today, 1)

  const todayAll     = orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), today) && o.status !== 'cancelled')
  const yesterdayAll = orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), yesterday) && o.status !== 'cancelled')
  const todayDiff    = todayAll.length - yesterdayAll.length

  const inProg      = orders.filter(o => o.status === 'inprogress')
  const patisInProg = inProg.filter(o => isAssignedTo(o, 'patissiere')).length
  const boulaInProg = inProg.filter(o => isAssignedTo(o, 'boulangerie')).length

  const readyNow = orders.filter(o => o.status === 'ready').length
  const urgentOrders = todayAll.filter(o => {
    if (o.status === 'done' || o.status === 'cancelled') return false
    return differenceInHours(parseISO(o.pickupDate), today) <= 2
  })

  const todayStr = format(today, 'yyyy-MM-dd')

  const kpis = [
    {
      Icon: IconClipboard, iconBg: '#FFF3CC', iconColor: '#92400E',
      value: todayAll.length, label: "Aujourd'hui",
      onClick: () => navigate('/manager/toutes', { state: { date: todayStr } }),
      detail: todayDiff !== 0 ? (
        <span style={{ color: todayDiff > 0 ? '#10B981' : '#EF4444', fontSize: '0.6rem', fontWeight: 600, fontFamily: 'Satoshi' }}>
          {todayDiff > 0 ? `+${todayDiff}` : todayDiff} vs hier {todayDiff > 0 ? '↗' : '↘'}
        </span>
      ) : null,
    },
    {
      Icon: IconHourglass, iconBg: '#FFF3CC', iconColor: '#92400E',
      value: inProg.length, label: 'En cours',
      onClick: () => navigate('/manager/toutes', { state: { status: 'inprogress' } }),
      detail: (
        <div>
          {patisInProg > 0 && (
            <div className="flex items-center gap-1 mb-0.5">
              <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: '#F472B6', display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: '0.5625rem', color: '#8A7060', fontFamily: 'Satoshi' }}>{patisInProg} pâtisserie</span>
            </div>
          )}
          {boulaInProg > 0 && (
            <div className="flex items-center gap-1">
              <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: '#EDD83D', display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: '0.5625rem', color: '#8A7060', fontFamily: 'Satoshi' }}>{boulaInProg} boulangerie</span>
            </div>
          )}
        </div>
      ),
    },
    {
      Icon: IconCheckCircle, iconBg: '#DCFCE7', iconColor: '#166534',
      value: readyNow, label: 'Prêtes',
      onClick: () => navigate('/manager/toutes', { state: { status: 'ready' } }),
      detail: null,
    },
    {
      Icon: IconAlertCircle, iconBg: '#FEE2E2', iconColor: '#DC2626',
      value: urgentOrders.length, label: 'Urgentes', urgent: urgentOrders.length > 0,
      onClick: () => navigate('/manager/toutes', { state: { status: 'urgent' } }),
      detail: urgentOrders.length > 0 ? (
        <span style={{ color: '#DC2626', fontSize: '0.6rem', fontWeight: 600, fontFamily: 'Satoshi' }}>Retrait &lt; 2h</span>
      ) : null,
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-2 mb-5">
      {kpis.map((k, i) => (
        <button key={i} onClick={k.onClick}
          className="rounded-[16px] p-3 animate-fade-up text-left active:scale-[0.95] transition-transform"
          style={{ backgroundColor: '#FFFFFF', border: k.urgent ? '1px solid rgba(220,38,38,0.18)' : '1px solid rgba(67,47,46,0.07)', boxShadow: '0 2px 12px rgba(67,47,46,0.04)', animationDelay: `${i * 0.06}s` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: k.iconBg, color: k.iconColor, flexShrink: 0 }}>
              <k.Icon />
            </div>
            <p className="font-display" style={{ fontSize: '1.75rem', color: k.urgent ? '#DC2626' : '#111111', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {k.value}
            </p>
          </div>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: k.urgent ? '#DC2626' : '#111111', fontFamily: 'Satoshi', marginBottom: 5 }}>
            {k.label}
          </p>
          {k.detail && <div>{k.detail}</div>}
        </button>
      ))}
    </div>
  )
}

// ── À surveiller ──────────────────────────────────────────────────────────
function SurveillanceCard({ orders, onViewAll, navigate }) {
  const today = new Date()
  const urgent = orders.filter(o => {
    if (!o.pickupDate || o.status === 'done' || o.status === 'cancelled') return false
    if (!isSameDay(parseISO(o.pickupDate), today)) return false
    return differenceInHours(parseISO(o.pickupDate), today) <= 2
  }).sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))

  if (urgent.length === 0) return null

  return (
    <div className="rounded-[20px] mb-5 overflow-hidden animate-fade-up"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)', boxShadow: '0 2px 16px rgba(67,47,46,0.06)' }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>À surveiller aujourd'hui</p>
          <span style={{ minWidth: 20, height: 20, borderRadius: 9999, backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'Satoshi', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
            {urgent.length}
          </span>
        </div>
        <button onClick={onViewAll} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi', display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer' }}>
          Voir tout <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {urgent.map((o, i) => {
        const poleStr = Array.isArray(o.assignedTo)
          ? o.assignedTo.map(p => ({ patissiere: 'Pâtisserie', boulangerie: 'Boulangerie', vendeur: 'Vendeur·se' }[p] ?? p)).join(' + ')
          : ({ patissiere: 'Pâtisserie', boulangerie: 'Boulangerie', vendeur: 'Vendeur·se' }[o.assignedTo] ?? '—')
        const isPatis   = o.assignedTo === 'patissiere' || (Array.isArray(o.assignedTo) && o.assignedTo.includes('patissiere'))
        const poleBg    = isPatis ? '#DCFCE7' : '#FEF3C7'
        const poleColor = isPatis ? '#166534'  : '#92400E'

        return (
          <button key={o.id} onClick={() => navigate('/manager/toutes', { state: { orderId: o.id } })}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:bg-black/[0.02]"
            style={{ borderTop: i > 0 ? '1px solid rgba(67,47,46,0.06)' : undefined }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#DC2626', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums', minWidth: 42, flexShrink: 0 }}>
              {format(parseISO(o.pickupDate), 'HH:mm')}
            </p>
            <div style={{ flexShrink: 0 }}><IconCakeSmall /></div>
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111111', fontFamily: 'Satoshi', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {o.articles}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi' }}>{o.clientName}</span>
                <span style={{ color: '#C0B8A8', fontSize: '0.625rem' }}>·</span>
                <span style={{ backgroundColor: poleBg, color: poleColor, padding: '1px 8px', borderRadius: 9999, fontSize: '0.625rem', fontWeight: 600, fontFamily: 'Satoshi' }}>{poleStr}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: '#EF4444', display: 'block' }} />
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#EF4444', fontFamily: 'Satoshi' }}>Urgent</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <p style={{ fontSize: '0.5625rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Retrait</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#DC2626', fontFamily: 'Satoshi', fontVariantNumeric: 'tabular-nums' }}>
                {format(parseISO(o.pickupDate), 'HH:mm')}
              </p>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C0B8A8" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        )
      })}
    </div>
  )
}

// ── Barre de progression (blocs colorés) ─────────────────────────────────
function ProgressBlocks({ value, max, color }) {
  const blocks = 10
  const filled = max > 0 ? Math.min(Math.round((value / max) * blocks), blocks) : 0
  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 5 }}>
      {Array.from({ length: blocks }, (_, i) => (
        <div key={i} style={{ flex: 1, height: 5, borderRadius: 2, backgroundColor: i < filled ? color : '#EBE5DA' }} />
      ))}
    </div>
  )
}

// ── Planning widget (3 jours / Semaine / Mois) ────────────────────────────
const DAY_LABELS_CAL = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const DAY_ABR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function PlanningWidget({ orders, onViewAll, navigate }) {
  const [planTab, setPlanTab] = useState('3jours')
  const [viewMonth, setViewMonth] = useState(new Date())

  return (
    <div className="rounded-[20px] mb-4 animate-fade-up"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(67,47,46,0.07)', boxShadow: '0 2px 16px rgba(67,47,46,0.06)', overflow: 'clip' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div style={{ color: '#432F2E' }}><IconCalendar /></div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>
            Planning des 3 prochains jours
          </p>
        </div>
        <div className="flex gap-1" style={{ backgroundColor: '#F0EDE6', borderRadius: 12, padding: 3 }}>
          {['3jours', 'Semaine', 'Mois'].map(t => (
            <button key={t} onClick={() => setPlanTab(t)}
              style={{ fontSize: '0.625rem', fontWeight: 700, fontFamily: 'Satoshi', padding: '4px 8px', borderRadius: 9, border: 'none', cursor: 'pointer', backgroundColor: planTab === t ? '#432F2E' : 'transparent', color: planTab === t ? '#FFFFFF' : '#8A7060', transition: 'all 0.15s' }}>
              {t === '3jours' ? '3 jours' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className={planTab === '3jours' ? 'pb-4 pl-4' : 'px-4 pb-4'}>
        {planTab === '3jours' && <Vue3Jours orders={orders} navigate={navigate} />}
        {planTab === 'Semaine' && <VueSemaine orders={orders} navigate={navigate} />}
        {planTab === 'Mois' && <VueMois orders={orders} viewMonth={viewMonth} setViewMonth={setViewMonth} navigate={navigate} />}
      </div>

      {/* Voir tout */}
      <button onClick={onViewAll} className="w-full flex items-center justify-between active:bg-black/[0.02]"
        style={{ padding: '12px 16px', borderTop: '1px solid rgba(67,47,46,0.07)', background: 'none', border: 'none', borderTop: '1px solid rgba(67,47,46,0.07)', cursor: 'pointer' }}>
        <div className="flex items-center gap-2">
          <div style={{ color: '#432F2E' }}><IconCalendar size={16} /></div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>Voir tout le planning</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0B8A8" strokeWidth="2.5" strokeLinecap="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    </div>
  )
}

// ── Vue 3 jours ────────────────────────────────────────────────────────────
const COLS_CONFIG = [
  { badge: 'Demain',       colBg: '#FFFBEA', badgeBg: '#FEF3C7', badgeColor: '#92400E', urgentBorder: '#E8D88C',  offset: 1 },
  { badge: 'Après-demain', colBg: '#F4F3F1', badgeBg: '#E5E5E0', badgeColor: '#6B6B60', urgentBorder: '#D0CDC8',  offset: 2 },
  { badge: 'Dans 3 jours', colBg: '#EDE8E0', badgeBg: '#D9CFC4', badgeColor: '#5C3D2B', urgentBorder: '#C8BEB4', offset: 3 },
]

function Vue3Jours({ orders, navigate }) {
  const today = new Date()

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', paddingBottom: 4, paddingRight: 16 }}>
      {COLS_CONFIG.map(({ badge, colBg, badgeBg, badgeColor, urgentBorder, offset }) => {
        const day       = addDays(today, offset)
        const dateStr   = format(day, 'yyyy-MM-dd')
        const dayName   = format(day, 'EEEE', { locale: fr })
        const dayName1  = dayName.charAt(0).toUpperCase() + dayName.slice(1)
        const dayDate   = format(day, 'd MMMM', { locale: fr })

        const dayOrders = orders
          .filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), day) && o.status !== 'cancelled')
          .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))

        const urgent = dayOrders.filter(o =>
          o.status !== 'done' && differenceInHours(parseISO(o.pickupDate), new Date()) <= 2
        ).length

        return (
          <div key={offset} style={{ backgroundColor: colBg, borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, width: 'calc(100% - 28px)', scrollSnapAlign: 'start' }}>

            {/* Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4, marginBottom: 3 }}>
                <div className="font-display" style={{ fontSize: '1rem', color: '#111111', letterSpacing: '-0.03em', lineHeight: 1.2, minWidth: 0 }}>
                  <div>{dayName1}</div>
                  <div>{dayDate}</div>
                </div>
                <span style={{ flexShrink: 0, fontSize: '0.5rem', fontWeight: 700, padding: '2px 6px', borderRadius: 9999, backgroundColor: badgeBg, color: badgeColor, fontFamily: 'Satoshi', marginTop: 2, whiteSpace: 'nowrap' }}>
                  {badge}
                </span>
              </div>
              <p style={{ fontSize: '0.6875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>
                {dayOrders.length} cmde{dayOrders.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Cartes commandes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {dayOrders.length === 0 ? (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 11, padding: '14px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.625rem', color: '#B0A090', fontFamily: 'Satoshi' }}>Aucune commande</p>
                </div>
              ) : dayOrders.map(order => (
                <button key={order.id}
                  onClick={() => navigate('/manager/toutes', { state: { orderId: order.id } })}
                  className="active:scale-[0.97] transition-transform"
                  style={{ backgroundColor: '#FFFFFF', borderRadius: 11, padding: 10, textAlign: 'left', border: 'none', cursor: 'pointer', width: '100%' }}>
                  {/* Ligne heure */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9999, backgroundColor: 'rgba(67,47,46,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', letterSpacing: '-0.02em', flex: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {format(parseISO(order.pickupDate), 'HH:mm')}
                    </p>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C0B8A8" strokeWidth="2" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  {/* Articles */}
                  <p style={{ fontSize: '0.6875rem', color: '#5C4A38', fontFamily: 'Satoshi', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {order.articles}
                  </p>
                </button>
              ))}
            </div>

            {/* Bouton urgences */}
            <button
              onClick={() => navigate('/manager/toutes', { state: { date: dateStr, ...(urgent > 0 ? { status: 'urgent' } : {}) } })}
              style={{
                padding: '11px 8px',
                borderRadius: 11,
                border: urgent > 0 ? 'none' : `1.5px solid ${urgentBorder}`,
                backgroundColor: urgent > 0 ? '#432F2E' : 'transparent',
                color: urgent > 0 ? '#FFFFFF' : '#8A7060',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'Satoshi',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'center',
              }}>
              {urgent > 0 ? `${urgent} urgente${urgent > 1 ? 's' : ''}` : 'Aucune urgence'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Vue Semaine ────────────────────────────────────────────────────────────
function VueSemaine({ orders, navigate }) {
  const today     = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const counts    = weekDays.map(d => orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), d) && o.status !== 'cancelled').length)
  const maxC      = Math.max(...counts, 1)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
      {weekDays.map((day, i) => {
        const isToday = isSameDay(day, today)
        const count   = counts[i]
        const ratio   = count / maxC
        const barH    = Math.max(Math.round(ratio * 28 + 4), 4)
        return (
          <button key={i} onClick={() => navigate('/manager/toutes', { state: { date: format(day, 'yyyy-MM-dd') } })}
            className="flex flex-col items-center rounded-xl py-2 active:opacity-60 transition-opacity"
            style={{ backgroundColor: isToday ? '#FFF8D6' : 'transparent', border: 'none', cursor: 'pointer' }}>
            <p style={{ fontSize: '0.5rem', fontWeight: 700, color: isToday ? '#92400E' : '#8A7060', fontFamily: 'Satoshi', textAlign: 'center', marginBottom: 2 }}>
              {DAY_ABR[i]}<br/>{format(day, 'd')}
            </p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: isToday ? '#432F2E' : '#111111', fontFamily: 'Satoshi', lineHeight: 1.2 }}>{count}</p>
            <p style={{ fontSize: '0.4375rem', color: isToday ? '#92400E' : '#B0A090', fontFamily: 'Satoshi', marginBottom: 5 }}>cmdes</p>
            <div style={{ width: 24, height: barH, borderRadius: 4, backgroundColor: isToday ? '#EDD83D' : '#E8E0D5' }} />
          </button>
        )
      })}
    </div>
  )
}

// ── Vue Mois ───────────────────────────────────────────────────────────────
function VueMois({ orders, viewMonth, setViewMonth, navigate }) {
  const mStart   = startOfMonth(viewMonth)
  const mEnd     = endOfMonth(viewMonth)
  const calStart = startOfWeek(mStart, { weekStartsOn: 1 })
  const calEnd   = endOfWeek(mEnd, { weekStartsOn: 1 })
  const days     = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewMonth(m => subMonths(m, 1))} className="w-8 h-8 flex items-center justify-center rounded-xl" style={{ color: '#8A7060', fontSize: '1.2rem' }}>‹</button>
        <p className="capitalize" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>
          {format(viewMonth, 'MMMM yyyy', { locale: fr })}
        </p>
        <button onClick={() => setViewMonth(m => addMonths(m, 1))} className="w-8 h-8 flex items-center justify-center rounded-xl" style={{ color: '#8A7060', fontSize: '1.2rem' }}>›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS_CAL.map((d, i) => (
          <p key={i} className="text-center" style={{ fontSize: '8px', fontWeight: 700, color: '#B0A090', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Satoshi' }}>{d}</p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map(day => {
          const inMonth = isSameMonth(day, viewMonth)
          const count   = inMonth ? orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), day)).length : 0
          const isToday = isSameDay(day, new Date())
          return (
            <button key={day.toISOString()}
              onClick={() => count > 0 && inMonth && navigate('/manager/toutes', { state: { date: format(day, 'yyyy-MM-dd') } })}
              className="flex flex-col items-center py-1 active:opacity-60 transition-opacity"
              style={{ opacity: inMonth ? 1 : 0.15, background: 'none', border: 'none', cursor: count > 0 && inMonth ? 'pointer' : 'default' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: isToday ? 700 : 500, color: isToday ? '#432F2E' : '#111111', fontFamily: 'Satoshi', lineHeight: 1.3, backgroundColor: isToday ? '#FFF0B5' : 'transparent', borderRadius: 8, padding: '0 3px' }}>
                {format(day, 'd')}
              </span>
              {count > 0 && (
                <span style={{ fontSize: 7, fontWeight: 700, backgroundColor: '#EDD83D', color: '#4A4E10', minWidth: 13, height: 13, padding: '0 2px', borderRadius: 9999, fontFamily: 'Satoshi', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}

// ── Nav constants ─────────────────────────────────────────────────────────
const ACTIVE   = '#111111'
const INACTIVE = '#B0A090'

// ── Manager Dashboard ─────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const [orders, setOrders] = useState([])
  const navigate = useNavigate()

  useEffect(() => subscribeOrders(setOrders), [])

  const today  = new Date()
  const prenom = getPrenom()

  const todayCount = useMemo(() =>
    orders.filter(o => o.pickupDate && isSameDay(parseISO(o.pickupDate), today) && o.status !== 'cancelled').length,
  [orders])

  const urgentCount = useMemo(() =>
    orders.filter(o => {
      if (!o.pickupDate || o.status === 'done' || o.status === 'cancelled') return false
      if (!isSameDay(parseISO(o.pickupDate), today)) return false
      return differenceInHours(parseISO(o.pickupDate), today) <= 2
    }).length,
  [orders])

  const dateLabel = useMemo(() => {
    const s = format(today, 'EEEE d MMMM', { locale: fr })
    return s.charAt(0).toUpperCase() + s.slice(1)
  }, [])

  const NAV = [
    { id: 'home',      label: 'Accueil',   Icon: IconHome, action: () => {} },
    { id: 'commandes', label: 'Commandes', Icon: IconList, action: () => navigate('/manager/toutes') },
    { id: 'planning',  label: 'Planning',  Icon: IconCalendar, action: () => navigate('/manager/toutes') },
    { id: 'reglages',  label: 'Réglages',  Icon: IconSettings, action: () => navigate('/settings') },
  ]

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FDFAF0' }}>

      {/* ── Header ── */}
      <header className="px-4 pb-3" style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}>

        {/* Anecdote du jour */}
        <AnecdoteCard />

        {/* Greeting + illustration */}
        <div className="flex items-start justify-between animate-fade-up">
          <div className="flex-1 pr-2">
            <p style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#8A7060', fontFamily: 'Satoshi', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Au Grand Jour · Manager
            </p>
            <h1 className="font-display" style={{ fontSize: '2.25rem', color: '#111111', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 12 }}>
              Bonjour{prenom ? ` ${prenom}` : ''} ! 👋
            </h1>
            {/* Chips */}
            <div className="flex flex-wrap gap-1.5">
              <Chip icon={<IconCalendar size={11} />} label={dateLabel} />
              <Chip icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>} label={`${todayCount} commandes aujourd'hui`} />
              {urgentCount > 0 && <Chip icon={<IconAlertSmall />} label={`${urgentCount} urgente${urgentCount > 1 ? 's' : ''}`} urgent />}
            </div>
          </div>
          <div style={{ width: 110, height: 100, flexShrink: 0 }}>
            <IllustrationBoulangerie />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 px-4 pt-2 pb-36 overflow-y-auto">
        <KpiStrip orders={orders} navigate={navigate} />
        <SurveillanceCard orders={orders} navigate={navigate} onViewAll={() => navigate('/manager/toutes')} />
        <PlanningWidget orders={orders} navigate={navigate} onViewAll={() => navigate('/manager/toutes')} />
      </main>

      {/* ── Bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50"
        style={{ backgroundColor: 'rgba(253,250,240,0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="max-w-lg mx-auto" style={{ borderTop: '1px solid rgba(67,47,46,0.08)', paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}>
          <div className="flex items-end pt-3 pb-1">
            {NAV.slice(0, 2).map(item => (
              <button key={item.id} onClick={item.action}
                className="flex-1 flex flex-col items-center gap-0.5 pb-1"
                style={{ color: item.id === 'home' ? ACTIVE : INACTIVE }}>
                <item.Icon />
                <span style={{ fontSize: 10, fontWeight: item.id === 'home' ? 700 : 500, color: item.id === 'home' ? ACTIVE : INACTIVE, fontFamily: 'Satoshi' }}>{item.label}</span>
                <span style={{ width: item.id === 'home' ? 16 : 0, height: 2, borderRadius: 9999, backgroundColor: '#EDD83D', marginTop: 2, transition: 'width 0.2s', display: 'block' }} />
              </button>
            ))}

            <button onClick={() => navigate('/vendeur/nouvelle-commande')}
              className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ backgroundColor: '#432F2E', boxShadow: '0 8px 24px rgba(67,47,46,0.35)', transform: 'translateY(-14px)', marginBottom: -14 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>

            {NAV.slice(2).map(item => (
              <button key={item.id} onClick={item.action}
                className="flex-1 flex flex-col items-center gap-0.5 pb-1"
                style={{ color: INACTIVE }}>
                <item.Icon />
                <span style={{ fontSize: 10, fontWeight: 500, color: INACTIVE, fontFamily: 'Satoshi' }}>{item.label}</span>
                <span style={{ width: 0, height: 2, display: 'block' }} />
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}
