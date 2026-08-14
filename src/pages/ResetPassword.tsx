import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Icon } from '@/components/Icon'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'
import { supabase } from '@/server/supabase.service'

type Status = 'loading' | 'error' | 'ready'

export function ResetPassword() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const params = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.substring(1))
      const tokenHash = params.get('token_hash')
      const accessToken = hash.get('access_token') ?? params.get('access_token')
      const refreshToken = hash.get('refresh_token') ?? params.get('refresh_token')

      try {
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash })
          if (mounted) setStatus(error ? 'error' : 'ready')
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          if (mounted) setStatus(error ? 'error' : 'ready')
        } else {
          const { data } = await supabase.auth.getSession()
          if (mounted) setStatus(data.session ? 'ready' : 'error')
        }
      } catch {
        if (mounted) setStatus('error')
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const handleSuccess = async () => {
    await supabase.auth.signOut()
    toast.success('Contraseña actualizada. Inicia sesión con tu nueva contraseña.')
    navigate('/login', { replace: true })
  }

  return (
    <div className="h-full bg-surface text-on-surface font-body antialiased flex items-center justify-center p-6 min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {/* The Luminous Engine Canvas */}
      <main className="w-full max-w-md relative z-10">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary-container/20 rounded-full blur-[80px] -z-10 pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-secondary-container/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

        <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-8 shadow-[0_8px_40px_rgba(11,28,48,0.06)] border border-outline-variant/20 relative overflow-hidden">
          <div className="mb-10 text-center space-y-4 relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-lowest border border-outline-variant/30 mb-2 shadow-[0_4px_16px_rgba(0,109,50,0.08)]">
              <Icon name="lock_reset" size={24} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-on-surface tracking-tight">Nueva contraseña</h1>
            <p className="font-body text-on-surface-variant text-sm">Elige una contraseña nueva para tu cuenta</p>
          </div>

          {status === 'loading' && (
            <div className="relative z-10 py-8 text-center text-on-surface-variant text-sm">Validando el enlace…</div>
          )}

          {status === 'error' && (
            <div className="relative z-10 space-y-4 text-center">
              <p className="text-sm text-on-surface-variant">
                El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.
              </p>
              <Link
                className="inline-flex items-center justify-center gap-2 font-label text-sm font-medium text-primary hover:text-primary-container transition-colors"
                to="/forgot-password"
              >
                <Icon name="lock_reset" size={18} />
                <span>Pedir otro enlace</span>
              </Link>
            </div>
          )}

          {status === 'ready' && (
            <div className="relative z-10">
              <ChangePasswordForm
                submitLabel="Guardar contraseña"
                successMessage="Contraseña actualizada. Inicia sesión con tu nueva contraseña."
                onSuccess={handleSuccess}
              />
            </div>
          )}

          <div className="mt-8 text-center relative z-10">
            <Link
              className="inline-flex items-center justify-center gap-2 font-label text-sm font-medium text-on-surface-variant hover:text-primary transition-colors duration-200 group"
              to="/login"
            >
              <Icon name="arrow_back" size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Volver al inicio de sesión</span>
            </Link>
          </div>

          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMSIvPjwvc3ZnPg==')] opacity-50 mix-blend-overlay pointer-events-none" />
        </div>
      </main>
    </div>
  )
}
