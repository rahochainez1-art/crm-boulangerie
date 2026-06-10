import { createContext, useContext, useState } from 'react'

const STORAGE_KEY      = 'agj_role'
const VENDOR_NAME_KEY  = 'agj_vendeur_name'

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const [role, setRoleState]             = useState(() => localStorage.getItem(STORAGE_KEY))
  const [vendeurName, setVendeurNameState] = useState(() => localStorage.getItem(VENDOR_NAME_KEY) || '')

  const setRole = (newRole) => {
    localStorage.setItem(STORAGE_KEY, newRole)
    setRoleState(newRole)
  }

  const setVendeurName = (name) => {
    localStorage.setItem(VENDOR_NAME_KEY, name)
    setVendeurNameState(name)
  }

  const clearRole = () => {
    localStorage.removeItem(STORAGE_KEY)
    setRoleState(null)
  }

  return (
    <RoleContext.Provider value={{ role, setRole, clearRole, vendeurName, setVendeurName }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
