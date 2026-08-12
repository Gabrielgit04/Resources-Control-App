import { supabase } from '@/server/supabase.service'

export async function SelectPayments(accountId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: data ?? [] }
}
