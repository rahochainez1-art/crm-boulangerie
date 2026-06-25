import { useNavigate } from 'react-router-dom'
import { useRole } from '../context/RoleContext'

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
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 104,
            height: 104,
            borderRadius: 9999,
            backgroundColor: '#FFF0B5',
            boxShadow: '0 4px 24px rgba(237,216,61,0.25)',
          }}
        >
          <span style={{ fontSize: '3rem', lineHeight: 1, userSelect: 'none' }}>🎂</span>
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
