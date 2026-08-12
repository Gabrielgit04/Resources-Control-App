import { APP_NAME } from '@/config'
import { Icon } from '@/components/Icon'

export function MobileTopBar() {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface/90 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center text-primary font-headline font-bold">
          G
        </div>
        <h1 className="font-display font-bold text-lg tracking-tight">{APP_NAME}</h1>
      </div>
      <button aria-label="Notificaciones" className="p-2 text-on-surface rounded-full hover:bg-surface-container-low transition-colors">
        <Icon name="notifications" />
      </button>
    </header>
  )
}
