import { supabase } from '@/server/supabase.service'
import { cachedQuery } from '@/lib/query-cache'

export type AccountType = 'payable' | 'receivable'

export async function SelectAccounts(userId: string, type: AccountType) {
  return cachedQuery(
    `u:${userId}:accounts:${type}`,
    async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
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
