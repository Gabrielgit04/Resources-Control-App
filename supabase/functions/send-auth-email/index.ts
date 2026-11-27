// @ts-nocheck
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
const hookSecret = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '').replace('v1,whsec_', '')
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const fromEmail = Deno.env.get('AUTH_FROM_EMAIL') ?? Deno.env.get('REMINDER_FROM_EMAIL') ?? ''

const SUBJECTS: Record<string, string> = {
  signup: 'Confirma tu correo en G-amount',
  invite: 'Has sido invitado a G-amount',
  magiclink: 'Tu enlace de acceso a G-amount',
  recovery: 'Restablece tu contraseña de G-amount',
  email_change: 'Confirma tu nueva dirección de correo',
  reauthentication: 'Tu código de verificación de G-amount',
  email: 'Tu código de verificación de G-amount',
  password_changed_notification: 'Tu contraseña de G-amount ha cambiado',
  email_changed_notification: 'Tu correo de G-amount ha cambiado',
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function buildHtml(title: string, message: string, url?: string, token?: string): string {
  const action = url
    ? `<a href="${escapeHtml(url)}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#006d32;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;">Continuar</a>`
    : token
      ? `<p style="margin-top:24px;padding:16px;background:#f4f4f5;border-radius:8px;font-size:24px;font-weight:700;letter-spacing:4px;text-align:center;">${escapeHtml(token)}</p>`
      : ''

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
      <div style="background:#006d32;padding:20px 24px;">
        <h1 style="margin:0;color:#ffffff;font-size:18px;">G-amount</h1>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">${escapeHtml(title)}</h2>
        <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">${escapeHtml(message)}</p>
        ${action}
        <p style="margin-top:24px;color:#6b7280;font-size:12px;">
          Si no solicitaste esto, puedes ignorar este correo. El enlace o código caduca pronto y solo se puede usar una vez.
        </p>
      </div>
    </div>
  </div>`
}

function verifyUrl(tokenHash: string, actionType: string, redirectTo: string): string {
  const params = new URLSearchParams({
    token: tokenHash,
    type: actionType,
    redirect_to: redirectTo,
  })
  return `${supabaseUrl}/auth/v1/verify?${params.toString()}`
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!to) return
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromEmail, to: [to], subject, html }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Error enviando correo de autenticación: ${detail}`)
  }
}

function errorResponse(message: string, status = 200): Response {
  return Response.json({ error: { http_code: status, message } }, { status })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return errorResponse('Método no permitido', 400)
  }
  if (!resendKey || !hookSecret) {
    return errorResponse('Falta RESEND_API_KEY o SEND_EMAIL_HOOK_SECRET en los secrets de Supabase')
  }
  if (!fromEmail || /@resend\.dev/i.test(fromEmail)) {
    return errorResponse('Verifica un dominio en Resend y configura AUTH_FROM_EMAIL con ese dominio')
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  let event: any
  try {
    event = new Webhook(hookSecret).verify(payload, headers) as any
  } catch {
    console.error('send-auth-email: firma del hook inválida')
    return errorResponse('Firma del hook de autenticación inválida', 401)
  }

  const user = event.user ?? {}
  const data = event.email_data ?? {}
  const actionType = String(data.email_action_type ?? '')
  const subject = SUBJECTS[actionType] ?? 'Notificación de G-amount'
  const redirectTo = data.redirect_to || `${supabaseUrl}/auth/v1`

  try {
    if (actionType === 'email_change' && data.token_hash_new && data.token_new) {
      await send(
        user.email,
        subject,
        buildHtml(
          'Confirma este cambio',
          'Recibimos una solicitud para cambiar tu dirección de correo. Confirma desde tu dirección actual.',
          verifyUrl(data.token_hash_new, actionType, redirectTo),
        ),
      )
      await send(
        user.new_email,
        subject,
        buildHtml(
          'Confirma tu nueva dirección',
          'Confirma esta dirección como tu nuevo correo en G-amount.',
          verifyUrl(data.token_hash, actionType, redirectTo),
        ),
      )
    } else {
      const usesLink = ['signup', 'invite', 'magiclink', 'recovery', 'email_change'].includes(actionType)
      await send(
        usesLink ? user.email : user.new_email || user.email,
        subject,
        buildHtml(
          subject,
          `Usa el siguiente ${usesLink ? 'enlace' : 'código'} para completar la acción en G-amount.`,
          usesLink ? verifyUrl(data.token_hash, actionType, redirectTo) : undefined,
          usesLink ? undefined : data.token,
        ),
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo enviar el correo'
    console.error('send-auth-email falló:', message)
    return errorResponse(message)
  }

  console.log('send-auth-email enviado:', actionType)
  return Response.json({})
})
