import { supabase } from '@/server/supabase.service'

export async function GetCurrencySettings(userId: string) {
  const { data, error } = await supabase
    .from('currency_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return { ok: false, error: error.message }
  }

  return {
    ok: true,
    data: data ?? { user_id: userId, base_currency: 'USD', rates: {} },
  }
}
