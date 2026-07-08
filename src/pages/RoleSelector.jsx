import { useNavigate } from 'react-router-dom'
import { useRole } from '../context/RoleContext'

const INK = '#2A1810'

/* ────────────────────────────────────────────────────────────
   Logo (en-tête)
   ──────────────────────────────────────────────────────────── */
function IconLogoCroissant() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 15c1-6 6-10 12-10 4 0 6 2 6 4 0 3-3 4-5 3-3-1-5 1-6 4-1 2-3 3-5 2-2-1-2-2-2-3z"/>
      <path d="M8 11c1 1 1 3 0 4"/>
      <path d="M12 8.5c1 1 1 3 0 4.5"/>
      <path d="M16 7.5c1 1 1 2.5 .5 4"/>
    </svg>
  )
}

/* ────────────────────────────────────────────────────────────
   Illustration héro — vitrine de douceurs
   ──────────────────────────────────────────────────────────── */
function IllustrationVitrine() {
  const fill = '#FFF9F0'
  return (
    <svg viewBox="0 0 300 270" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Branches d'olivier décoratives */}
      <path d="M245 235 C258 210 262 178 250 148" fill="none" stroke="#9CAF88" strokeWidth="2.4" strokeLinecap="round"/>
      <ellipse cx="253" cy="222" rx="8" ry="4.5" fill="#E7EFDD" stroke="#9CAF88" strokeWidth="1.6" transform="rotate(-40 253 222)"/>
      <ellipse cx="257" cy="200" rx="8" ry="4.5" fill="#E7EFDD" stroke="#9CAF88" strokeWidth="1.6" transform="rotate(-25 257 200)"/>
      <ellipse cx="255" cy="177" rx="8" ry="4.5" fill="#E7EFDD" stroke="#9CAF88" strokeWidth="1.6" transform="rotate(-10 255 177)"/>
      <ellipse cx="248" cy="156" rx="7.5" ry="4.2" fill="#E7EFDD" stroke="#9CAF88" strokeWidth="1.6" transform="rotate(15 248 156)"/>

      {/* Tasse de café + vapeur */}
      <path d="M220 43 C222 38 222 33 219 28" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"/>
      <path d="M232 40 C234 35 234 30 231 25" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="225" cy="84" rx="34" ry="7.5" fill={fill} stroke={INK} strokeWidth="2.6"/>
      <path d="M203 53 L207 78 C207 78 214 84 225 84 C236 84 243 78 243 78 L247 53 Z" fill={fill} stroke={INK} strokeWidth="2.6" strokeLinejoin="round"/>
      <path d="M247 58 C256 58 259 68 253 74 C250 77 246 77 244 75" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round"/>

      {/* Part de gâteau + cerise */}
      <circle cx="129" cy="34" r="5.5" fill="#D65A5A" stroke={INK} strokeWidth="1.8"/>
      <path d="M129 29 C129 24 132 21 135 20" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M100 46 C100 46 108 42 129 42 C150 42 158 46 158 46 L146 100 C146 100 138 108 129 108 C120 108 112 100 112 100 Z"
            fill={fill} stroke={INK} strokeWidth="2.6" strokeLinejoin="round"/>
      <path d="M108 68 Q129 78 150 68" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"/>
      <path d="M112 90 Q129 98 146 90" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"/>

      {/* Croissant */}
      <path d="M96 220 C104 200 128 190 150 196 C172 202 182 222 174 238 C168 226 152 214 132 213 C114 212 102 216 96 220 Z"
            fill={fill} stroke={INK} strokeWidth="2.6" strokeLinejoin="round"/>
      <path d="M112 208 C116 213 118 217 118 221" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M133 204 C137 210 139 215 138 220" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M154 208 C157 213 158 217 156 222" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round"/>

      {/* Pain */}
      <ellipse cx="221" cy="200" rx="42" ry="21" fill={fill} stroke={INK} strokeWidth="2.6"/>
      <path d="M191 186 L201 210" stroke={INK} strokeWidth="2" strokeLinecap="round"/>
      <path d="M210 182 L220 212" stroke={INK} strokeWidth="2" strokeLinecap="round"/>
      <path d="M231 183 L241 210" stroke={INK} strokeWidth="2" strokeLinecap="round"/>

      {/* Cupcake + cerise */}
      <circle cx="60" cy="145" r="4.5" fill="#D65A5A" stroke={INK} strokeWidth="1.6"/>
      <path d="M42 172 C46 158 52 150 60 150 C68 150 74 158 78 172"
            fill={fill} stroke={INK} strokeWidth="2.4" strokeLinejoin="round"/>
      <path d="M38 172 L46 200 L74 200 L82 172 Z" fill={fill} stroke={INK} strokeWidth="2.4" strokeLinejoin="round"/>
      <path d="M46 178 L50 194" stroke={INK} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M60 178 L60 194" stroke={INK} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M74 178 L70 194" stroke={INK} strokeWidth="1.5" strokeLinecap="round"/>

      {/* Points décoratifs */}
      <circle cx="185" cy="30" r="2.6" fill="#E3B37E"/>
      <circle cx="270" cy="100" r="2.2" fill="#E3B37E"/>
      <circle cx="40" cy="110" r="2.2" fill="#E3B37E"/>
      <circle cx="205" cy="245" r="2.4" fill="#9CAF88"/>
    </svg>
  )
}

/* ────────────────────────────────────────────────────────────
   Petits accents "confettis"
   ──────────────────────────────────────────────────────────── */
function Confetti({ color = INK, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="4"  y1="17" x2="7"  y2="9"  stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="9"  y1="18" x2="11" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="16" x2="15" y2="8"  stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function ArrowCircle({ bg, color }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: 38, height: 38, borderRadius: 9999, backgroundColor: bg, flexShrink: 0 }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
      </svg>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   Bandeau bas — bol + fouet
   ──────────────────────────────────────────────────────────── */
function IconLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
      <circle cx="12" cy="16" r="1.4" fill="#432F2E"/>
    </svg>
  )
}
function IconHeartSquiggle() {
  return (
    <svg width="22" height="20" viewBox="0 0 24 22" fill="none">
      <path d="M12 20 C4 14 2 9 5 6 C7.5 3.5 11 4.5 12 8 C13 4.5 16.5 3.5 19 6 C22 9 20 14 12 20Z"
            fill="none" stroke="#E28C8C" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  )
}
function IllustrationFouet() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <path d="M18 62 C18 46 32 36 54 36 C76 36 90 46 90 62 C90 78 76 86 54 86 C32 86 18 78 18 62Z"
            fill="#FFF9F0" stroke={INK} strokeWidth="2.4" strokeLinejoin="round"/>
      <path d="M24 58 Q54 68 84 58" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M78 34 L98 10" stroke={INK} strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M98 10 C96 10 94 8 95 5 C96 2 100 2 101 5" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M78 34 C70 26 70 16 78 10 C82 20 82 28 78 34Z" fill="none" stroke={INK} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M78 34 C86 28 96 30 100 38 C90 40 82 40 78 34Z" fill="none" stroke={INK} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M78 34 C72 42 72 52 78 58 C84 50 84 40 78 34Z" fill="none" stroke={INK} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  )
}
function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.4"/>
      <path d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6"/>
    </svg>
  )
}

const HOME = {
  vendeur:     '/vendeur',
  patissiere:  '/patissiere',
  manager:     '/manager',
  boulangerie: '/boulangerie',
}

function IconBag() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}
function IconCake() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
      <path d="M2 21h20"/>
      <path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/>
      <path d="M12 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor"/>
    </svg>
  )
}
function IconClipboardChart() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="17" rx="2"/>
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/>
      <path d="M9 17v-4"/><path d="M12.5 17v-7"/><path d="M16 17v-2.5"/>
    </svg>
  )
}
function IconBread() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10a5 5 0 0 1 5-5h8a5 5 0 0 1 0 10H6l-3 3V10z"/>
    </svg>
  )
}

const ROLES = [
  {
    id:          'vendeur',
    label:       'Vendeur·se',
    description: 'Saisir les commandes et voir les retraits du jour',
    Icon:        IconBag,
    iconBg:      '#FFF0B5',
    iconColor:   '#432F2E',
    confetti:    '#F0B99A',
  },
  {
    id:          'patissiere',
    label:       'Pâtissière',
    description: 'Suivre la production et changer les statuts',
    Icon:        IconCake,
    iconBg:      '#DCFCE7',
    iconColor:   '#166534',
    confetti:    '#9CC7A6',
  },
  {
    id:          'manager',
    label:       'Manager',
    description: 'Vue globale, modifications et historique',
    Icon:        IconClipboardChart,
    iconBg:      '#E5F0F5',
    iconColor:   '#1D4E6B',
    confetti:    '#A9BFCE',
  },
  {
    id:          'boulangerie',
    label:       'Boulangerie',
    description: 'Commandes assignées au pôle boulangerie',
    Icon:        IconBread,
    iconBg:      '#FEF3C7',
    iconColor:   '#92400E',
    confetti:    '#E3B37E',
  },
]

export default function RoleSelector() {
  const { setRole } = useRole()
  const navigate    = useNavigate()

  const select = (id) => { setRole(id); navigate(HOME[id]) }

  return (
    <div className="min-h-dvh relative overflow-hidden" style={{ backgroundColor: '#FBF6EC' }}>

      {/* Blobs décoratifs de fond */}
      <div
        aria-hidden
        style={{
          position: 'absolute', left: -60, bottom: -40, width: 200, height: 160,
          borderRadius: '58% 42% 55% 45% / 45% 55% 45% 55%',
          background: '#E7EFDD', opacity: 0.6, zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute', right: -50, bottom: 60, width: 140, height: 110,
          borderRadius: '48% 52% 40% 60% / 55% 45% 55% 45%',
          background: '#FCEAC2', opacity: 0.5, zIndex: 0,
        }}
      />

      <div
        className="relative flex flex-col max-w-lg mx-auto px-5"
        style={{
          paddingTop: 'max(28px, env(safe-area-inset-top))',
          paddingBottom: 40,
          zIndex: 1,
        }}
      >

        {/* ── Bandeau logo ────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-7 animate-fade-up">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center"
              style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF0B5', flexShrink: 0 }}
            >
              <IconLogoCroissant />
            </div>
            <div>
              <p className="font-display" style={{ fontSize: '1.0625rem', color: '#2A1810', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
                Au Grand Jour
              </p>
              <p style={{ fontSize: '0.5625rem', color: '#8A7060', letterSpacing: '0.16em', fontWeight: 700, fontFamily: 'Satoshi' }}>
                BOULANGERIE · PÂTISSERIE
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
            <span className="hidden sm:inline" style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi' }}>
              Besoin d'aide ?
            </span>
            <div
              className="flex items-center justify-center"
              style={{ width: 30, height: 30, borderRadius: 9999, border: '1px solid rgba(67,47,46,0.15)', fontSize: '0.8125rem', color: '#432F2E', fontWeight: 700, fontFamily: 'Satoshi' }}
            >
              ?
            </div>
          </div>
        </div>

        {/* ── En-tête ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 mb-8 animate-fade-up">
          <div className="flex-1 pt-1" style={{ minWidth: 0 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{ position: 'absolute', top: -8, right: -22 }}>
                <Confetti color="#F0B99A" size={22} />
              </div>
              <h1
                className="font-display"
                style={{ fontSize: '2.625rem', color: '#111111', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 6 }}
              >
                Bonjour !
              </h1>
              <svg width="112" height="10" viewBox="0 0 112 10" fill="none" style={{ marginBottom: 10 }}>
                <path d="M2 6 C20 2 32 9 46 5 C60 1 72 8 86 4 C96 1 104 4 110 6" stroke="#EDD83D" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <p
              className="font-display"
              style={{ fontSize: '1.25rem', color: '#432F2E', letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 8 }}
            >
              Quel est votre rôle ?
            </p>
            <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi', lineHeight: 1.5 }}>
              Sélectionnez votre profil pour accéder aux fonctionnalités adaptées.
            </p>
          </div>

          {/* Illustration */}
          <div
            className="flex-shrink-0"
            style={{
              alignSelf: 'center',
              width: 'clamp(150px, 44vw, 196px)',
              height: 'clamp(150px, 44vw, 196px)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '4%',
                borderRadius: '62% 38% 55% 45% / 48% 52% 48% 52%',
                background: 'radial-gradient(circle at 38% 32%, #FFF6DD 0%, #FFEEBE 55%, #FBE3B0 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(67,47,46,0.06)',
                overflow: 'hidden',
              }}
            />
            <div style={{ position: 'absolute', inset: '10%' }}>
              <IllustrationVitrine />
            </div>
          </div>
        </div>

        {/* ── Grille 2×2 ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r, i) => (
            <button
              key={r.id}
              onClick={() => select(r.id)}
              className="relative flex flex-col p-5 text-left active:scale-[0.96] transition-transform animate-fade-up"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                border: '1px solid rgba(67,47,46,0.07)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                animationDelay: `${i * 0.07}s`,
                minHeight: 192,
              }}
            >
              {/* Confetti coin */}
              <div style={{ position: 'absolute', top: 14, right: 14 }}>
                <Confetti color={r.confetti} size={18} />
              </div>

              {/* Icône ronde */}
              <div
                className="flex items-center justify-center mb-3"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 9999,
                  backgroundColor: r.iconBg,
                  color: r.iconColor,
                  flexShrink: 0,
                }}
              >
                <r.Icon />
              </div>

              {/* Label */}
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#111111',
                  fontFamily: 'Satoshi',
                  letterSpacing: '-0.015em',
                  marginBottom: 4,
                  lineHeight: 1.2,
                }}
              >
                {r.label}
              </p>

              {/* Description */}
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: '#8A7060',
                  fontFamily: 'Satoshi',
                  lineHeight: 1.5,
                  flex: 1,
                }}
              >
                {r.description}
              </p>

              {/* Bouton flèche */}
              <div style={{ marginTop: 12 }}>
                <ArrowCircle bg={r.iconBg} color={r.iconColor} />
              </div>
            </button>
          ))}
        </div>

        {/* ── Bandeau info ────────────────────────────────────── */}
        <div
          className="flex items-center justify-between gap-3 animate-fade-up"
          style={{ backgroundColor: '#FCEAC2', borderRadius: 26, padding: '18px 20px', marginTop: 20 }}
        >
          <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
            <div
              className="flex items-center justify-center"
              style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: '#FFFFFF', flexShrink: 0 }}
            >
              <IconLock />
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#432F2E', fontFamily: 'Satoshi', lineHeight: 1.45 }}>
              Vous pourrez changer de rôle<br />à tout moment dans les réglages.
            </p>
          </div>
          <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
            <div style={{ width: 20, opacity: 0.8 }}><IconHeartSquiggle /></div>
            <div style={{ width: 62, height: 52 }}><IllustrationFouet /></div>
          </div>
        </div>

        {/* ── Réglages ────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center justify-center gap-1.5"
          style={{ marginTop: 24, fontSize: '0.875rem', color: '#432F2E', fontFamily: 'Satoshi', fontWeight: 600 }}
        >
          <IconGear />
          <span style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>Réglages</span>
        </button>

      </div>
    </div>
  )
}
