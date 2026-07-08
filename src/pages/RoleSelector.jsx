import { useNavigate } from 'react-router-dom'
import { useRole } from '../context/RoleContext'

function IllustrationBoulangerie() {
  const S    = '#2A1810'
  const sw   = '3.2'
  const sw2  = '2.2'
  const fill = '#FFF9F0'
  return (
    <svg viewBox="-16 -14 292 243" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="152" cy="209" rx="112" ry="11" fill="#F5E0BE" opacity="0.75"/>
      <ellipse cx="100" cy="201" rx="62" ry="9"   fill={fill} stroke={S} strokeWidth={sw}/>
      <ellipse cx="100" cy="197" rx="54" ry="7"   fill="none"  stroke={S} strokeWidth="1.8"/>
      <path d="M91 174 C95 181 95 188 91 194 L109 194 C105 188 105 181 109 174 Z"
            fill={fill} stroke={S} strokeWidth={sw} strokeLinejoin="round"/>
      <ellipse cx="100" cy="163" rx="70" ry="11"  fill={fill} stroke={S} strokeWidth={sw}/>
      <ellipse cx="100" cy="158" rx="62" ry="8.5" fill="none"  stroke={S} strokeWidth="1.8"/>
      <rect x="52" y="44" width="96" height="108" fill={fill}/>
      <ellipse cx="100" cy="44" rx="48" ry="9" fill={fill}/>
      <line x1="52"  y1="44" x2="52"  y2="152" stroke={S} strokeWidth={sw} strokeLinecap="round"/>
      <line x1="148" y1="44" x2="148" y2="152" stroke={S} strokeWidth={sw} strokeLinecap="round"/>
      <ellipse cx="100" cy="44" rx="48" ry="9" fill={fill} stroke={S} strokeWidth={sw}/>
      <path d="M52 108 Q64 127 76 108 Q88 127 100 108 Q112 127 124 108 Q136 127 148 108"
            fill="none" stroke={S} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M69 74 L80 81"  stroke={S} strokeWidth="2.8" strokeLinecap="round"/>
      <path d="M103 70 L114 77" stroke={S} strokeWidth="2.8" strokeLinecap="round"/>
      <path d="M84 43 C78 36 75 22 80 11 C83 4 91 1 100 3 C109 1 117 4 120 11 C125 22 122 36 116 43 Z"
            fill={fill} stroke={S} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="207" cy="175" rx="52" ry="27" fill={fill} stroke={S} strokeWidth={sw}/>
      <path d="M165 160 C172 167 176 173 180 179" stroke={S} strokeWidth={sw2} strokeLinecap="round"/>
      <path d="M182 156 C189 163 193 169 197 175" stroke={S} strokeWidth={sw2} strokeLinecap="round"/>
      <path d="M199 155 C206 162 210 168 214 174" stroke={S} strokeWidth={sw2} strokeLinecap="round"/>
      <ellipse cx="178" cy="196" rx="28" ry="18" fill={fill} stroke={S} strokeWidth={sw}/>
      <path d="M168 189 Q178 182 188 189" stroke={S} strokeWidth={sw2} strokeLinecap="round" fill="none"/>
      <circle cx="168" cy="197" r="2.5" fill={S}/>
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
function IconChart() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
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
  },
  {
    id:          'patissiere',
    label:       'Pâtissière',
    description: 'Suivre la production et changer les statuts',
    Icon:        IconCake,
    iconBg:      '#DCFCE7',
    iconColor:   '#166534',
  },
  {
    id:          'manager',
    label:       'Manager',
    description: 'Vue globale, modifications et historique',
    Icon:        IconChart,
    iconBg:      '#E5F0F5',
    iconColor:   '#1D4E6B',
  },
  {
    id:          'boulangerie',
    label:       'Boulangerie',
    description: 'Commandes assignées au pôle boulangerie',
    Icon:        IconBread,
    iconBg:      '#FEF3C7',
    iconColor:   '#92400E',
  },
]

export default function RoleSelector() {
  const { setRole } = useRole()
  const navigate    = useNavigate()

  const select = (id) => { setRole(id); navigate(HOME[id]) }

  return (
    <div
      className="min-h-dvh flex flex-col max-w-lg mx-auto px-5"
      style={{
        backgroundColor: '#F5F2EB',
        paddingTop: 'max(64px, env(safe-area-inset-top))',
        paddingBottom: 40,
      }}
    >

      {/* ── En-tête ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-8 animate-fade-up">
        <div className="flex-1 pt-1" style={{ minWidth: 0 }}>
          <h1
            className="font-display"
            style={{ fontSize: '2.625rem', color: '#111111', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 10 }}
          >
            Salut !&nbsp;☀️
          </h1>
          <p
            className="font-display"
            style={{ fontSize: '1.25rem', color: '#432F2E', letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 8 }}
          >
            Quel est votre rôle ?
          </p>
          <p style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi', lineHeight: 1.5 }}>
            Pour accéder aux fonctionnalités adaptées.
          </p>
        </div>

        {/* Illustration */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            alignSelf: 'center',
            width: 'clamp(148px, 42vw, 188px)',
            height: 'clamp(148px, 42vw, 188px)',
            position: 'relative',
          }}
        >
          {/* Halo décoratif */}
          <div
            style={{
              position: 'absolute',
              inset: '6%',
              borderRadius: '9999px',
              background: 'radial-gradient(circle at 38% 32%, #FFF6DD 0%, #FFEEBE 55%, #FBE3B0 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(67,47,46,0.06)',
            }}
          />
          <IllustrationBoulangerie />
        </div>
      </div>

      {/* ── Grille 2×2 ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {ROLES.map((r, i) => (
          <button
            key={r.id}
            onClick={() => select(r.id)}
            className="flex flex-col p-5 text-left active:scale-[0.96] transition-transform animate-fade-up"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              border: '1px solid rgba(67,47,46,0.07)',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
              animationDelay: `${i * 0.07}s`,
              minHeight: 186,
            }}
          >
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

            {/* Chevron */}
            <div style={{ marginTop: 12 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0B8A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: '#8A7060',
          fontFamily: 'Satoshi',
          marginTop: 28,
          lineHeight: 1.55,
        }}
      >
        Vous pourrez changer à tout moment<br />dans les réglages.
      </p>

    </div>
  )
}
