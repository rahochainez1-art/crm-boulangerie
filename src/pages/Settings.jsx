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
      style={{ width: 50, height: 30 }}
    >
      <span className="absolute inset-0 rounded-full transition-colors duration-200" style={{ backgroundColor: enabled ? '#432F2E' : 'rgba(67,47,46,0.15)' }} />
      <span className="absolute top-[3px] w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200" style={{ left: 2, transform: enabled ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  )
}

function IconBadge({ children, bg = '#FFF0B5' }) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center"
      style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: bg }}
    >
      {children}
    </div>
  )
}

const Chevron = ({ color = '#C0B8A8' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M9 18l6-6-6-6"/>
  </svg>
)

function Divider() {
  return <div style={{ height: 1, backgroundColor: 'rgba(67,47,46,0.06)', margin: '0 16px' }} />
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#8A7060', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Satoshi', paddingLeft: 4, marginBottom: 8 }}>
      {children}
    </p>
  )
}

function SectionCard({ children, bg = '#FFFFFF', border = 'rgba(67,47,46,0.07)' }) {
  return (
    <div style={{ backgroundColor: bg, borderRadius: 22, border: `1px solid ${border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {children}
    </div>
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

  const handleUrgencyChange = (h) => { setUrgencyHours(h); saveUrgencyHours(h) }

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
          const d = parseISO(o.pickupDate)
          const reste = (o.totalAmount || 0) - (o.deposit || 0)
          return [o.clientName ?? '', o.clientPhone ?? '', o.articles ?? '', format(d, 'dd/MM/yyyy'), format(d, 'HH:mm'), o.status ?? '', o.totalAmount ?? '', o.deposit ?? '', reste > 0 ? reste : '', o.notes ?? '']
        }),
      ]
      const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `commandes-${format(now, 'yyyy-MM')}.csv`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally { setCsvLoading(false) }
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
      <header className="px-5 pb-5" style={{ paddingTop: 'max(52px, env(safe-area-inset-top))' }}>
        <h1 className="font-display animate-fade-up" style={{ fontSize: '2rem', color: '#111111', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Réglages
        </h1>
      </header>

      <main className="flex-1 px-4 pb-28 overflow-y-auto space-y-4">

        {/* ── Profil card ─────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4 py-4 animate-fade-up"
          style={{ backgroundColor: '#FFF0B5', borderRadius: 22, border: '1px solid rgba(237,216,61,0.4)', boxShadow: '0 2px 12px rgba(237,216,61,0.15)' }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}
          >
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#432F2E', fontFamily: 'Satoshi' }}>
              {initiale}
            </span>
          </div>
          <div className="flex-1">
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#111111', fontFamily: 'Satoshi' }}>
              {prenom.trim() || 'Mon profil'}
            </p>
            <span style={{ display: 'inline-block', marginTop: 3, padding: '0.15rem 0.6rem', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.5)', color: '#432F2E', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Satoshi' }}>
              {meta.label}
            </span>
          </div>
          <Chevron color="#8A7060" />
        </div>

        {/* ── PRÉFÉRENCES ─────────────────────────────────────── */}
        <div>
          <SectionLabel>Préférences</SectionLabel>
          <SectionCard>

            {/* Prénom */}
            <div className="px-4 pt-4 pb-3.5">
              <div className="flex items-start gap-3">
                <IconBadge bg="#FFF0B5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </IconBadge>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi', marginBottom: 8 }}>
                    Prénom affiché
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={prenom}
                      onChange={e => { setPrenom(e.target.value); setPrenomSaved(false) }}
                      onKeyDown={e => e.key === 'Enter' && handleSavePrenom()}
                      placeholder="Ex. Sarah..."
                      className="field flex-1"
                      style={{ padding: '0.6rem 0.875rem', fontSize: '0.9375rem' }}
                      maxLength={30}
                    />
                    <button
                      onClick={handleSavePrenom}
                      style={{
                        backgroundColor: prenomSaved ? '#D1FAE5' : '#432F2E',
                        color: prenomSaved ? '#166534' : '#FFFFFF',
                        borderRadius: 12, padding: '0.6rem 1rem',
                        fontWeight: 700, fontSize: '0.875rem',
                        fontFamily: 'Satoshi', border: 'none', cursor: 'pointer',
                        flexShrink: 0, minWidth: 52,
                        transition: 'background-color 0.2s',
                      }}
                    >
                      {prenomSaved ? '✓' : 'OK'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            {/* Sonnerie */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <IconBadge bg="#FFF0B5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </IconBadge>
              <div className="flex-1">
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>Sonnerie</p>
                <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 1 }}>Son lors d'une nouvelle commande</p>
              </div>
              <Toggle enabled={soundEnabled} onToggle={handleSoundToggle} />
            </div>

          </SectionCard>
        </div>

        {/* ── MODE ────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Mode</SectionLabel>
          <SectionCard bg="#E5F0F5" border="rgba(184,213,229,0.6)">
            <button
              onClick={clearRole}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity"
            >
              <IconBadge bg="rgba(255,255,255,0.55)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D4E6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </IconBadge>
              <p style={{ flex: 1, textAlign: 'left', fontSize: '0.9375rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>
                Vue actuelle
              </p>
              <span style={{ padding: '0.2rem 0.625rem', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.6)', color: '#1D4E6B', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Satoshi', marginRight: 4 }}>
                {meta.label}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1D4E6B', fontFamily: 'Satoshi', marginRight: 4 }}>Changer</span>
              <Chevron color="#1D4E6B" />
            </button>
          </SectionCard>
        </div>

        {/* ── NOTIFICATIONS ────────────────────────────────────── */}
        <div>
          <SectionLabel>Notifications</SectionLabel>
          <SectionCard bg={notifStatus === 'granted' ? '#F0FDF4' : '#FFFFFF'} border={notifStatus === 'granted' ? 'rgba(34,197,94,0.2)' : 'rgba(67,47,46,0.07)'}>
            <button
              onClick={notifStatus === 'default' ? handleEnableNotifs : undefined}
              disabled={notifLoading}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity disabled:opacity-60"
              style={{ cursor: notifStatus === 'granted' || notifStatus === 'denied' ? 'default' : 'pointer' }}
            >
              <IconBadge bg={notifStatus === 'granted' ? 'rgba(34,197,94,0.15)' : notifStatus === 'denied' ? 'rgba(239,68,68,0.1)' : '#FFF0B5'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={notifStatus === 'granted' ? '#15803D' : notifStatus === 'denied' ? '#DC2626' : '#432F2E'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </IconBadge>
              <div className="flex-1 text-left">
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>Notifications push</p>
                <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 1 }}>
                  {notifStatus === 'granted' ? 'Activées sur cet appareil' : notifStatus === 'denied' ? 'Bloquées — autorise dans les réglages' : 'Alerte quand une commande est prête'}
                </p>
              </div>
              {notifStatus === 'granted' && <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#15803D', fontFamily: 'Satoshi' }}>Activées</span>}
              {notifStatus === 'denied'  && <span style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: '#EF4444', display: 'block', flexShrink: 0 }} />}
              {notifStatus === 'default' && <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#432F2E', fontFamily: 'Satoshi', marginRight: 4 }}>{notifLoading ? '...' : 'Activer'}</span>}
              {notifStatus !== 'denied' && <Chevron color={notifStatus === 'granted' ? '#15803D' : '#8A7060'} />}
            </button>
          </SectionCard>
        </div>

        {/* ── PRODUCTION ──────────────────────────────────────── */}
        {(role === 'patissiere' || role === 'boulangerie') && (
          <div>
            <SectionLabel>Production</SectionLabel>
            <SectionCard>
              <div className="px-4 py-4">
                <div className="flex items-start gap-3 mb-3">
                  <IconBadge bg="#FFF0B5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                    </svg>
                  </IconBadge>
                  <div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>Délai alerte urgence</p>
                    <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 1 }}>Une commande passe en rouge à moins de…</p>
                  </div>
                </div>
                <div className="flex gap-2 pl-[54px]">
                  {[24, 48, 72].map(h => (
                    <button
                      key={h}
                      onClick={() => handleUrgencyChange(h)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                      style={{ backgroundColor: urgencyHours === h ? '#432F2E' : 'rgba(67,47,46,0.07)', color: urgencyHours === h ? '#FFFFFF' : '#8A7060', border: 'none', fontFamily: 'Satoshi' }}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── DONNÉES (manager) ───────────────────────────────── */}
        {role === 'manager' && (
          <div>
            <SectionLabel>Données</SectionLabel>
            <SectionCard>
              <button
                onClick={handleExportCSV}
                disabled={csvLoading || monthCount === 0}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity disabled:opacity-40"
              >
                <IconBadge bg="#E5F0F5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D4E6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </IconBadge>
                <div className="flex-1 text-left">
                  <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>Export CSV</p>
                  <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 1 }}>
                    {monthCount > 0 ? `${monthCount} commande${monthCount > 1 ? 's' : ''} ce mois` : 'Aucune commande ce mois'}
                  </p>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1D4E6B', fontFamily: 'Satoshi', marginRight: 4 }}>
                  {csvLoading ? '...' : '↓ Exporter'}
                </span>
                <Chevron color="#1D4E6B" />
              </button>
              <Divider />
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity disabled:opacity-40"
              >
                <IconBadge bg="rgba(239,68,68,0.08)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </IconBadge>
                <div className="flex-1 text-left">
                  <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#DC2626', fontFamily: 'Satoshi' }}>Réinitialiser</p>
                  <p style={{ fontSize: '0.8125rem', color: '#8A7060', fontFamily: 'Satoshi', marginTop: 1 }}>Supprime toutes les commandes</p>
                </div>
                <Chevron color="#DC2626" />
              </button>
            </SectionCard>
          </div>
        )}

        {/* ── APPLICATION ──────────────────────────────────────── */}
        <div>
          <SectionLabel>Application</SectionLabel>
          <SectionCard>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <IconBadge bg="rgba(67,47,46,0.07)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </IconBadge>
              <p style={{ flex: 1, fontSize: '0.9375rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>Boulangerie</p>
              <span style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi', marginRight: 4 }}>Au Grand Jour</span>
              <Chevron />
            </div>
            <Divider />
            <div className="flex items-center gap-3 px-4 py-3.5">
              <IconBadge bg="rgba(67,47,46,0.07)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </IconBadge>
              <p style={{ flex: 1, fontSize: '0.9375rem', fontWeight: 600, color: '#111111', fontFamily: 'Satoshi' }}>Version</p>
              <span style={{ fontSize: '0.875rem', color: '#8A7060', fontFamily: 'Satoshi' }}>1.0.0</span>
            </div>
          </SectionCard>
        </div>

        {/* ── SE DÉCONNECTER ───────────────────────────────────── */}
        <SectionCard bg="#FEF0F0" border="rgba(239,68,68,0.15)">
          <button
            onClick={clearRole}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity"
          >
            <IconBadge bg="rgba(239,68,68,0.1)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </IconBadge>
            <p style={{ flex: 1, textAlign: 'left', fontSize: '0.9375rem', fontWeight: 600, color: '#DC2626', fontFamily: 'Satoshi' }}>
              Se déconnecter
            </p>
            <Chevron color="#DC2626" />
          </button>
        </SectionCard>

        {/* ── Dev ─────────────────────────────────────────────── */}
        {import.meta.env.DEV && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFBEB', border: '1px dashed #FDE68A' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#92400E', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Satoshi', marginBottom: 6 }}>
              Dev · données test
            </p>
            <button onClick={handleSeed} disabled={seeding} className="w-full py-2.5 rounded-xl text-sm font-semibold active:opacity-70 disabled:opacity-50" style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontFamily: 'Satoshi' }}>
              {seeding ? 'Injection...' : 'Injecter des commandes test'}
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
