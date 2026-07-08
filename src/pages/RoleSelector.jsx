import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Cake, BarChart3, Croissant, Bell, Settings, HelpCircle, Users } from 'lucide-react'
import { useRole } from '../context/RoleContext'
import HeaderBrand from '../components/ui/HeaderBrand'
import HeroIllustration from '../components/ui/HeroIllustration'
import RoleCard from '../components/ui/RoleCard'

const HOME = {
  vendeur:     '/vendeur',
  patissiere:  '/patissiere',
  manager:     '/manager',
  boulangerie: '/boulangerie',
}

const ROLES = [
  {
    id:          'vendeur',
    label:       'Vendeuse',
    description: 'Prendre une commande et voir les retraits du jour.',
    icon:        ShoppingBag,
    iconBg:      '#FFF0B5',
    iconColor:   '#432F2E',
    isHighlighted: true,
  },
  {
    id:          'patissiere',
    label:       'Pâtissière',
    description: 'Suivre la production et changer les statuts.',
    icon:        Cake,
    iconBg:      '#432F2E',
    iconColor:   '#FFFCF7',
  },
  {
    id:          'manager',
    label:       'Manager',
    description: 'Vue globale, modifications et statistiques.',
    icon:        BarChart3,
    iconBg:      '#F5F2EC',
    iconColor:   '#432F2E',
  },
  {
    id:          'boulangerie',
    label:       'Boulangerie',
    description: 'Commandes assignées au pôle boulangerie.',
    icon:        Croissant,
    iconBg:      '#E5F0F5',
    iconColor:   '#432F2E',
  },
]

export default function RoleSelector() {
  const { setRole } = useRole()
  const navigate    = useNavigate()

  const select = (id) => { setRole(id); navigate(HOME[id]) }

  return (
    <div
      className="min-h-dvh"
      style={{
        backgroundColor: '#F5F2EC',
        backgroundImage: 'radial-gradient(circle at 15% 0%, rgba(255,240,181,0.35) 0%, transparent 45%), radial-gradient(circle at 100% 20%, rgba(229,240,245,0.5) 0%, transparent 40%)',
      }}
    >
      <div
        className="flex flex-col mx-auto px-6"
        style={{
          maxWidth: 460,
          paddingTop: 'max(32px, env(safe-area-inset-top))',
          paddingBottom: 32,
        }}
      >

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="mb-8 animate-fade-up">
          <HeaderBrand
            right={
              <>
                <div
                  className="hidden sm:flex items-center gap-1.5"
                  style={{ border: '1px solid rgba(67,47,46,0.14)', borderRadius: 9999, padding: '0.5rem 0.875rem' }}
                >
                  <Users size={15} color="#432F2E" strokeWidth={1.8} />
                  <span style={{ fontSize: '0.75rem', color: '#432F2E', fontWeight: 600, fontFamily: 'Satoshi', whiteSpace: 'nowrap' }}>
                    {ROLES.length} espaces disponibles
                  </span>
                </div>
                <div
                  className="flex items-center justify-center"
                  style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: '#432F2E', flexShrink: 0 }}
                >
                  <HelpCircle size={18} color="#FFFCF7" strokeWidth={1.8} />
                </div>
              </>
            }
          />
        </div>

        {/* ── Hero ────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-10 animate-fade-up">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{ position: 'absolute', top: -10, left: -18, display: 'flex', gap: 3 }}>
                <span style={{ width: 2, height: 14, borderRadius: 2, backgroundColor: '#EDD83D', transform: 'rotate(-18deg)' }} />
                <span style={{ width: 2, height: 20, borderRadius: 2, backgroundColor: '#EDD83D', transform: 'rotate(-18deg)' }} />
                <span style={{ width: 2, height: 14, borderRadius: 2, backgroundColor: '#EDD83D', transform: 'rotate(-18deg)' }} />
              </div>
              <h1
                className="font-editorial"
                style={{ fontSize: 'clamp(2.75rem, 9vw, 3.5rem)', fontWeight: 700, color: '#211817', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 10 }}
              >
                Bonjour.
              </h1>
              <span style={{ display: 'block', width: 96, height: 5, borderRadius: 9999, backgroundColor: '#FFF0B5', marginBottom: 18 }} />
            </div>
            <p style={{ fontSize: '1rem', color: '#6D6258', fontFamily: 'Satoshi', lineHeight: 1.55 }}>
              Gérez vos commandes spéciales avec{' '}
              <strong style={{ color: '#211817', fontWeight: 700 }}>clarté</strong>,{' '}
              <strong style={{ color: '#211817', fontWeight: 700 }}>rapidité</strong> et{' '}
              <strong style={{ color: '#211817', fontWeight: 700 }}>sérénité</strong>.
            </p>
          </div>

          <div className="flex-shrink-0" style={{ width: 'clamp(132px, 36vw, 184px)', height: 'clamp(157px, 43vw, 219px)' }}>
            <HeroIllustration />
          </div>
        </div>

        {/* ── Label de section ────────────────────────────────── */}
        <div className="mb-4 animate-fade-up">
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#432F2E', fontFamily: 'Satoshi', letterSpacing: '0.14em' }}>
            SÉLECTIONNEZ VOTRE ESPACE
          </p>
          <span style={{ display: 'block', width: 28, height: 2, backgroundColor: 'rgba(67,47,46,0.25)', marginTop: 8, borderRadius: 2 }} />
        </div>

        {/* ── Cartes de rôle ──────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {ROLES.map((r) => (
            <RoleCard
              key={r.id}
              title={r.label}
              description={r.description}
              icon={r.icon}
              iconBg={r.iconBg}
              iconColor={r.iconColor}
              isHighlighted={r.isHighlighted}
              onClick={() => select(r.id)}
            />
          ))}
        </div>

        {/* ── Bannière notification ───────────────────────────── */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 text-left animate-fade-up"
          style={{ backgroundColor: '#E5F0F5', borderRadius: 18, padding: '16px 18px', marginTop: 20 }}
        >
          <div
            className="flex items-center justify-center"
            style={{ width: 38, height: 38, borderRadius: 9999, backgroundColor: '#432F2E', flexShrink: 0 }}
          >
            <Bell size={17} color="#FFFCF7" strokeWidth={1.8} />
          </div>
          <p style={{ flex: 1, fontSize: '0.8125rem', color: '#211817', fontFamily: 'Satoshi', lineHeight: 1.45 }}>
            Restez informé des nouvelles commandes et des mises à jour importantes.
          </p>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

        {/* ── Réglages ────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center justify-center gap-1.5"
          style={{ marginTop: 24, fontSize: '0.875rem', color: '#6D6258', fontFamily: 'Satoshi', fontWeight: 600 }}
        >
          <Settings size={16} strokeWidth={1.8} />
          <span>Réglages</span>
        </button>

      </div>
    </div>
  )
}
