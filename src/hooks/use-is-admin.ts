import { useAuth } from '@/components/auth/auth-context'

/** ¿El usuario autenticado es superadmin? Se verifica al iniciar sesión (AuthProvider). */
export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth()
  return isAdmin
}