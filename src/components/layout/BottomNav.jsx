import { NavLink, useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'

const navByRole = {
  vendeur: [
    { to: '/vendeur',                   label: 'Accueil',   icon: '◎', end: true },
    { to: '/vendeur/nouvelle-commande', label: 'Commander', icon: '✦', end: true },
    { to: '/vendeur/historique', label: 'Historique', icon: '◷', end: true },
  ],
  patissiere: [
    { to: '/patissiere', label: 'Production', icon: '◈', end: true },
    { to: '/calendrier', label: 'Calendrier', icon: '▦',  end: true },
  ],
  manager: [
    { to: '/manager',        label: 'Dashboard', icon: '◉', end: true },
    { to: '/manager/toutes', label: 'Toutes',    icon: '≡', end: true },
  ],
}

export default function BottomNav() {
  const { role } = useRole()
  const navigate = useNavigate()
  const links = navByRole[role] ?? []

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-chalk border-t border-warm z-50 max-w-lg mx-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 flex-1 py-3 text-xs font-semibold transition-colors ${
                isActive ? 'text-ink' : 'text-dust/60'
              }`
            }
          >
            <span className="text-xl leading-none">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => navigate('/settings')}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-3 text-xs font-semibold text-dust/50 active:text-ink transition-colors"
        >
          <span className="text-xl leading-none">⊙</span>
          <span>Réglages</span>
        </button>
      </div>
    </nav>
  )
}
