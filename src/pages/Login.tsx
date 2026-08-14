import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Icon } from '@/components/Icon'
import { APP_NAME } from '@/config'
import { SignInUser } from '@/backend/services/Auth-Services/SignIn.Services'
import {
  clearLoginState,
  getLoginState,
  recordLoginFailure,
} from '@/backend/services/Auth-Services/LocalLoginGuard'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const guard = getLoginState(email)
    if (guard.locked) {
      setLoading(false)
      toast.error(`Demasiados intentos fallidos. Espera ${guard.remainingSeconds} s para volver a intentar.`)
      return
    }

    const result = await SignInUser({ email, password })

    if (!result.ok) {
      setLoading(false)
      const after = recordLoginFailure(email)
      if (after.locked) {
        toast.error(
          `Demasiados intentos fallidos. Bloqueado por 3 minutos (espera ${after.remainingSeconds} s).`
        )
      } else {
        toast.error(`Verifica tu email o contraseña. Te quedan ${after.attemptsLeft} intento(s).`)
      }
      return
    }

    clearLoginState(email)
    setLoading(false)
    toast.success('Sesión iniciada. ¡Bienvenido de nuevo!')

    const from = (location.state as { from?: string } | null)?.from
    const destino = from ?? (result.isAdmin ? '/admin' : '/dashboard')
    navigate(destino, { replace: true })
  }

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen relative overflow-hidden flex items-center justify-center selection:bg-primary-container selection:text-on-primary-container">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="floating-orb-1 absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-3xl opacity-60" />
        <div className="floating-orb-2 absolute top-[40%] -right-[20%] w-[70vw] h-[70vw] rounded-full blur-3xl opacity-50" />
      </div>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="glass-panel rounded-xl shadow-[0_8px_30px_rgb(11,28,48,0.04)] border border-outline-variant/20 p-8">
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container/20 text-primary mb-4">
              <Icon name="account_balance" fill size={24} />
            </div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">{APP_NAME}</h1>
            <p className="font-body text-sm text-on-surface-variant">Entra al Luminous Engine.</p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block font-label text-sm font-medium text-on-surface mb-1.5" htmlFor="email">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <Icon name="mail" size={20} />
                  </div>
                  <input
                    autoComplete="email"
                    className="block w-full pl-10 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                    id="email"
                    name="email"
                    placeholder="username@email.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-label text-sm font-medium text-on-surface" htmlFor="password">
                    Contraseña
                  </label>
                  <Link
                    className="font-label text-xs font-medium text-primary hover:text-primary-container transition-colors"
                    to="/forgot-password"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <Icon name="lock" size={20} />
                  </div>
                  <input
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-10 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    aria-label="Mostrar u ocultar contraseña"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-primary transition-colors"
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    <Icon name={showPassword ? 'visibility' : 'visibility_off'} size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                className="h-4 w-4 rounded border-outline-variant/50 text-primary focus:ring-primary focus:ring-offset-surface bg-surface-container-low"
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="ml-2 block font-label text-sm text-on-surface-variant" htmlFor="remember-me">
                Recuérdame
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-headline font-semibold text-on-primary bg-primary hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-surface glow-effect transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none"
                disabled={loading}
                type="submit"
              >
                {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8 relative">
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/20" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-xs font-label text-on-surface-variant uppercase tracking-wide">
                O continúa con
              </span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="mt-6 grid gap-3">
            <button
              className="w-full inline-flex justify-center items-center py-2 px-4 border border-outline-variant/30 rounded-lg bg-surface-container-low text-sm font-medium text-on-surface hover:bg-surface-container-highest transition-colors"
              type="button"
            >
              <Icon name="g_mobiledata" size={18} className="mr-2" />
              Google
            </button>
          </div>

          {/* Sign up link */}
          <p className="mt-8 text-center font-body text-sm text-on-surface-variant">
            ¿No tienes una cuenta?{' '}
            <Link className="font-medium text-primary hover:text-primary-container transition-colors" to="/signup">
              Regístrate
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
