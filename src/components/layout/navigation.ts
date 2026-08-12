export interface NavItem {
  label: string
  icon: string
  to: string
  admin?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Panel', icon: 'dashboard', to: '/dashboard' },
  { label: 'Cuentas', icon: 'receipt_long', to: '/accounts' },
  { label: 'Reportes', icon: 'bar_chart', to: '/reports' },
  // { label: 'Automatizaciones', icon: 'settings_input_component', to: '/automations' },
  { label: 'Usuarios', icon: 'group', to: '/admin', admin: true },
  { label: 'Ajustes', icon: 'settings', to: '/profile' },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Panel', icon: 'dashboard', to: '/dashboard' },
  { label: 'Cuentas', icon: 'receipt_long', to: '/accounts' },
  { label: 'Uso', icon: 'bar_chart', to: '/reports' },
  { label: 'Automatizaciones', icon: 'settings_input_component', to: '/automations' },
  { label: 'Usuarios', icon: 'group', to: '/admin', admin: true },
]
