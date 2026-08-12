import { supabase } from '@/server/supabase.service'

export async function SelectMovements(userId: string) {
  const { data, error } = await supabase
    .from('movements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: data ?? [] }
}
