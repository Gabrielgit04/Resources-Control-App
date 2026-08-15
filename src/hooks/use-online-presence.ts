import { useEffect } from 'react'
import { supabase } from '@/server/supabase.service'

export const PRESENCE_HEARTBEAT_MS = 60_000

/**
 * Mantiene `last_seen_at` del usuario actualizado mientras la app está abierta.
 * Un usuario se considera "conectado" si su `last_seen_at` está a menos de
 * `ONLINE_WINDOW_MS` (ver AdminUsers). Corre en AuthProvider, que envuelve
 * todas las rutas autenticadas.
 */
export function useOnlinePresence(userId: string | null | undefined): void {
  useEffect(() => {
    if (!userId) return
    let stopped = false

    const beat = () => {
      if (stopped) return
      void supabase
        .from('users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.warn('[presence] No se pudo actualizar last_seen_at:', error.message)
        })
    }

    beat()
    const timer = setInterval(beat, PRESENCE_HEARTBEAT_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') beat()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId])
}
