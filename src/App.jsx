import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { RoleProvider, useRole } from './context/RoleContext'
import BottomNav from './components/layout/BottomNav'

import RoleSelector from './pages/RoleSelector'
import Settings from './pages/Settings'
import Calendrier from './pages/Calendrier'

import VendeurDashboard from './pages/vendeur/VendeurDashboard'
import NouvelleCommande from './pages/vendeur/NouvelleCommande'
import MesCommandes from './pages/vendeur/MesCommandes'
import Historique from './pages/vendeur/Historique'
import Profil from './pages/vendeur/Profil'

import PatissiereDashboard from './pages/patissiere/Dashboard'
import PatissiereHistorique from './pages/patissiere/Historique'
import BoulangerieDashboard from './pages/boulangerie/Dashboard'

import ManagerDashboard from './pages/manager/ManagerDashboard'
import ToutesCommandes from './pages/manager/ToutesCommandes'

function DefaultRedirect() {
  const { role } = useRole()
  if (role === 'vendeur') return <Navigate to="/vendeur" replace />
  if (role === 'patissiere') return <Navigate to="/patissiere" replace />
  if (role === 'manager') return <Navigate to="/manager" replace />
  if (role === 'boulangerie') return <Navigate to="/boulangerie" replace />
  return <Navigate to="/choisir-role" replace />
}

function AppRoutes() {
  const { role } = useRole()

  if (!role) {
    return (
      <Routes>
        <Route path="*" element={<RoleSelector />} />
      </Routes>
    )
  }

  return (
    <Routes>
      {/* ── Vendeur */}
      <Route path="/vendeur" element={<VendeurDashboard />} />
      <Route path="/vendeur/nouvelle-commande" element={<NouvelleCommande />} />
      <Route path="/vendeur/mes-commandes" element={<MesCommandes />} />
      <Route path="/vendeur/historique" element={<Historique />} />
      <Route path="/vendeur/profil" element={<Profil />} />

      {/* ── Pâtissière */}
      <Route path="/patissiere" element={<PatissiereDashboard />} />
      <Route path="/patissiere/historique" element={<PatissiereHistorique />} />

      {/* ── Boulangerie */}
      <Route path="/boulangerie" element={<BoulangerieDashboard />} />

      {/* ── Manager */}
      <Route path="/manager" element={<ManagerDashboard />} />
      <Route path="/manager/toutes" element={<ToutesCommandes />} />

      {/* ── Partagés */}
      <Route path="/calendrier" element={<Calendrier />} />
      <Route path="/settings" element={<Settings />} />

      {/* ── Défaut */}
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  )
}

function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blob-green blur-3xl opacity-40" />
      <div className="absolute top-[40%] -right-48 w-[420px] h-[420px] rounded-full bg-blob-yellow blur-3xl opacity-35" />
      <div className="absolute -bottom-48 left-[30%] w-[480px] h-[480px] rounded-full bg-blob-pink blur-3xl opacity-30" />
    </div>
  )
}

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <BackgroundBlobs />
        <AppRoutes />
        <BottomNav />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              color: '#FAFAF7',
              borderRadius: '1rem',
              fontSize: '14px',
              fontFamily: '"DM Sans", sans-serif',
              padding: '12px 18px',
            },
          }}
        />
      </BrowserRouter>
    </RoleProvider>
  )
}
