import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, clearPersistedSession, setUnauthorizedHandler } from '@/server/supabase.service'
import { invalidateAll } from '@/lib/query-cache'
import { AuthContext } from '@/components/auth/auth-context'
import { useOnlinePresence } from '@/hooks/use-online-presence'
import { IsSuperAdmin, IsAccountSuspended, clearAdminCache } from '@/backend/services/Admin-Services/AdminUsers'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useOnlinePresence(user?.id)

  useEffect(() => {
    let mounted = true
    if (!user) {
      setIsAdmin(false)
      return
    }
    // console.info('[AuthProvider] Verificando superadmin para userId:', user.id)
    IsSuperAdmin()
      .then((value) => {
        if (mounted) {
          // console.info(`[AuthProvider] userId ${user.id} es superadmin:`, value)
          setIsAdmin(value)
        }
      })
      .catch((err) => {
        console.error(`[AuthProvider] Falló la verificación de superadmin para userId ${user.id}:`, err)
        toast.error('No se pudo verificar tu rol de administrador. Revisa la consola (F12).')
        if (mounted) setIsAdmin(false)
      })
    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const s = data.session
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
      if (s?.user) {
        IsAccountSuspended()
          .then((suspended) => {
            if (mounted && suspended) {
              void supabase.auth.signOut()
              clearPersistedSession()
              toast.error('Tu cuenta ha sido suspendida.')
            }
          })
          .catch((err) => console.error('[AuthProvider] Falló el chequeo de suspensión:', err))
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) return
        invalidateAll()
        void supabase.auth.signOut()
        clearPersistedSession()
        toast.error('Tu sesión expiró. Vuelve a iniciar sesión.')
      })
    })
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    clearPersistedSession()
    clearAdminCache()
    invalidateAll()
    setSession(null)
    setUser(null)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signOut }}>{children}</AuthContext.Provider>
  )
}
