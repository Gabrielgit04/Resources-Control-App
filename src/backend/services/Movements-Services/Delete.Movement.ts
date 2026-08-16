import { supabase } from '@/server/supabase.service'
import { invalidateAll } from '@/lib/query-cache'

export async function DeleteMovement(data: { id: string; userId: string }) {
  const { id, userId } = data

  if (!id) {
    return { ok: false, error: 'Movimiento inválido.' }
  }
  if (!userId) {
    return { ok: false, error: 'Usuario no autenticado.' }
  }

  const { error } = await supabase.from('movements').delete().eq('id', id).eq('user_id', userId)

  if (error) {
    return { ok: false, error: error.message }
  }

  invalidateAll()
  return { ok: true }
}
