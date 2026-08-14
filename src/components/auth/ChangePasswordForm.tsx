import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { Icon } from '@/components/Icon'
import { supabase } from '@/server/supabase.service'

interface ChangePasswordFormProps {
  /** Acción tras actualizar la contraseña con éxito (ej: cerrar el diálogo). */
  onSuccess?: () => void | Promise<void>
  /** Texto del botón de envío. */
  submitLabel?: string
  /** Mensaje de éxito mostrado al guardar. */
  successMessage?: string
}

/** Módulo reutilizable para cambiar la contraseña (Perfil y Recuperación). */
export function ChangePasswordForm({
  onSuccess,
  submitLabel = 'Guardar contraseña',
  successMessage = 'Contraseña actualizada.',
}: ChangePasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(`No se pudo actualizar: ${error.message}`)
      return
    }

    setPassword('')
    setConfirm('')
    toast.success(successMessage)
    await onSuccess?.()
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="cambio-pass-nueva">
          Nueva contraseña
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
            <Icon name="lock" size={18} />
          </div>
          <input
            autoComplete="new-password"
            className="block w-full pl-10 pr-10 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            id="cambio-pass-nueva"
            minLength={6}
            name="password"
            placeholder="Mínimo 6 caracteres"
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
            <Icon name={showPassword ? 'visibility' : 'visibility_off'} size={18} />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="cambio-pass-confirm">
          Confirmar contraseña
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
            <Icon name="lock" size={18} />
          </div>
          <input
            autoComplete="new-password"
            className="block w-full pl-10 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            id="cambio-pass-confirm"
            name="confirm"
            placeholder="Repite la contraseña"
            required
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
          disabled={loading}
          type="submit"
        >
          {loading && <Icon name="progress_activity" size={16} className="animate-spin" />}
          {loading ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
