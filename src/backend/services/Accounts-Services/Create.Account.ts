import { supabase } from '@/server/supabase.service'

export type AccountType = 'payable' | 'receivable'
export type InterestPeriod = 'weekly' | 'monthly'

export async function CreateAccount(data: {
  userId: string
  type: AccountType
  counterparty: string
  description: string
  amount: number
  dueDate?: string | null
  interestRate?: number | null
  interestPeriod?: InterestPeriod | null
  currency?: string
}) {
  const { userId, type, counterparty, description, amount, dueDate, interestRate, interestPeriod, currency } = data

  if (!userId) {
    return { ok: false, error: 'Usuario no autenticado.' }
  }
  if (type !== 'payable' && type !== 'receivable') {
    return { ok: false, error: 'Tipo de cuenta inválido.' }
  }
  if (!counterparty || !counterparty.trim()) {
    return { ok: false, error: 'Agrega la contraparte.' }
  }
  if (!description || !description.trim()) {
    return { ok: false, error: 'Agrega una descripción.' }
  }
  if (!amount || amount <= 0) {
    return { ok: false, error: 'El monto debe ser mayor a cero.' }
  }
  if (interestRate && interestRate < 0) {
    return { ok: false, error: 'El interés no puede ser negativo.' }
  }
  if (interestRate && interestPeriod !== 'weekly' && interestPeriod !== 'monthly') {
    return { ok: false, error: 'Selecciona un periodo de interés válido.' }
  }
  if (currency && !['USD', 'EUR', 'VES'].includes(currency)) {
    return { ok: false, error: 'Moneda inválida.' }
  }

  const { data: row, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      type,
      counterparty: counterparty.trim(),
      description: description.trim(),
      amount,
      due_date: dueDate || null,
      currency: currency || 'USD',
      interest_rate: interestRate || 0,
      interest_period: interestRate && interestPeriod ? interestPeriod : null,
    })
    .select()
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: row }
}
