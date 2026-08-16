import { supabase } from '@/server/supabase.service'
import { invalidateAll } from '@/lib/query-cache'
import { isSupportedCurrency } from '@/lib/currency'

export async function UpsertCurrencySettings(data: {
  userId: string
  baseCurrency: string
  rates: Record<string, number>
}) {
  const { userId, baseCurrency, rates } = data

  if (!userId) {
    return { ok: false, error: 'Usuario no autenticado.' }
  }
  if (!isSupportedCurrency(baseCurrency)) {
    return { ok: false, error: 'Moneda base inválida.' }
  }
  for (const value of Object.values(rates)) {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
      return { ok: false, error: 'Las tasas deben ser mayores a cero.' }
    }
  }

  const { data: row, error } = await supabase
    .from('currency_settings')
    .upsert({ user_id: userId, base_currency: baseCurrency, rates })
    .select()
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  invalidateAll()
  return { ok: true, data: row }
}
