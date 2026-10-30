import { createContext, useContext } from 'react'

export interface AppTourContextValue {
  startTour: () => void
}

export const AppTourContext = createContext<AppTourContextValue | null>(null)

export function useAppTour() {
  const context = useContext(AppTourContext)
  if (!context) {
    throw new Error('useAppTour debe usarse dentro de AppTourProvider')
  }
  return context
}
