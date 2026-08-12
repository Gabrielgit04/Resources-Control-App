// @ts-nocheck
// Módulo de administración de usuarios (solo superadmin).
// La autorización se valida con el JWT del usuario contra SUPERADMIN_USER_ID.
// El listado/borrado usa la admin API (service role) → las FKs con
// `on delete cascade` limpian movimientos, cuentas y perfil del usuario.
// Desplegar con: supabase functions deploy admin-users --no-verify-jwt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonResponse, rateLimit, requireUser } from '../_shared/middleware.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const superadminId = Deno.env.get('SUPERADMIN_USER_ID') ?? ''
const supabase = createClient(supabaseUrl, serviceRoleKey)

const PAGE_SIZE = 100

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (!serviceRoleKey) {
    return jsonResponse({ ok: false, error: 'Falta SUPABASE_SERVICE_ROLE_KEY' }, 500)
  }

  const auth = await requireUser(req)
  if (auth instanceof Response) return auth

  if (!superadminId || auth.userId !== superadminId) {
    return jsonResponse({ ok: false, error: 'Acceso denegado' }, 403)
  }

  // Endurecimiento: limita la frecuencia por usuario autenticado.
  const limitado = await rateLimit(supabase, `admin-users:${auth.userId}`, 120, 60 * 1000)
  if (limitado) return limitado

  if (req.method === 'GET') {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: PAGE_SIZE })
    if (error) {
      return jsonResponse({ ok: false, error: error.message }, 500)
    }
    const usuarios = (data?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? '',
      name: u.user_metadata?.full_name ?? u.email?.split('@')[0] ?? '',
      phone: u.phone ?? '',
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at,
      confirmed: Boolean(u.email_confirmed_at ?? u.confirmed_at),
    }))
    return jsonResponse({ ok: true, data: { usuarios } })
  }

  if (req.method === 'POST') {
    let body: { action?: string; userId?: string }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ ok: false, error: 'Body JSON inválido' }, 400)
    }

    if (body.action === 'delete') {
      const userId = body.userId ?? ''
      if (!userId) {
        return jsonResponse({ ok: false, error: 'Falta userId' }, 400)
      }
      if (userId === superadminId) {
        return jsonResponse({ ok: false, error: 'No puedes eliminar al superadmin' }, 400)
      }
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) {
        return jsonResponse({ ok: false, error: error.message }, 500)
      }
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ ok: false, error: 'Acción no soportada' }, 400)
  }

  return jsonResponse({ ok: false, error: 'Método no soportado' }, 405)
})
