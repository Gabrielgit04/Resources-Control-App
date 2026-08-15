import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export function RouteTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  return (
    <div
      key={location.pathname}
      className="min-h-full animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      {children}
    </div>
  )
}
