import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/components/auth/auth-context'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { DeleteUser, ListUsers, type AdminUser } from '@/backend/services/Admin-Services/AdminUsers'

function formatFecha(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Admin() {
  const { user } = useAuth()
  const esAdmin = useIsAdmin()
  const [usuarios, setUsuarios] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [borrando, setBorrando] = useState<AdminUser | null>(null)
  const [procesando, setProcesando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await ListUsers()
    setLoading(false)
    if (res.ok && res.data) {
      setUsuarios(res.data.usuarios)
    } else {
      toast.error(res.error ?? 'No se pudieron cargar los usuarios.')
    }
  }, [])

  useEffect(() => {
    if (esAdmin) cargar()
  }, [esAdmin, cargar])

  const confirmarBorrado = async () => {
    if (!borrando) return
    setProcesando(true)
    const res = await DeleteUser(borrando.id)
    setProcesando(false)
    if (!res.ok) {
      toast.error(res.error ?? 'No se pudo eliminar el usuario.')
      return
    }
    toast.success(`Usuario ${borrando.email} eliminado.`)
    setBorrando(null)
    cargar()
  }

  if (!esAdmin) {
    return (
      <div className="space-y-10">
        <div className="bg-error/10 border border-error/20 rounded-xl p-6 flex items-start gap-3">
          <Icon name="lock" size={20} className="mt-0.5 flex-shrink-0 text-error" />
          <div>
            <h2 className="font-display font-bold text-xl text-on-surface mb-1">Acceso denegado</h2>
            <p className="text-sm text-on-surface-variant">
              Este módulo es exclusivo del superadministrador de la aplicación.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const confirmados = usuarios.filter((u) => u.confirmed).length

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-2">Usuarios</h2>
          <p className="text-on-surface-variant text-sm md:text-base">
            Administra los usuarios registrados en la aplicación.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary font-medium text-sm glow-hover transition-all"
          onClick={cargar}
        >
          <Icon name="sync" size={18} />
          Actualizar
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_8px_32px_rgba(11,28,48,0.03)]">
          <p className="text-sm text-on-surface-variant font-medium mb-1">Total de usuarios</p>
          <p className="font-display font-bold text-3xl text-on-surface">{usuarios.length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_8px_32px_rgba(11,28,48,0.03)]">
          <p className="text-sm text-on-surface-variant font-medium mb-1">Correos confirmados</p>
          <p className="font-display font-bold text-3xl text-primary">{confirmados}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_8px_32px_rgba(11,28,48,0.03)]">
          <p className="text-sm text-on-surface-variant font-medium mb-1">Sin confirmar</p>
          <p className="font-display font-bold text-3xl text-error">{usuarios.length - confirmados}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
        <h3 className="font-display font-semibold text-xl text-on-surface mb-6">Listado de usuarios</h3>
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-on-surface-variant text-center py-8">Cargando usuarios…</p>
          ) : usuarios.length === 0 ? (
            <EmptyState
              icon="group"
              title="Sin usuarios"
              description="Aún no hay usuarios registrados en la aplicación."
            />
          ) : (
            usuarios.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 p-4 rounded-lg bg-surface hover:bg-surface-container-low transition-colors ghost-border items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{u.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                </div>
                <div className="text-sm text-on-surface-variant">
                  <span className="md:hidden font-semibold mr-2">Teléfono:</span>
                  {u.phone || '—'}
                </div>
                <div className="text-sm text-on-surface-variant">
                  <span className="md:hidden font-semibold mr-2">Registro:</span>
                  {formatFecha(u.createdAt)}
                </div>
                <div className="text-sm text-on-surface-variant">
                  <span className="md:hidden font-semibold mr-2">Último acceso:</span>
                  {formatFecha(u.lastSignInAt)}
                </div>
                <div className="flex items-center justify-end gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      u.confirmed ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                    }`}
                  >
                    {u.confirmed ? 'Confirmado' : 'Pendiente'}
                  </span>
                  {u.id !== user?.id && (
                    <button
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-error/10 text-error hover:bg-error hover:text-on-error"
                      onClick={() => setBorrando(u)}
                    >
                      <Icon name="delete" size={16} />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirm delete modal */}
      {borrando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setBorrando(null)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_24px_60px_rgba(11,28,48,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-error/10 text-error flex-shrink-0">
                <Icon name="warning" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-xl text-on-surface mb-1">Eliminar usuario</h3>
                <p className="text-sm text-on-surface-variant">
                  Se eliminará a <strong className="text-on-surface">{borrando.email}</strong> y todo su historial
                  (movimientos, cuentas y perfil). Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                onClick={() => setBorrando(null)}
              >
                Cancelar
              </button>
              <button
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-error text-on-error hover:bg-error/90 transition-colors disabled:opacity-60"
                disabled={procesando}
                onClick={confirmarBorrado}
              >
                {procesando ? 'Eliminando…' : 'Eliminar usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
