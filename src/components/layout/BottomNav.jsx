import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useRole } from '../../context/RoleContext'

const ACTIVE   = '#111111'
const INACTIVE = '#B0A090'

// ── Icônes ────────────────────────────────────────────────────────────────
const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)
const IconList = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6"  x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6"  x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const IconArchive = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/>
    <rect x="1" y="3" width="22" height="5"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
)
const IconUser = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

// ── Enveloppe nav commune (glass morphism) ────────────────────────────────
function NavShell({ children }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="max-w-lg mx-auto"
        style={{
          borderTop: '1px solid rgba(67,47,46,0.08)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 6px)',
        }}
      >
        <div className="flex items-end pt-3 pb-1">
          {children}
        </div>
      </div>
    </nav>
  )
}

// ── Item de navigation ────────────────────────────────────────────────────
function NavItem({ to, label, Icon, end = false }) {
  return (
    <NavLink to={to} end={end} className="flex-1 flex flex-col items-center gap-0.5 pb-1 transition-colors">
      {({ isActive }) => (
        <>
          <span style={{ color: isActive ? ACTIVE : INACTIVE }}>
            <Icon />
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? ACTIVE : INACTIVE,
              fontFamily: 'Satoshi, sans-serif',
              letterSpacing: '0.01em',
            }}
          >
            {label}
          </span>
          <span
            style={{
              width: isActive ? 16 : 0,
              height: 2,
              borderRadius: 9999,
              backgroundColor: '#432F2E',
              marginTop: 2,
              transition: 'width 0.2s cubic-bezier(0.16,1,0.3,1)',
              display: 'block',
            }}
          />
        </>
      )}
    </NavLink>
  )
}

// ── FAB central ──────────────────────────────────────────────────────────
function PlusButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform"
      style={{
        backgroundColor: '#432F2E',
        boxShadow: '0 8px 24px rgba(67,47,46,0.35)',
        transform: 'translateY(-14px)',
        marginBottom: -14,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5"  y1="12" x2="19" y2="12"/>
      </svg>
    </button>
  )
}

// ── Avatar synchronisé ────────────────────────────────────────────────────
function AvatarIcon({ isActive }) {
  const [avatar, setAvatar] = useState(() => localStorage.getItem('agj_profil_avatar'))

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
        src={avatar} alt=""
        className="rounded-full object-cover"
        style={{
          width: 24, height: 24,
          border: isActive ? '2px solid #432F2E' : '2px solid transparent',
          outline: 'none',
          outlineOffset: 1,
        }}
      />
    )
  }
  return <IconUser />
}

// ── Nav vendeur ───────────────────────────────────────────────────────────
function VendeurNav() {
  const navigate = useNavigate()
  return (
    <NavShell>
      <NavItem to="/vendeur"             label="Accueil"    Icon={IconHome} end />
      <NavItem to="/vendeur/historique"  label="Historique" Icon={IconArchive} />
      <PlusButton onClick={() => navigate('/vendeur/nouvelle-commande')} />
      <NavLink to="/vendeur/profil" end className="flex-1 flex flex-col items-center gap-0.5 pb-1 transition-colors">
        {({ isActive }) => (
          <>
            <span style={{ color: isActive ? ACTIVE : INACTIVE }}>
              <AvatarIcon isActive={isActive} />
            </span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? ACTIVE : INACTIVE, fontFamily: 'Satoshi, sans-serif', letterSpacing: '0.01em' }}>
              Profil
            </span>
            <span style={{ width: isActive ? 16 : 0, height: 2, borderRadius: 9999, backgroundColor: '#432F2E', marginTop: 2, transition: 'width 0.2s cubic-bezier(0.16,1,0.3,1)', display: 'block' }} />
          </>
        )}
      </NavLink>
      <NavItem to="/settings" label="Réglages" Icon={IconSettings} />
    </NavShell>
  )
}

// ── Nav pâtissière ────────────────────────────────────────────────────────
function PatissiereNav() {
  return (
    <NavShell>
      <NavItem to="/patissiere"            label="Accueil"   Icon={IconHome}    end />
      <NavItem to="/calendrier"            label="Planning"  Icon={IconList} />
      <NavItem to="/patissiere/historique" label="Commandes" Icon={IconArchive} />
      <NavItem to="/settings"              label="Réglages"  Icon={IconSettings} />
    </NavShell>
  )
}

// ── Nav boulangerie ───────────────────────────────────────────────────────
const NAV_BOULANGERIE = [
  { to: '/boulangerie', label: 'Production', Icon: IconHome, end: true },
  { to: '/calendrier',  label: 'Calendrier', Icon: IconList, end: true },
  { to: '/settings',    label: 'Réglages',   Icon: IconSettings, end: false },
]

function BoulangerieNav() {
  return (
    <NavShell>
      {NAV_BOULANGERIE.map(n => (
        <NavItem key={n.to} to={n.to} label={n.label} Icon={n.Icon} end={n.end} />
      ))}
    </NavShell>
  )
}

// ── Export ────────────────────────────────────────────────────────────────
export default function BottomNav() {
  const { role } = useRole()
  if (role === 'vendeur')     return <VendeurNav />
  if (role === 'patissiere')  return <PatissiereNav />
  if (role === 'boulangerie') return <BoulangerieNav />
  return null
}
