import { supabase } from '@/server/supabase.service'
import { cachedQuery } from '@/lib/query-cache'

export async function SelectPayments(accountId: string) {
  return cachedQuery(
    `payments:${accountId}`,
    async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })

      if (error) {
        return { ok: false, error: error.message }
      }

      return { ok: true, data: data ?? [] }
    },
    30_000,
    { isError: (r) => !r.ok }
  )
}
