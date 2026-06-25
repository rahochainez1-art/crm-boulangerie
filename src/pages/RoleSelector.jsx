import { useNavigate } from 'react-router-dom'
import { useRole } from '../context/RoleContext'

function IllustrationBoulangerie() {
  const S = '#432F2E'
  const W = '1.9'
  const WS = '1.5'
  return (
    <svg viewBox="0 0 200 210" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="115" cy="105" rx="72" ry="80" fill="#FFF0B5"/>
      <ellipse cx="62"  cy="172" rx="30"  ry="22" fill="#FAE0C8"/>
      <ellipse cx="108" cy="194" rx="38" ry="7"   fill="white" stroke={S} strokeWidth={W}/>
      <rect   x="104"  y="170"  width="8" height="25" rx="4" fill="white" stroke={S} strokeWidth={W}/>
      <ellipse cx="108" cy="170" rx="28" ry="5"   fill="white" stroke={S} strokeWidth={W}/>
      <path d="M80 145 L80 170" stroke={S} strokeWidth={W}/>
      <path d="M136 145 L136 170" stroke={S} strokeWidth={W}/>
      <path d="M80 170 Q108 177 136 170" stroke={S} strokeWidth={W} fill="none"/>
      <ellipse cx="108" cy="145" rx="28" ry="5"   fill="white" stroke={S} strokeWidth={W}/>
      <path d="M80 155 C84 149 88 161 92 155 C96 149 100 161 104 155 C108 149 112 161 116 155 C120 149 124 161 128 155 C132 149 136 155 136 155"
            stroke={S} strokeWidth={WS} strokeLinecap="round" fill="none"/>
      <path d="M88 122 L88 145" stroke={S} strokeWidth={W}/>
      <path d="M128 122 L128 145" stroke={S} strokeWidth={W}/>
      <path d="M88 145 Q108 151 128 145" stroke={S} strokeWidth={W} fill="none"/>
      <ellipse cx="108" cy="122" rx="20" ry="4"   fill="white" stroke={S} strokeWidth={W}/>
      <circle cx="96"  cy="133" r="2" fill={S}/>
      <circle cx="108" cy="130" r="2" fill={S}/>
      <circle cx="120" cy="133" r="2" fill={S}/>
      <path d="M95 103 L95 122" stroke={S} strokeWidth={W}/>
      <path d="M121 103 L121 122" stroke={S} strokeWidth={W}/>
      <path d="M95 122 Q108 127 121 122" stroke={S} strokeWidth={W} fill="none"/>
      <ellipse cx="108" cy="103" rx="13" ry="3"   fill="white" stroke={S} strokeWidth={W}/>
      <circle cx="102" cy="112" r="1.5" fill="none" stroke={S} strokeWidth="1.2"/>
      <circle cx="108" cy="110" r="1.5" fill="none" stroke={S} strokeWidth="1.2"/>
      <circle cx="114" cy="112" r="1.5" fill="none" stroke={S} strokeWidth="1.2"/>
      <rect x="105" y="90" width="6" height="13" rx="3" fill="white" stroke={S} strokeWidth={WS}/>
      <path d="M108 90 C106 85 105 81 108 78 C111 81 110 85 108 90Z" fill="white" stroke={S} strokeWidth="1.4" strokeLinecap="round"/>
      <ellipse cx="68" cy="182" rx="18" ry="12" fill="white" stroke={S} strokeWidth={W}/>
      <path d="M56 180 C61 173 75 173 80 180" stroke={S} strokeWidth={WS} strokeLinecap="round" fill="none"/>
      <path d="M144 158 C146 140 166 130 180 138 C192 144 192 162 182 172 C170 182 144 178 142 164 Z"
            fill="white" stroke={S} strokeWidth={W} strokeLinejoin="round"/>
      <path d="M152 141 C150 153 151 163 152 172" stroke={S} strokeWidth={WS} strokeLinecap="round"/>
      <path d="M164 134 C162 147 163 158 164 170" stroke={S} strokeWidth={WS} strokeLinecap="round"/>
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
      <div className="flex items-start justify-between mb-8 animate-fade-up">
        <div className="flex-1 pr-4 pt-1">
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
        <div className="flex-shrink-0" style={{ width: 148, height: 148 }}>
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
