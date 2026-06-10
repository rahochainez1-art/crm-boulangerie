import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'agj_role'

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(() => localStorage.getItem(STORAGE_KEY))

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
