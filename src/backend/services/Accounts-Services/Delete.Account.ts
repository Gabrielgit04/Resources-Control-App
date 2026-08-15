import { supabase } from '@/server/supabase.service'
import { invalidateAll } from '@/lib/query-cache'

export async function DeleteAccount(data: { accountId: string; userId: string }) {
  const { accountId, userId } = data

  if (!accountId) {
    return { ok: false, error: 'Cuenta inválida.' }
  }
  if (!userId) {
    return { ok: false, error: 'Usuario no autenticado.' }
  }

  const { error: payError } = await supabase
    .from('payments')
    .delete()
    .eq('account_id', accountId)

  if (payError) {
    return { ok: false, error: `No se pudo eliminar el historial de abonos: ${payError.message}` }
  }

  const { error: accError } = await supabase
    .from('accounts')
    .delete()
    .eq('id', accountId)
    .eq('user_id', userId)

  if (accError) {
    return { ok: false, error: accError.message }
  }

  invalidateAll()
  return { ok: true }
}
