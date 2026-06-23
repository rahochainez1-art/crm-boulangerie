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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}
function IconCake() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
      <path d="M2 21h20"/>
      <path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/>
    </svg>
  )
}
function IconChart() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
    </svg>
  )
}
function IconBread() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
    iconColor:   '#4A4E10',
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
    iconBg:      '#FFF0B5',
    iconColor:   '#432F2E',
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
  const navigate   = useNavigate()

  return (
    <div
      className="min-h-dvh flex flex-col px-5 max-w-lg mx-auto"
      style={{ paddingTop: 'max(72px, env(safe-area-inset-top))', paddingBottom: 48 }}
    >
      {/* En-tête éditorial */}
      <div className="mb-10 animate-fade-up">
        <p className="label-xs mb-4">Au Grand Jour</p>
        <h1
          className="font-serif text-ink leading-[1.05]"
          style={{ fontSize: '2.75rem' }}
        >
          Bonjour,<br />qui êtes-vous ?
        </h1>
        <p className="mt-4 text-base leading-relaxed" style={{ color: '#8A7060' }}>
          Choisissez votre rôle pour commencer.
        </p>
      </div>

      {/* Cartes rôles */}
      <div className="space-y-3 flex-1">
        {ROLES.map((r, i) => (
          <button
            key={r.id}
            onClick={() => { setRole(r.id); navigate(HOME[r.id]) }}
            className="w-full text-left active:scale-[0.985] transition-all animate-fade-up"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8DFC0',
              borderRadius: 24,
              padding: '1.25rem 1.25rem',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              animationDelay: `${i * 0.06}s`,
            }}
          >
            {/* Icône */}
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: r.iconBg,
                color: r.iconColor,
              }}
            >
              <r.Icon />
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0">
              <p
                className="font-serif text-ink leading-tight"
                style={{ fontSize: '1.25rem' }}
              >
                {r.label}
              </p>
              <p className="text-sm mt-0.5 leading-snug" style={{ color: '#8A7060' }}>
                {r.description}
              </p>
            </div>

            {/* Flèche */}
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#B0A090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="flex-shrink-0"
            >
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        ))}
      </div>

      <p className="label-xs text-center mt-8 opacity-50">
        Changeable à tout moment dans les réglages
      </p>
    </div>
  )
}
