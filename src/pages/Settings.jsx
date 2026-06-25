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

const ROLE_META = {
  vendeur:     { label: 'Vendeur·se',  bg: '#F0EBD0', color: '#432F2E' },
  patissiere:  { label: 'Pâtissière',  bg: '#DCFCE7', color: '#166534' },
  manager:     { label: 'Manager',     bg: '#E5F0F5', color: '#1D4E6B' },
  boulangerie: { label: 'Boulangerie', bg: '#FEF3C7', color: '#92400E' },
}

function safeNotifPermission() {
  try { return Notification?.permission ?? 'default' } catch { return 'default' }
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
        style={{ backgroundColor: enabled ? '#432F2E' : 'rgba(67,47,46,0.15)' }}
      />
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ left: 1, transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function Row({ label, hint, children, noBorder = false }) {
  return (
    <div
      className="flex items-center gap-3 py-3.5 px-4"
      style={{ borderBottom: noBorder ? 'none' : '1px solid rgba(67,47,46,0.06)' }}
    >
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#111111', fontFamily: 'Satoshi' }}>
          {label}
        </p>
        {hint && (
          <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 1 }}>
            {hint}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center">{children}</div>
    </div>
  )
}

function Group({ title, children }) {
  return (
    <div>
      {title && (
        <p
          className="px-1 mb-2"
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: '#8A7060',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: 'Satoshi',
          }}
        >
          {title}
        </p>
      )}
      <div
        className="overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 18,
          border: '1px solid rgba(67,47,46,0.07)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(67,47,46,0.04)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function SmallButton({ onClick, disabled, danger, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: danger ? '#b91c1c' : '#432F2E',
        padding: '0.3rem 0.875rem',
        borderRadius: 9999,
        backgroundColor: danger ? '#FEE2E2' : 'rgba(67,47,46,0.07)',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'Satoshi',
        opacity: disabled ? 0.45 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {children}
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

  const initiale   = prenom.trim()[0]?.toUpperCase() ?? meta.label[0]
  const monthCount = orders.filter(o => o.pickupDate && isSameMonth(parseISO(o.pickupDate), new Date())).length

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#F5F2EB' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        className="px-5 pb-5"
        style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}
      >
        <h1
          className="font-display animate-fade-up"
          style={{ fontSize: '1.625rem', color: '#111111', letterSpacing: '-0.025em', lineHeight: 1.15 }}
        >
          Réglages
        </h1>
      </header>

      <main className="flex-1 px-4 pb-28 overflow-y-auto space-y-5">

        {/* ── Profil hero ─────────────────────────────────────── */}
        <div
          className="flex items-center gap-4 px-4 py-4 rounded-2xl animate-fade-up"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(67,47,46,0.07)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(67,47,46,0.04)',
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: meta.bg }}
          >
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: meta.color, fontFamily: 'Satoshi' }}>
              {initiale}
            </span>
          </div>
          <div>
            <p style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi', lineHeight: 1.2 }}>
              {prenom.trim() || 'Mon profil'}
            </p>
            <span
              style={{
                display: 'inline-block',
                marginTop: 5,
                padding: '0.15rem 0.6rem',
                borderRadius: 9999,
                backgroundColor: meta.bg,
                color: meta.color,
                fontSize: '0.6875rem',
                fontWeight: 700,
                fontFamily: 'Satoshi',
                letterSpacing: '0.01em',
              }}
            >
              {meta.label}
            </span>
          </div>
        </div>

        {/* ── Préférences ────────────────────────────────────── */}
        <Group title="Préférences">
          {/* Prénom */}
          <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(67,47,46,0.06)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A7060', fontFamily: 'Satoshi', marginBottom: 8 }}>
              Prénom affiché
            </p>
            <div className="flex gap-2">
              <input
                value={prenom}
                onChange={e => { setPrenom(e.target.value); setPrenomSaved(false) }}
                onKeyDown={e => e.key === 'Enter' && handleSavePrenom()}
                placeholder="Ex. Sarah…"
                className="field flex-1"
                style={{ padding: '0.625rem 0.875rem', fontSize: '0.9375rem' }}
                maxLength={30}
              />
              <button
                onClick={handleSavePrenom}
                className="flex-shrink-0 px-4 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{
                  backgroundColor: prenomSaved ? '#D1FAE5' : '#432F2E',
                  color: prenomSaved ? '#166534' : '#FFFFFF',
                  minWidth: 48,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Satoshi',
                  fontWeight: 600,
                }}
              >
                {prenomSaved ? '✓' : 'OK'}
              </button>
            </div>
          </div>

          {/* Sonnerie */}
          <Row label="Sonnerie" hint="Son lors d'une nouvelle commande" noBorder>
            <Toggle enabled={soundEnabled} onToggle={handleSoundToggle} />
          </Row>
        </Group>

        {/* ── Mode ───────────────────────────────────────────── */}
        <Group title="Mode">
          <Row label="Vue actuelle" noBorder>
            <div className="flex items-center gap-2">
              <span
                style={{
                  padding: '0.2rem 0.625rem',
                  borderRadius: 9999,
                  backgroundColor: meta.bg,
                  color: meta.color,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  fontFamily: 'Satoshi',
                }}
              >
                {meta.label}
              </span>
              <SmallButton onClick={clearRole}>Changer</SmallButton>
            </div>
          </Row>
        </Group>

        {/* ── Notifications ──────────────────────────────────── */}
        <Group title="Notifications">
          <Row
            label="Notifications push"
            hint={
              notifStatus === 'granted' ? 'Activées sur cet appareil' :
              notifStatus === 'denied'  ? 'Bloquées — autorise dans les réglages du navigateur' :
              'Alerte quand une commande est prête'
            }
            noBorder
          >
            {notifStatus === 'granted' ? (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#22C55E', display: 'block' }} />
            ) : notifStatus === 'denied' ? (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#EF4444', display: 'block' }} />
            ) : (
              <SmallButton onClick={handleEnableNotifs} disabled={notifLoading}>
                {notifLoading ? '...' : 'Activer'}
              </SmallButton>
            )}
          </Row>
        </Group>

        {/* ── Production ─────────────────────────────────────── */}
        {(role === 'patissiere' || role === 'boulangerie') && (
          <Group title="Production">
            <div className="px-4 py-3.5">
              <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#111111', fontFamily: 'Satoshi', marginBottom: 4 }}>
                Délai alerte urgence
              </p>
              <p style={{ fontSize: '0.75rem', color: '#8A7060', fontFamily: 'Satoshi', marginBottom: 12 }}>
                Une commande passe en rouge à moins de…
              </p>
              <div className="flex gap-2">
                {[24, 48, 72].map(h => (
                  <button
                    key={h}
                    onClick={() => handleUrgencyChange(h)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                    style={{
                      backgroundColor: urgencyHours === h ? '#432F2E' : 'rgba(67,47,46,0.07)',
                      color:           urgencyHours === h ? '#FFFFFF'  : '#8A7060',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Satoshi',
                    }}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </Group>
        )}

        {/* ── Données (manager) ──────────────────────────────── */}
        {role === 'manager' && (
          <Group title="Données">
            <Row
              label="Export CSV"
              hint={monthCount > 0 ? `${monthCount} commande${monthCount > 1 ? 's' : ''} ce mois` : 'Aucune commande ce mois'}
            >
              <SmallButton onClick={handleExportCSV} disabled={csvLoading || monthCount === 0}>
                {csvLoading ? '...' : '↓ Exporter'}
              </SmallButton>
            </Row>
            <Row label="Réinitialiser" hint="Supprime toutes les commandes" noBorder>
              <SmallButton onClick={handleClearAll} disabled={clearing} danger>
                {clearing ? '...' : 'Supprimer'}
              </SmallButton>
            </Row>
          </Group>
        )}

        {/* ── Application ────────────────────────────────────── */}
        <Group title="Application">
          <Row label="Boulangerie">
            <span style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>Au Grand Jour</span>
          </Row>
          <Row label="Version" noBorder>
            <span style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>1.0.0</span>
          </Row>
        </Group>

        {/* ── Dev ────────────────────────────────────────────── */}
        {import.meta.env.DEV && (
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: '#FFFBEB', border: '1px dashed #FDE68A' }}
          >
            <p style={{
              fontSize: '0.6875rem', fontWeight: 700, color: '#92400E',
              letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Satoshi', marginBottom: 6,
            }}>
              Dev · données test
            </p>
            <p style={{ fontSize: '0.75rem', color: '#92400E', opacity: 0.7, fontFamily: 'Satoshi', marginBottom: 12 }}>
              Injecte 7 fausses commandes avec statuts variés.
            </p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="w-full py-2.5 rounded-xl text-sm font-semibold active:opacity-70 disabled:opacity-50"
              style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontFamily: 'Satoshi' }}
            >
              {seeding ? 'Injection...' : 'Injecter des commandes test'}
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
