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
  vendeur:     { label: 'Vendeur·se',  bg: '#F7F4C8', color: '#4A4E10' },
  patissiere:  { label: 'Pâtissière',  bg: '#DCFCE7', color: '#166534' },
  manager:     { label: 'Manager',     bg: '#F7F4C8', color: '#18181B' },
  boulangerie: { label: 'Boulangerie', bg: '#FEF3C7', color: '#92400E' },
}

function safeNotifPermission() {
  try { return Notification?.permission ?? 'default' } catch { return 'default' }
}

function Section({ title, children }) {
  return (
    <div
      className="rounded-3xl p-5 space-y-4 animate-fade-up"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E5E4', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
    >
      <p className="label-xs">{title}</p>
      {children}
    </div>
  )
}

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="flex-shrink-0 relative"
      style={{ width: 48, height: 28 }}
    >
      <span
        className="absolute inset-0 rounded-full transition-colors duration-200"
        style={{ backgroundColor: enabled ? '#18181B' : '#E7E5E4' }}
      />
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200"
        style={{ left: 1, transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
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
    else alert("Impossible d'activer les notifications. Vérifie les permissions.")
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
          const d     = parseISO(o.pickupDate)
          const reste = (o.totalAmount || 0) - (o.deposit || 0)
          return [
            o.clientName  ?? '', o.clientPhone ?? '', o.articles ?? '',
            format(d, 'dd/MM/yyyy'), format(d, 'HH:mm'), o.status ?? '',
            o.totalAmount ?? '', o.deposit ?? '', reste > 0 ? reste : '', o.notes ?? '',
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

  const initiale  = prenom.trim()[0]?.toUpperCase() ?? meta.label[0]
  const monthCount = orders.filter(o => o.pickupDate && isSameMonth(parseISO(o.pickupDate), new Date())).length

  return (
    <AppLayout title="Paramètres">
      <div className="space-y-4">

        {/* ── Mon profil ─────────────────────────────────────── */}
        <Section title="Mon profil">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: meta.bg }}
            >
              <span className="text-2xl font-bold" style={{ color: meta.color }}>{initiale}</span>
            </div>
            <div>
              <p className="font-semibold text-ink leading-tight">{prenom.trim() || 'Ton prénom'}</p>
              <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>{meta.label}</p>
            </div>
          </div>

          <div>
            <p className="text-xs mb-2" style={{ color: '#71717A' }}>Prénom affiché</p>
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
                className="px-4 rounded-2xl text-sm font-semibold transition-all active:scale-95 flex-shrink-0"
                style={{
                  backgroundColor: prenomSaved ? '#DCFCE7' : '#18181B',
                  color: prenomSaved ? '#166534' : '#FFFFFF',
                  minWidth: 52,
                }}
              >
                {prenomSaved ? '✓' : 'OK'}
              </button>
            </div>
            {prenomSaved && (
              <p className="text-xs mt-1.5" style={{ color: '#22C55E' }}>Sauvegardé ✓</p>
            )}
          </div>
        </Section>

        {/* ── Vue actuelle ───────────────────────────────────── */}
        <Section title="Vue actuelle">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ backgroundColor: meta.bg }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
            >
              <span className="text-sm font-bold" style={{ color: meta.color }}>{initiale}</span>
            </div>
            <p className="font-semibold text-ink">{meta.label}</p>
          </div>
          <button onClick={clearRole} className="btn-primary">
            Changer de rôle
          </button>
        </Section>

        {/* ── Notifications ──────────────────────────────────── */}
        <Section title="Notifications">
          {notifStatus === 'granted' ? (
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22C55E' }} />
              <p className="text-sm" style={{ color: '#71717A' }}>Push activées</p>
            </div>
          ) : notifStatus === 'denied' ? (
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#EF4444' }} />
                <p className="text-sm" style={{ color: '#71717A' }}>Notifications bloquées</p>
              </div>
              <p className="text-xs" style={{ color: '#A1A1AA' }}>Autorise-les dans les réglages de ton navigateur.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-3" style={{ color: '#71717A' }}>
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
            className="flex items-center justify-between pt-4"
            style={{ borderTop: '1px solid #F1EFE8' }}
          >
            <div>
              <p className="text-sm font-semibold text-ink">Sonnerie</p>
              <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>Son lors d'une nouvelle commande</p>
            </div>
            <Toggle enabled={soundEnabled} onToggle={handleSoundToggle} />
          </div>
        </Section>

        {/* ── Production (pâtissière / boulangerie) ──────────── */}
        {(role === 'patissiere' || role === 'boulangerie') && (
          <Section title="Production">
            <div>
              <p className="text-sm font-semibold text-ink mb-0.5">Délai alerte urgence</p>
              <p className="text-xs mb-4" style={{ color: '#71717A' }}>Une commande passe en rouge à moins de…</p>
              <div className="grid grid-cols-3 gap-2">
                {[24, 48, 72].map(h => (
                  <button
                    key={h}
                    onClick={() => handleUrgencyChange(h)}
                    className="py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                    style={{
                      backgroundColor: urgencyHours === h ? '#18181B' : '#F1EFE8',
                      color:           urgencyHours === h ? '#FFFFFF'  : '#71717A',
                      border:          urgencyHours === h ? 'none'     : '1px solid #E7E5E4',
                    }}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* ── Export + réinitialisation (manager) ────────────── */}
        {role === 'manager' && (
          <Section title="Données">
            <div>
              <p className="text-sm font-semibold text-ink mb-0.5">Export CSV</p>
              <p className="text-xs mb-4" style={{ color: '#71717A' }}>
                Commandes du mois en cours — compatible Excel.
              </p>
              <button
                onClick={handleExportCSV}
                disabled={csvLoading || monthCount === 0}
                className="btn-primary disabled:opacity-40"
              >
                {csvLoading ? 'Export en cours…' : monthCount === 0 ? 'Aucune commande ce mois' : `↓ Exporter — ${monthCount} commande${monthCount > 1 ? 's' : ''}`}
              </button>
            </div>

            <div style={{ borderTop: '1px solid #F1EFE8', paddingTop: '1rem' }}>
              <p className="text-sm font-semibold text-ink mb-0.5">Réinitialiser</p>
              <p className="text-xs mb-4" style={{ color: '#71717A' }}>
                Supprime définitivement toutes les commandes.
              </p>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="w-full py-3 rounded-2xl text-sm font-semibold active:opacity-80 disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: '#FEE2E2', color: '#b91c1c', border: '1px solid #FECACA' }}
              >
                {clearing ? 'Suppression...' : '✕ Tout supprimer'}
              </button>
            </div>
          </Section>
        )}

        {/* ── Application ────────────────────────────────────── */}
        <Section title="Application">
          <div className="space-y-2.5 text-sm">
            {[
              { label: 'Boulangerie', value: 'Au Grand Jour' },
              { label: 'Version',     value: '1.0.0' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span style={{ color: '#71717A' }}>{row.label}</span>
                <span className="font-semibold text-ink">{row.value}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Dev (local uniquement) ─────────────────────────── */}
        {import.meta.env.DEV && (
          <div
            className="rounded-3xl p-5"
            style={{ backgroundColor: '#FFFBEB', border: '1px dashed #FDE68A' }}
          >
            <p className="label-xs mb-1" style={{ color: '#92400E' }}>Dev · données test</p>
            <p className="text-xs mb-4" style={{ color: '#92400E', opacity: 0.7 }}>
              Injecte 7 fausses commandes avec statuts variés.
            </p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="w-full py-3 rounded-2xl text-sm font-semibold active:opacity-70 disabled:opacity-50"
              style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}
            >
              {seeding ? 'Injection...' : 'Injecter des commandes test'}
            </button>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
