import { useRole } from '../context/RoleContext'

function IconBag() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}

function IconCake() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
      <path d="M2 21h20"/>
      <path d="M7 8v2"/>
      <path d="M12 8v2"/>
      <path d="M17 8v2"/>
      <path d="M7 4h.01"/>
      <path d="M12 4h.01"/>
      <path d="M17 4h.01"/>
    </svg>
  )
}

function IconChart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
    </svg>
  )
}

const ROLES = [
  {
    id: 'vendeur',
    label: 'Vendeur·se',
    description: 'Saisir les commandes et\nvoir les retraits du jour',
    cardBg:   '#F2F6CC',
    iconBg:   '#EEED9E',
    iconColor:'#4A4E10',
    Icon: IconBag,
  },
  {
    id: 'patissiere',
    label: 'Pâtissière',
    description: 'Suivre la production et\nchanger les statuts',
    cardBg:   '#DCF0CC',
    iconBg:   '#C8D8A8',
    iconColor:'#1E3D0E',
    Icon: IconCake,
  },
  {
    id: 'manager',
    label: 'Manager',
    description: 'Vue globale, modifications\net historique',
    cardBg:   '#F8EDD4',
    iconBg:   '#F5E6C8',
    iconColor:'#5C3D0A',
    Icon: IconChart,
  },
]

export default function RoleSelector() {
  const { setRole } = useRole()

  return (
    <div
      className="min-h-dvh flex flex-col px-5 max-w-lg mx-auto"
      style={{ paddingTop: 'max(72px, env(safe-area-inset-top))', paddingBottom: 48 }}
    >
      {/* Branding */}
      <div className="mb-10">
        <p className="label-xs mb-5">Boulangerie · Au Grand Jour</p>
        <h1 className="font-serif text-[2.8rem] font-bold text-ink leading-[1.05] tracking-tight">
          Bonjour,<br />qui êtes-vous ?
        </h1>
        <p className="text-dust mt-4 text-base leading-relaxed">
          Choisissez votre rôle pour commencer.
        </p>
      </div>

      {/* Rôles */}
      <div className="space-y-3 flex-1">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className="w-full rounded-2xl p-5 text-left active:scale-[0.985] transition-transform flex items-center gap-5 overflow-hidden relative"
            style={{
              backgroundColor: r.cardBg,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {/* Icône */}
            <div
              className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: r.iconBg, color: r.iconColor }}
            >
              <r.Icon />
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0">
              <p className="font-serif font-bold text-ink text-[1.35rem] leading-tight">
                {r.label}
              </p>
              <p className="text-sm mt-1 leading-snug whitespace-pre-line"
                style={{ color: r.iconColor, opacity: 0.7 }}>
                {r.description}
              </p>
            </div>

            {/* Flèche */}
            <span
              className="text-xl flex-shrink-0 font-light"
              style={{ color: r.iconColor, opacity: 0.5 }}
            >
              →
            </span>
          </button>
        ))}
      </div>

      <p className="label-xs text-center mt-8 opacity-60">
        Changeable à tout moment dans les réglages
      </p>
    </div>
  )
}
