// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonResponse, rateLimit, requireUser, verifyCronSecret } from '../_shared/middleware.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
const fromEmail = Deno.env.get('REMINDER_FROM_EMAIL') ?? 'G-Finances <onboarding@resend.dev>'
const advanceDays = Number(Deno.env.get('REMINDER_ADVANCE_DAYS') ?? '2')

const supabase = createClient(supabaseUrl, serviceRoleKey)

function symbolOf(currency: string): string {
  if (currency === 'EUR') return '€'
  if (currency === 'VES') return 'Bs '
  return '$'
}

function formatMoney(amount: number, currency: string): string {
  return `${symbolOf(currency)}${Number(amount).toFixed(2)}`
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function buildHtml(list: any[]): string {
  const rows = list
    .map((a) => {
      const tipo = a.type === 'payable' ? 'Pagar' : 'Cobrar'
      const estado = a.vencida ? 'Vencida' : 'Próxima'
      const color = a.vencida ? '#b3261e' : '#006d32'
      return `
        <tr style="border-bottom: 1px solid #e4e4e7;">
          <td style="padding:10px 12px;font-size:14px;color:#111827;">${escapeHtml(a.counterparty)}</td>
          <td style="padding:10px 12px;font-size:14px;color:#4b5563;">${escapeHtml(a.description)}</td>
          <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#111827;text-align:right;">${formatMoney(a.amount - a.paid, a.currency)}</td>
          <td style="padding:10px 12px;font-size:14px;color:#4b5563;white-space:nowrap;">${formatDate(a.due_date)}</td>
          <td style="padding:10px 12px;font-size:14px;white-space:nowrap;">
            <span style="background:${color}15;color:${color};padding:2px 8px;border-radius:999px;font-weight:600;">${estado} · ${tipo}</span>
          </td>
        </tr>`
    })
    .join('')

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
      <div style="background:#006d32;padding:20px 24px;">
        <h1 style="margin:0;color:#ffffff;font-size:18px;">G-Finances · Recordatorios de cuentas</h1>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;color:#111827;font-size:14px;line-height:1.6;">
          Tienes ${list.length} cuenta(s) por cobrar o pagar próximas a vencer. Revisa el detalle para no dejar
          saldos pendientes.
        </p>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f4f4f5;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;">Contraparte</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;">Concepto</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;text-transform:uppercase;color:#6b7280;">Restante</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;">Vence</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;">Estado</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin:20px 0 0;color:#6b7280;font-size:12px;">
          Este mensaje fue generado automáticamente por G-Finances. No respondas a este correo.
        </p>
      </div>
    </div>
  </div>`
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (!resendKey) {
    return jsonResponse({ ok: false, error: 'Falta RESEND_API_KEY' }, 500)
  }
  if (!serviceRoleKey) {
    return jsonResponse({ ok: false, error: 'Falta SUPABASE_SERVICE_ROLE_KEY' }, 500)
  }

  // Auth: permite llamadas del cron (x-cron-secret) o de un usuario autenticado.
  const esCron = verifyCronSecret(req)
  let userId: string | null = null
  if (!esCron) {
    const auth = await requireUser(req)
    if (auth instanceof Response) return auth
    userId = auth.userId
  }

  // Rate limiting: distinto por usuario (2/hora) y global para cron (5/hora).
  const limitKey = esCron ? 'send-reminders:cron' : `send-reminders:user:${userId}`
  const limitado = await rateLimit(supabase, limitKey, esCron ? 5 : 2, 60 * 60 * 1000)
  if (limitado) return limitado

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const limite = new Date(hoy)
  limite.setDate(limite.getDate() + advanceDays)
  const hoyIso = hoy.toISOString().slice(0, 10)
  const limiteIso = limite.toISOString().slice(0, 10)

  let query = supabase
    .from('accounts')
    .select('user_id, type, counterparty, description, amount, paid, due_date, currency')
    .not('due_date', 'is', null)
    .lte('due_date', limiteIso)
    .order('due_date', { ascending: true })

  if (userId) query = query.eq('user_id', userId)

  const { data: accounts, error } = await query

  if (error) {
    return jsonResponse({ ok: false, error: error.message }, 500)
  }

  const pendientes = (accounts ?? []).filter((a) => Number(a.paid) < Number(a.amount))
  if (pendientes.length === 0) {
    return jsonResponse({ enviados: 0, mensaje: 'No hay cuentas pendientes' })
  }

  const userIds = [...new Set(pendientes.map((a) => a.user_id))]
  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('user_id, email, name')
    .in('user_id', userIds)

  if (uErr) {
    return jsonResponse({ ok: false, error: uErr.message }, 500)
  }

  const byUser = new Map<string, any[]>()
  for (const a of pendientes) {
    const vencida = (a.due_date ?? '') < hoyIso
    const item = { ...a, vencida }
    if (!byUser.has(a.user_id)) byUser.set(a.user_id, [])
    byUser.get(a.user_id)!.push(item)
  }

  let enviados = 0
  for (const [userId, list] of byUser) {
    const user = users?.find((u) => u.user_id === userId)
    if (!user?.email) continue
    const subject = `G-Finances: ${list.length} cuenta(s) próximas a vencer`
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [user.email],
        subject,
        html: buildHtml(list),
      }),
    })
    if (res.ok) enviados += 1
  }

  return jsonResponse({ enviados, usuarios: byUser.size })
})
