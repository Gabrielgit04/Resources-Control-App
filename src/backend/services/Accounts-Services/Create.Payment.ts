import { supabase } from '@/server/supabase.service'
import { invalidateAll } from '@/lib/query-cache'

export async function CreatePayment(data: { accountId: string; amount: number; notes?: string }) {
  const { accountId, amount, notes } = data

  if (!accountId) {
    return { ok: false, error: 'Cuenta inválida.' }
  }
  if (amount === undefined || amount === null || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'El monto debe ser mayor a cero.' }
  }

  const { data: row, error } = await supabase
    .from('payments')
    .insert({
      account_id: accountId,
      amount,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  invalidateAll()
  return { ok: true, data: row }
}
