import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { BOTTOM_NAV_ITEMS } from '@/components/layout/navigation'
import { useAuth } from '@/components/auth/auth-context'
import { IsSuperAdmin } from '@/backend/services/Admin-Services/AdminUsers'

export function BottomNav() {
  const { user } = useAuth()
  const esAdmin = IsSuperAdmin(user?.id)
  const items = BOTTOM_NAV_ITEMS.filter((item) => !item.admin || esAdmin)

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-surface-container-lowest glass-panel z-50">
      <div className="flex justify-around items-center py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-on-primary-container bg-primary-container/20'
                  : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} fill={isActive} size={24} />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
