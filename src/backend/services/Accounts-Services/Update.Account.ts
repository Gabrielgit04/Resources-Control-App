import { supabase } from '@/server/supabase.service'
import { isFreeText, isTextOnly } from '@/lib/validation'
import { invalidateAll } from '@/lib/query-cache'
import type { InterestPeriod } from './Create.Account'

export async function UpdateAccount(data: {
  accountId: string
  userId: string
  counterparty: string
  description: string
  amount: number
  dueDate?: string | null
  interestRate?: number | null
  interestPeriod?: InterestPeriod | null
  currency?: string
  paid?: number
}) {
  const { accountId, userId, counterparty, description, amount, dueDate, interestRate, interestPeriod, currency, paid } = data

  if (!accountId) {
    return { ok: false, error: 'Cuenta inválida.' }
  }
  if (!userId) {
    return { ok: false, error: 'Usuario no autenticado.' }
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
  if (typeof paid === 'number' && amount < paid) {
    return { ok: false, error: `El monto no puede ser menor a lo ya abonado (${paid}).` }
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
  if (currency && !['USD', 'EUR', 'VES'].includes(currency)) {
    return { ok: false, error: 'Moneda inválida.' }
  }

  const { data: row, error } = await supabase
    .from('accounts')
    .update({
      counterparty: counterparty.trim(),
      description: description.trim(),
      amount,
      due_date: dueDate || null,
      currency: currency || 'USD',
      interest_rate: interestRate || 0,
      interest_period: interestRate && interestPeriod ? interestPeriod : null,
    })
    .eq('id', accountId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  invalidateAll()
  return { ok: true, data: row }
}
