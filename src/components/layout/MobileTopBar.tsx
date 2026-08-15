import { Link } from 'react-router-dom'
import { APP_NAME } from '@/config'
import { Icon } from '@/components/Icon'
import { useAuth } from '@/components/auth/auth-context'
import { useProfile } from '@/hooks/use-profile'

export function MobileTopBar() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const nombre = profile?.name ?? (user?.user_metadata?.full_name as string | undefined) ?? 'Usuario'
  const avatar = profile?.avatar ?? (user?.user_metadata?.avatar_url as string | undefined) ?? ''
  const inicial = nombre.charAt(0).toUpperCase()

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface/90 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Link to="/profile" className="flex items-center gap-3 min-w-0">
          {avatar ? (
            <img
              src={avatar}
              alt={nombre}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center text-primary font-headline font-bold">
              {inicial}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg tracking-tight truncate">{APP_NAME}</h1>
            <p className="text-xs text-on-surface-variant truncate leading-tight">{nombre}</p>
          </div>
        </Link>
      </div>
      <button aria-label="Notificaciones" className="p-2 text-on-surface rounded-full hover:bg-surface-container-low transition-colors">
        <Icon name="notifications" />
      </button>
    </header>
  )
}
