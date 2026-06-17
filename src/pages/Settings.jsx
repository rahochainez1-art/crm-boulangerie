import { useState, useEffect } from 'react'
import { format, parseISO, isSameMonth } from 'date-fns'
import { useRole } from '../context/RoleContext'
import { registerFCMToken, getDeviceId } from '../lib/notifications'
import { seedFakeOrders, subscribeOrders, clearAllOrders } from '../lib/orders'
import {
  getPrenom, savePrenom,
  getUrgencyHours, saveUrgencyHours,
  getSoundEnabled, saveSoundEnabled,
} from '../lib/settings'
import AppLayout from '../components/layout/AppLayout'

const ROLE_META = {
  vendeur:     { label: 'Vendeur·se',  bg: '#F2F6CC', color: '#4A4E10' },
  patissiere:  { label: 'Pâtissière',  bg: '#DCF0CC', color: '#1E3D0E' },
  manager:     { label: 'Manager',     bg: '#F8EDD4', color: '#5C3D0A' },
  boulangerie: { label: 'Boulangerie', bg: '#FFF0D9', color: '#7B4F1C' },
}

function safeNotifPermission() {
  try { return Notification?.permission ?? 'default' } catch { return 'default' }
}

export default function Settings() {
  const { role, clearRole } = useRole()
  const meta = ROLE_META[role] ?? ROLE_META.vendeur

  const [prenom, setPrenom]             = useState(() => getPrenom())
  const [prenomSaved, setPrenomSaved]   = useState(false)
  const [urgencyHours, setUrgencyHours] = useState(() => getUrgencyHours())
  const [soundEnabled, setSoundEnabled] = useState(() => getSoundEnabled())
  const [notifStatus, setNotifStatus]   = useState(safeNotifPermission)
  const [notifLoading, setNotifLoading] = useState(false)
  const [seeding, setSeeding]           = useState(false)
  const [clearing, setClearing]         = useState(false)
  const [csvLoading, setCsvLoading]     = useState(false)
  const [orders, setOrders]             = useState([])

  // Commandes disponibles pour l'export (manager uniquement)
  useEffect(() => {
    if (role !== 'manager') return
    return subscribeOrders(setOrders)
  }, [role])

  const handleSavePrenom = () => {
    savePrenom(prenom)
    setPrenomSaved(true)
    setTimeout(() => setPrenomSaved(false), 2000)
  }

  const handleUrgencyChange = (h) => {
    setUrgencyHours(h)
    saveUrgencyHours(h)
  }

  const handleSoundToggle = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    saveSoundEnabled(next)
  }

  const handleEnableNotifs = async () => {
    setNotifLoading(true)
    const token = await registerFCMToken(role, getDeviceId())
    setNotifStatus(safeNotifPermission())
    setNotifLoading(false)
    if (token) alert('Notifications activées ✓')
    else alert("Impossible d'activer les notifications. Vérifie les permissions de ton navigateur.")
  }

  const handleExportCSV = () => {
    setCsvLoading(true)
    try {
      const now = new Date()
      const monthOrders = orders
        .filter(o => o.pickupDate && isSameMonth(parseISO(o.pickupDate), now))
        .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))

      const rows = [
        ['Client', 'Téléphone', 'Articles', 'Date', 'Heure', 'Statut', 'Total (€)', 'Acompte (€)', 'Solde dû (€)', 'Notes'],
        ...monthOrders.map(o => {
          const d = parseISO(o.pickupDate)
          const reste = (o.totalAmount || 0) - (o.deposit || 0)
          return [
            o.clientName  ?? '',
            o.clientPhone ?? '',
            o.articles    ?? '',
            format(d, 'dd/MM/yyyy'),
            format(d, 'HH:mm'),
            o.status      ?? '',
            o.totalAmount ?? '',
            o.deposit     ?? '',
            reste > 0 ? reste : '',
            o.notes       ?? '',
          ]
        }),
      ]

      const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `commandes-${format(now, 'yyyy-MM')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setCsvLoading(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try { await seedFakeOrders(); alert('7 commandes test ajoutées ✓') }
    catch (e) { alert('Erreur : ' + e.message) }
    finally { setSeeding(false) }
  }

  const handleClearAll = async () => {
    const ok = window.confirm('Supprimer TOUTES les commandes ? Cette action est irréversible.')
    if (!ok) return
    setClearing(true)
    try {
      const n = await clearAllOrders()
      alert(`${n} commande${n > 1 ? 's' : ''} supprimée${n > 1 ? 's' : ''} ✓`)
    } catch (e) { alert('Erreur : ' + e.message) }
    finally { setClearing(false) }
  }

  const initiale = prenom.trim()[0]?.toUpperCase() ?? meta.label[0]
  const monthCount = orders.filter(o => o.pickupDate && isSameMonth(parseISO(o.pickupDate), new Date())).length

  return (
    <AppLayout title="Paramètres">
      <div className="space-y-4">

        {/* ── Mon profil ─────────────────────────────────────── */}
        <div className="bg-chalk border border-warm rounded-2xl p-4 space-y-4">
          <p className="label-xs">Mon profil</p>

          {/* Avatar + rôle */}
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: meta.bg }}
            >
              <span className="text-2xl font-bold" style={{ color: meta.color }}>
                {initiale}
              </span>
            </div>
            <div>
              <p className="font-semibold text-ink leading-tight">{prenom.trim() || 'Ton prénom'}</p>
              <p className="text-xs text-dust mt-0.5">{meta.label}</p>
            </div>
          </div>

          {/* Saisie prénom */}
          <div>
            <p className="text-xs text-dust mb-1.5">Prénom affiché</p>
            <div className="flex gap-2">
              <input
                value={prenom}
                onChange={e => { setPrenom(e.target.value); setPrenomSaved(false) }}
                onKeyDown={e => e.key === 'Enter' && handleSavePrenom()}
                placeholder="Ex. Sarah…"
                className="field flex-1"
                maxLength={30}
              />
              <button
                onClick={handleSavePrenom}
                className={`px-4 rounded-xl text-sm font-bold transition-all active:scale-95 flex-shrink-0 ${
                  prenomSaved ? 'bg-lime text-ink' : 'bg-ink text-chalk'
                }`}
              >
                {prenomSaved ? '✓' : 'OK'}
              </button>
            </div>
            {prenomSaved && (
              <p className="text-xs text-green-600 mt-1.5">Sauvegardé ✓ — l'accueil sera mis à jour</p>
            )}
          </div>
        </div>

        {/* ── Vue actuelle ───────────────────────────────────── */}
        <div className="bg-chalk border border-warm rounded-2xl p-4 space-y-3">
          <p className="label-xs">Vue actuelle</p>
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-3"
            style={{ backgroundColor: meta.bg }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}
            >
              <span className="text-sm font-bold" style={{ color: meta.color }}>{initiale}</span>
            </div>
            <p className="font-semibold text-ink">{meta.label}</p>
          </div>
          <button onClick={clearRole} className="btn-primary">
            Changer de rôle
          </button>
        </div>

        {/* ── Notifications ──────────────────────────────────── */}
        <div className="bg-chalk border border-warm rounded-2xl p-4 space-y-3">
          <p className="label-xs">Notifications</p>

          {notifStatus === 'granted' ? (
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />
              <p className="text-sm text-dust">Push activées</p>
            </div>
          ) : notifStatus === 'denied' ? (
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                <p className="text-sm text-dust">Notifications bloquées</p>
              </div>
              <p className="text-xs text-dust/60">Autorise les notifications dans les réglages de ton navigateur.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-dust mb-3">
                Reçois une alerte quand une commande passe au statut{' '}
                <span className="font-semibold text-ink">Prêt</span>.
              </p>
              <button onClick={handleEnableNotifs} disabled={notifLoading} className="btn-primary disabled:opacity-50">
                {notifLoading ? 'Activation...' : 'Activer les notifications'}
              </button>
            </div>
          )}

          {/* Sonnerie */}
          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: '1px solid rgba(232,226,216,0.6)' }}
          >
            <div>
              <p className="text-sm font-semibold text-ink">Sonnerie</p>
              <p className="text-xs text-dust mt-0.5">Son lors d'une notification</p>
            </div>
            <button
              onClick={handleSoundToggle}
              className="flex-shrink-0 relative"
              style={{ width: 48, height: 28 }}
            >
              <span
                className="absolute inset-0 rounded-full transition-colors duration-200"
                style={{ backgroundColor: soundEnabled ? '#1A1A1A' : '#E8E2D8' }}
              />
              <span
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200"
                style={{ left: 1, transform: soundEnabled ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>
        </div>

        {/* ── Production — pâtissière / boulangerie ──────────── */}
        {(role === 'patissiere' || role === 'boulangerie') && (
          <div className="bg-chalk border border-warm rounded-2xl p-4 space-y-3">
            <p className="label-xs">Production</p>
            <div>
              <p className="text-sm font-semibold text-ink mb-0.5">Délai alerte urgence</p>
              <p className="text-xs text-dust mb-3">Une commande passe en rouge à moins de…</p>
              <div className="grid grid-cols-3 gap-2">
                {[24, 48, 72].map(h => (
                  <button
                    key={h}
                    onClick={() => handleUrgencyChange(h)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all active:scale-95 border ${
                      urgencyHours === h
                        ? 'bg-ink text-chalk border-ink'
                        : 'bg-parchment text-dust border-warm'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Export + Gestion — manager ─────────────────────── */}
        {role === 'manager' && (
          <div className="bg-chalk border border-warm rounded-2xl p-4 space-y-3">
            <p className="label-xs">Export</p>
            <div>
              <p className="text-sm font-semibold text-ink mb-0.5">Commandes du mois en cours</p>
              <p className="text-xs text-dust mb-3">
                Télécharge un fichier CSV compatible Excel avec toutes les commandes du mois.
              </p>
              <button
                onClick={handleExportCSV}
                disabled={csvLoading || monthCount === 0}
                className="w-full py-3 rounded-xl font-bold text-sm bg-ink text-chalk active:opacity-80 disabled:opacity-40 transition-opacity"
              >
                {csvLoading
                  ? 'Export en cours…'
                  : monthCount === 0
                  ? 'Aucune commande ce mois'
                  : `↓ Exporter CSV — ${monthCount} commande${monthCount > 1 ? 's' : ''}`}
              </button>
            </div>

            {/* Suppression globale */}
            <div style={{ borderTop: '1px solid rgba(232,226,216,0.6)', paddingTop: '0.75rem' }}>
              <p className="text-sm font-semibold text-ink mb-0.5">Réinitialiser</p>
              <p className="text-xs text-dust mb-3">
                Supprime définitivement toutes les commandes de la plateforme.
              </p>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="w-full py-3 rounded-xl font-bold text-sm active:opacity-80 disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
              >
                {clearing ? 'Suppression...' : '✕ Tout supprimer'}
              </button>
            </div>
          </div>
        )}

        {/* ── Application ────────────────────────────────────── */}
        <div className="bg-chalk border border-warm rounded-2xl p-4">
          <p className="label-xs mb-3">Application</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dust">Boulangerie</span>
              <span className="font-semibold text-ink">Au Grand Jour</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dust">Version</span>
              <span className="font-semibold text-ink">1.0.0</span>
            </div>
          </div>
        </div>

        {/* ── Dev — masqué en production ─────────────────────── */}
        {import.meta.env.DEV && (
          <div className="bg-amber-50/40 border border-dashed border-amber-200 rounded-2xl p-4">
            <p className="label-xs text-amber-700/60 mb-3">Dev — données test</p>
            <p className="text-xs text-amber-800/70 mb-4">
              Injecte 7 fausses commandes (aujourd'hui, demain, après-demain) avec statuts variés.
            </p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="w-full py-3 rounded-xl font-bold text-sm bg-amber-100 text-amber-800 border border-amber-200 active:opacity-70 disabled:opacity-50"
            >
              {seeding ? 'Injection...' : 'Injecter des commandes test'}
            </button>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
