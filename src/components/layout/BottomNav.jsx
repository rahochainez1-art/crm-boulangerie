import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useRole } from '../../context/RoleContext'

// ── Icônes vendeur ────────────────────────────────────────────────────────
const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)
const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3 3"/>
  </svg>
)
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

// ── Nav vendeur avec bouton + flottant ────────────────────────────────────
function NavItem({ to, label, Icon }) {
  return (
    <NavLink to={to} end className="flex-1 flex flex-col items-center gap-0.5 pb-1 transition-colors">
      {({ isActive }) => (
        <>
          <span style={{ color: isActive ? '#C8A96E' : '#B0B0B0' }}><Icon /></span>
          <span className="text-[10px] font-semibold mt-0.5" style={{ color: isActive ? '#C8A96E' : '#B0B0B0' }}>
            {label}
          </span>
          {isActive && <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: '#C8A96E' }} />}
        </>
      )}
    </NavLink>
  )
}

function AvatarIcon({ isActive }) {
  const [avatar, setAvatar] = useState(() => localStorage.getItem('agj_profil_avatar'))

  // Rafraîchit l'avatar si changé depuis la page Profil
  useEffect(() => {
    const sync = () => setAvatar(localStorage.getItem('agj_profil_avatar'))
    window.addEventListener('storage', sync)
    window.addEventListener('agj_avatar_updated', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('agj_avatar_updated', sync)
    }
  }, [])

  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        className="rounded-full object-cover"
        style={{
          width: 26, height: 26,
          border: isActive ? '2px solid #C8A96E' : '2px solid transparent',
        }}
      />
    )
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function VendeurNav() {
  const navigate = useNavigate()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white max-w-lg mx-auto z-50"
      style={{
        borderTop: '1px solid rgba(232,226,216,0.5)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}
    >
      {/* 2 + center + 2 : symétrie parfaite */}
      <div className="flex items-end pt-2 pb-2">

        <NavItem to="/vendeur"            label="Accueil"    Icon={IconHome} />
        <NavItem to="/vendeur/historique" label="Historique" Icon={IconClock} />

        {/* Bouton + central surélevé */}
        <button
          onClick={() => navigate('/vendeur/nouvelle-commande')}
          className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{
            backgroundColor: '#C8A96E',
            boxShadow: '0 6px 24px rgba(200,169,110,0.5)',
            transform: 'translateY(-14px)',
            marginBottom: -14,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
        </button>

        {/* Profil avec avatar */}
        <NavLink to="/vendeur/profil" end className="flex-1 flex flex-col items-center gap-0.5 pb-1 transition-colors">
          {({ isActive }) => (
            <>
              <span style={{ color: isActive ? '#C8A96E' : '#B0B0B0' }}>
                <AvatarIcon isActive={isActive} />
              </span>
              <span className="text-[10px] font-semibold mt-0.5" style={{ color: isActive ? '#C8A96E' : '#B0B0B0' }}>
                Profil
              </span>
              {isActive && <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: '#C8A96E' }} />}
            </>
          )}
        </NavLink>

        <NavItem to="/settings" label="Réglages" Icon={IconSettings} />

      </div>
    </nav>
  )
}

// ── Nav générique (pâtissière) ────────────────────────────────────────────
const navByRole = {
  patissiere: [
    { to: '/patissiere', label: 'Production', icon: '◈', end: true },
    { to: '/calendrier', label: 'Calendrier', icon: '▦', end: true },
  ],
  manager: [
    { to: '/manager',        label: 'Dashboard', icon: '◉', end: true },
    { to: '/manager/toutes', label: 'Toutes',    icon: '≡', end: true },
  ],
}

export default function BottomNav() {
  const { role } = useRole()
  const navigate = useNavigate()

  if (role === 'vendeur') return <VendeurNav />

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
