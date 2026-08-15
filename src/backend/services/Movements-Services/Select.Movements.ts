import { supabase } from '@/server/supabase.service'
import { cachedQuery } from '@/lib/query-cache'

export async function SelectMovements(userId: string) {
  return cachedQuery(
    `u:${userId}:movements`,
    async () => {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .eq('user_id', userId)
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
