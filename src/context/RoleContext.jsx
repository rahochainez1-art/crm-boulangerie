import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'agj_role'
const QR_ROLES = ['vendeur', 'patissiere', 'boulangerie'] // pas « manager » : sa vue reste à choisir

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
    // Liens / QR codes d'équipe (/vendeur, /patissiere, /boulangerie) : ouvre directement dans la bonne vue
    const fromUrl = QR_ROLES.find((r) => window.location.pathname.startsWith(`/${r}`))
    if (fromUrl) {
      localStorage.setItem(STORAGE_KEY, fromUrl)
      return fromUrl
    }
    return null
  })

  const setRole = (newRole) => {
    localStorage.setItem(STORAGE_KEY, newRole)
    setRoleState(newRole)
  }

  const clearRole = () => {
    localStorage.removeItem(STORAGE_KEY)
    setRoleState(null)
  }

  return (
    <RoleContext.Provider value={{ role, setRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
