import { supabase } from '@/server/supabase.service'

export type AccountType = 'payable' | 'receivable'

export async function SelectAccounts(userId: string, type: AccountType) {
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
}
