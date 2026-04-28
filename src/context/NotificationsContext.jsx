import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'
import { useNotifications } from '../hooks/useNotifications'

// null sentinel = no provider in tree; consumers fall back to their own hook instance
const NotificationsContext = createContext(null)

export function NotificationsProvider({ children, currentDate }) {
  const { user } = useAuth()
  const value = useNotifications(user?.id, currentDate)
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotificationsContext() {
  return useContext(NotificationsContext)
}
