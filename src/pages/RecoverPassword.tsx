import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'

export function RecoverPassword() {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="h-full bg-surface text-on-surface font-body antialiased flex items-center justify-center p-6 min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {/* The Luminous Engine Canvas */}
      <main className="w-full max-w-md relative z-10">
        {/* Decorative Ambient Layering */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary-container/20 rounded-full blur-[80px] -z-10 pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-secondary-container/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

        {/* Glassmorphism Container */}
        <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-8 shadow-[0_8px_40px_rgba(11,28,48,0.06)] border border-outline-variant/20 relative overflow-hidden">
          {/* Header Section */}
          <div className="mb-10 text-center space-y-4 relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-lowest border border-outline-variant/30 mb-2 shadow-[0_4px_16px_rgba(0,109,50,0.08)]">
              <Icon name="lock_reset" size={24} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-on-surface tracking-tight">Recuperar contraseña</h1>
            <p className="font-body text-on-surface-variant text-sm">Ingresa tu correo para recibir un enlace de recuperación</p>
          </div>

          {/* Form Section */}
          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="font-label text-sm font-medium text-on-surface" htmlFor="email">
                Correo electrónico
              </label>
              <div className="relative">
                <Icon
                  name="mail"
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 pointer-events-none"
                />
                <input
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-3 pl-11 pr-4 text-on-surface font-body text-sm placeholder-on-surface-variant/50 focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200 shadow-sm"
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Primary Action */}
            <button
              className="w-full bg-primary text-on-primary font-label font-medium rounded-lg py-3.5 px-4 shadow-[0_4px_12px_rgba(0,109,50,0.2)] hover:shadow-[0_8px_20px_rgba(0,109,50,0.3)] hover:bg-surface-tint active:scale-[0.98] transition-all duration-300 relative overflow-hidden group"
              type="submit"
            >
              <span className="relative z-10">Enviar enlace</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-container/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
            </button>
          </form>

          {/* Secondary Action */}
          <div className="mt-8 text-center relative z-10">
            <Link
              className="inline-flex items-center justify-center gap-2 font-label text-sm font-medium text-on-surface-variant hover:text-primary transition-colors duration-200 group"
              to="/login"
            >
              <Icon name="arrow_back" size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Volver al inicio de sesión</span>
            </Link>
          </div>

          {/* Subtle Texture Overlay */}
          <div
            className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMSIvPjwvc3ZnPg==')] opacity-50 mix-blend-overlay pointer-events-none"
          />
        </div>
      </main>
    </div>
  )
}
