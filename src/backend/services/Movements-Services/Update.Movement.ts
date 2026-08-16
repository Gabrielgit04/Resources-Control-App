import { supabase } from '@/server/supabase.service'
import { isFreeText } from '@/lib/validation'
import { invalidateAll } from '@/lib/query-cache'

export async function UpdateMovement(data: {
  id: string
  userId: string
  mount: number
  description: string
  type: 'ingreso' | 'egreso'
  category: string
  currency?: string
}) {
  const { id, userId, mount, description, type, category, currency } = data

  if (!id) {
    return { ok: false, error: 'Movimiento inválido.' }
  }
  if (!userId) {
    return { ok: false, error: 'Usuario no autenticado.' }
  }
  if (mount === undefined || mount === null || !Number.isFinite(mount) || mount <= 0) {
    return { ok: false, error: 'El monto debe ser mayor a cero.' }
  }
  if (!description || !description.trim()) {
    return { ok: false, error: 'Agrega una descripción.' }
  }
  if (!isFreeText(description)) {
    return { ok: false, error: 'La descripción contiene caracteres no permitidos.' }
  }
  if (type !== 'ingreso' && type !== 'egreso') {
    return { ok: false, error: 'Tipo de movimiento inválido.' }
  }
  if (!category) {
    return { ok: false, error: 'Selecciona una categoría.' }
  }

  const { data: row, error } = await supabase
    .from('movements')
    .update({ mount, description, type, category, currency: currency || 'USD' })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  invalidateAll()
  return { ok: true, data: row }
}
