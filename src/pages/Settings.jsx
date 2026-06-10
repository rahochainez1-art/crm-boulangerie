import { useState } from 'react'
import { useRole } from '../context/RoleContext'
import { registerFCMToken, getDeviceId } from '../lib/notifications'
import { seedFakeOrders } from '../lib/orders'
import AppLayout from '../components/layout/AppLayout'

const ROLE_LABELS = {
  vendeur: 'Vendeur·se',
  patissiere: 'Pâtissière',
  manager: 'Manager',
}

const ROLE_ICONS = {
  vendeur: '🛍️',
  patissiere: '🍰',
  manager: '◉',
}

function safeNotifPermission() {
  try { return Notification?.permission ?? 'default' } catch { return 'default' }
}

export default function Settings() {
  const { role, clearRole } = useRole()
  const [notifStatus, setNotifStatus] = useState(safeNotifPermission)
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const handleSeed = async () => {
    setSeeding(true)
    try { await seedFakeOrders(); alert('7 commandes test ajoutées ✓') }
    catch (e) { alert('Erreur : ' + e.message) }
    finally { setSeeding(false) }
  }

  const handleEnableNotifs = async () => {
    setLoading(true)
    const token = await registerFCMToken(role, getDeviceId())
    setNotifStatus(Notification?.permission ?? 'default')
    setLoading(false)
    if (token) {
      alert('Notifications activées ✓')
    } else {
      alert('Impossible d\'activer les notifications. Vérifie les permissions de ton navigateur.')
    }
  }

  return (
    <AppLayout title="Paramètres">
      <div className="space-y-4">

        {/* Changer de rôle — mis en avant */}
        <div className="bg-vanilla rounded-3xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-eerie/50 mb-3">
            Vue actuelle
          </p>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{ROLE_ICONS[role]}</span>
            <p className="text-xl font-bold text-eerie">{ROLE_LABELS[role]}</p>
          </div>
          <button
            onClick={clearRole}
            className="btn-primary"
          >
            Changer de rôle
          </button>
        </div>

        {/* Notifications */}
        <div className="card">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-eerie/40 mb-3">
            Notifications push
          </p>
          {notifStatus === 'granted' ? (
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <p className="text-sm text-eerie/70">Notifications activées</p>
            </div>
          ) : notifStatus === 'denied' ? (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <p className="text-sm text-eerie/70">Notifications bloquées</p>
              </div>
              <p className="text-xs text-eerie/40">
                Autorise les notifications dans les réglages de ton navigateur.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-eerie/60 mb-4">
                Reçois une alerte quand une commande passe au statut{' '}
                <span className="font-medium text-eerie">Prêt</span>.
              </p>
              <button
                onClick={handleEnableNotifs}
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Activation...' : 'Activer les notifications'}
              </button>
            </div>
          )}
        </div>

        {/* Dev — données de test */}
        <div className="card border-dashed border-amber-200 bg-amber-50/40">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700/60 mb-3">
            Dev — données test
          </p>
          <p className="text-xs text-amber-800/70 mb-4">
            Injecte 7 fausses commandes (aujourd'hui, demain, après-demain) avec des statuts variés.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="w-full py-3 rounded-xl font-bold text-sm bg-amber-100 text-amber-800 border border-amber-200 active:opacity-70 disabled:opacity-50"
          >
            {seeding ? 'Injection...' : 'Injecter des commandes test'}
          </button>
        </div>

        {/* Infos */}
        <div className="card">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-eerie/40 mb-3">
            Application
          </p>
          <div className="space-y-2 text-sm text-eerie/60">
            <div className="flex justify-between">
              <span>Boulangerie</span>
              <span className="font-medium text-eerie">Au Grand Jour</span>
            </div>
            <div className="flex justify-between">
              <span>Version</span>
              <span className="font-medium text-eerie">1.0.0</span>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
