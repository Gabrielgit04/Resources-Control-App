import { supabase } from '@/server/supabase.service'
import { isFreeText } from '@/lib/validation'
import { invalidateAll } from '@/lib/query-cache'
import type { UserMovements } from '@/backend/utils/types'

export async function CreateMovement(movementData: UserMovements) {
  const { userId, mount, description, type, category, currency = 'USD' } = movementData

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

  const { data, error } = await supabase
    .from('movements')
    .insert({
      user_id: userId,
      mount,
      description,
      type,
      category,
      currency,
    })
    .select()
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  invalidateAll()
  return { ok: true, data }
}
