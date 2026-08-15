import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { RouteTransition } from '@/components/RouteTransition'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="bg-surface text-on-surface h-full flex flex-col md:flex-row antialiased selection:bg-primary-container selection:text-on-primary-container">
      <MobileTopBar />
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto md:ml-64 p-4 md:p-8 lg:p-12 pb-24 md:pb-12 scroll-smooth">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <BottomNav />
    </div>
  )
}
