import { supabase } from '@/server/supabase.service'
import { isFreeText, isTextOnly } from '@/lib/validation'
import { invalidateAll } from '@/lib/query-cache'
import { isSupportedCurrency } from '@/lib/currency'

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
  if (!isTextOnly(counterparty)) {
    return { ok: false, error: 'La contraparte solo puede contener letras y espacios.' }
  }
  if (!description || !description.trim()) {
    return { ok: false, error: 'Agrega una descripción.' }
  }
  if (!isFreeText(description)) {
    return { ok: false, error: 'La descripción contiene caracteres no permitidos.' }
  }
  if (amount === undefined || amount === null || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'El monto debe ser mayor a cero.' }
  }
  if (interestRate !== null && interestRate !== undefined && (!Number.isFinite(interestRate) || interestRate < 0)) {
    return { ok: false, error: 'El interés no puede ser negativo.' }
  }
  if (interestRate && interestRate > 100) {
    return { ok: false, error: 'El interés no puede superar el 100%.' }
  }
  if (interestRate && interestPeriod !== 'weekly' && interestPeriod !== 'monthly') {
    return { ok: false, error: 'Selecciona un periodo de interés válido.' }
  }
  if (currency && !isSupportedCurrency(currency)) {
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

  invalidateAll()
  return { ok: true, data: row }
}
