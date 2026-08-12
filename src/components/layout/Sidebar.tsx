import { NavLink, Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { NAV_ITEMS } from '@/components/layout/navigation'
import { useAuth } from '@/components/auth/auth-context'
import { useProfile } from '@/hooks/use-profile'
import { IsSuperAdmin } from '@/backend/services/Admin-Services/AdminUsers'

export function Sidebar() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const nombre = profile?.name ?? (user?.user_metadata?.full_name as string | undefined) ?? 'Usuario'
  const avatar = profile?.avatar ?? (user?.user_metadata?.avatar_url as string | undefined) ?? ''
  const inicial = nombre.charAt(0).toUpperCase()
  const esAdmin = IsSuperAdmin(user?.id)
  const items = NAV_ITEMS.filter((item) => !item.admin || esAdmin)

  return (
    <nav className="hidden md:flex flex-col w-64 bg-surface-container-lowest h-full shadow-[4px_0_24px_rgba(11,28,48,0.04)] z-40 fixed">
      <div className="p-6">
        <Link to="/profile" className="flex items-center gap-3 group">
          {avatar ? (
            <img
              src={avatar}
              alt={nombre}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary transition-all"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center text-primary font-headline font-bold group-hover:bg-primary-container transition-colors">
              {inicial}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl tracking-tight text-on-surface truncate">{nombre}</h1>
            <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
          </div>
        </Link>
      </div>
      <div className="flex-1 px-4 py-6 space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-medium'
                  : 'text-on-surface-variant hover:bg-surface-container-low font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} fill={isActive} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
