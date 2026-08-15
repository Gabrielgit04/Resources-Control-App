import { supabase } from '@/server/supabase.service'
import { cachedQuery } from '@/lib/query-cache'

export async function GetCurrencySettings(userId: string) {
  return cachedQuery(
    `u:${userId}:currency`,
    async () => {
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
    },
    30_000,
    { isError: (r) => !r.ok }
  )
}
