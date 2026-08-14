import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Icon } from '@/components/Icon'
import { APP_NAME } from '@/config'
import { isEmail, isStrongPassword, isTextOnly } from '@/lib/validation'
import { RegisterUser, type RegisterUserResult } from '@/backend/services/Auth-Services/SignUp.Services'
import type { Email } from '@/backend/utils/types'
import { supabase } from '@/server/supabase.service'

export function SignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    terms: false,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!isTextOnly(form.name)) {
      toast.error('El nombre solo puede contener letras y espacios.')
      return
    }
    if (!isEmail(form.email)) {
      toast.error('Ingresa un correo electrónico válido.')
      return
    }
    if (!isStrongPassword(form.password)) {
      toast.error('La contraseña debe tener al menos 8 caracteres e incluir letras y números.')
      return
    }
    if (form.password !== form.passwordConfirmation) {
      toast.error('Las contraseñas no coinciden.')
      return
    }
    if (!form.terms) {
      toast.error('Debes aceptar los Términos y Condiciones.')
      return
    }

    setLoading(true)
    let result: RegisterUserResult
    try {
      result = await RegisterUser({
        name: form.name,
        email: form.email as Email,
        password: form.password,
      })
    } catch (err) {
      setLoading(false)
      toast.error(err instanceof Error ? err.message : 'Error inesperado al crear la cuenta.')
      return
    }
    setLoading(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session) {
      toast.success('Cuenta creada correctamente. ¡Bienvenido!')
      navigate('/dashboard')
    } else {
      toast.success('Cuenta creada. Revisa tu correo para confirmarla e inicia sesión.')
      navigate('/login')
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center relative overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Abstract Ambient Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-primary-container/20 to-transparent blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-secondary-container/10 to-transparent blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto p-4 sm:p-8 flex items-center justify-center">
        {/* Registration Card (Asymmetrical Layout) */}
        <div className="w-full flex flex-col md:flex-row glass-panel rounded-xl overflow-hidden shadow-[0_24px_40px_rgba(11,28,48,0.04)]">
          {/* Left Side: Branding / Visuals */}
          <div className="w-full md:w-5/12 bg-surface-container-low p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-16">
                <Icon name="account_balance" fill size={30} className="text-primary" />
                <span className="font-headline font-bold text-2xl tracking-tighter text-on-surface">{APP_NAME}</span>
              </div>
              <h2 className="font-headline text-4xl lg:text-5xl font-bold leading-tight mb-4">
                Inicia tu
                <br />
                flujo
                <br />
                <span className="text-primary">financiero.</span>
              </h2>
              <p className="text-on-surface-variant font-body text-base lg:text-lg mb-8 max-w-sm">
                Únete al ecosistema de seguimiento inteligente de recursos y gestión automatizada de patrimonio.
              </p>
            </div>
            {/* Abstract visual element */}
            <div
              className="absolute bottom-0 right-0 w-full h-1/2 opacity-30 mix-blend-multiply pointer-events-none"
              style={{ background: 'radial-gradient(circle at bottom right, #00d166, transparent 70%)' }}
            />
          </div>

          {/* Right Side: Form */}
          <div className="w-full md:w-7/12 bg-surface-container-lowest p-8 lg:p-16 flex flex-col justify-center">
            <h1 className="font-headline text-3xl font-bold mb-2">Crear cuenta</h1>
            <p className="text-on-surface-variant text-sm mb-8">Ingresa tus datos a continuación para empezar.</p>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="name">
                  Nombre completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="person" size={24} className="text-outline" />
                  </div>
                  <input
                    className="input-clean block w-full pl-10 pr-3 py-3 rounded-lg text-on-surface placeholder-outline focus:ring-0 sm:text-sm"
                    id="name"
                    name="name"
                    placeholder="Jane Doe"
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="email">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="mail" size={24} className="text-outline" />
                  </div>
                  <input
                    className="input-clean block w-full pl-10 pr-3 py-3 rounded-lg text-on-surface placeholder-outline focus:ring-0 sm:text-sm"
                    id="email"
                    name="email"
                    placeholder="jane@example.com"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="lock" size={24} className="text-outline" />
                  </div>
                  <input
                    className="input-clean block w-full pl-10 pr-3 py-3 rounded-lg text-on-surface placeholder-outline focus:ring-0 sm:text-sm"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="password_confirmation">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="lock_reset" size={24} className="text-outline" />
                  </div>
                  <input
                    className="input-clean block w-full pl-10 pr-3 py-3 rounded-lg text-on-surface placeholder-outline focus:ring-0 sm:text-sm"
                    id="password_confirmation"
                    name="password_confirmation"
                    placeholder="••••••••"
                    required
                    type="password"
                    value={form.passwordConfirmation}
                    onChange={(e) => setForm((f) => ({ ...f, passwordConfirmation: e.target.value }))}
                  />
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-center">
                <input
                  className="h-4 w-4 text-primary bg-surface-container-low border-outline-variant rounded focus:ring-primary focus:ring-offset-surface"
                  id="terms"
                  name="terms"
                  required
                  type="checkbox"
                  checked={form.terms}
                  onChange={(e) => setForm((f) => ({ ...f, terms: e.target.checked }))}
                />
                <label className="ml-2 block text-sm text-on-surface-variant" htmlFor="terms">
                  Acepto los{' '}
                  <a className="font-medium text-primary hover:text-primary-container transition-colors" href="#">
                    Términos y Condiciones
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-on-primary bg-primary hover:bg-primary-container hover:text-on-primary-container hover:shadow-[0_0_15px_rgba(0,209,102,0.4)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:pointer-events-none"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? 'Creando cuenta…' : 'Registrarse'}
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
                  O regístrate con
                </span>
              </div>
            </div>

            {/* Google Sign Up */}
            <div className="mt-6">
              <button
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-outline-variant/30 rounded-lg bg-surface-container-low text-sm font-medium text-on-surface hover:bg-surface-container-highest transition-colors"
                type="button"
              >
                <Icon name="g_mobiledata" size={18} className="mr-2" />
                Regístrate con Google
              </button>
            </div>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-on-surface-variant">
                ¿Ya tienes una cuenta?{' '}
                <Link className="font-medium text-primary hover:text-primary-container transition-colors" to="/login">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
