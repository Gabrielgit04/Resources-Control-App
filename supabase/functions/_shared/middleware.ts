// Middlewares reutilizables para Edge Functions de Supabase.
// Se comparte a través de la carpeta `_shared` (Supabase la incluye en cada deploy).
import { createRemoteJWKSet, jwtVerify } from 'https://esm.sh/jose@5'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

/** Devuelve la respuesta CORS para preflight (OPTIONS) o `null` para continuar. */
export function handleCors(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders })
  }
  return null
}

/** Respuesta JSON uniforme con cabeceras CORS. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseJwksUrl = Deno.env.get('SUPABASE_JWKS_URL') ?? ''

const getJwks = supabaseJwksUrl ? createRemoteJWKSet(new URL(supabaseJwksUrl)) : null

export type AuthResult = { userId: string } | Response

/**
 * Valida el JWT de Supabase (Authorization: Bearer <token>) contra las JWKS del proyecto.
 * Devuelve el `sub` del usuario o una Response 401.
 */
export async function requireUser(request: Request): Promise<AuthResult> {
  if (!getJwks) {
    return jsonResponse({ ok: false, error: 'Falta SUPABASE_JWKS_URL en el entorno' }, 500)
  }
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return jsonResponse({ ok: false, error: 'Falta token de autorización' }, 401)
  }
  try {
    const { payload } = await jwtVerify(token, getJwks, {
      issuer: `${supabaseUrl}/auth/v1`,
    })
    const userId = (payload as Record<string, unknown>).sub
    if (!userId || typeof userId !== 'string') {
      return jsonResponse({ ok: false, error: 'Token sin usuario' }, 401)
    }
    return { userId }
  } catch {
    return jsonResponse({ ok: false, error: 'Token inválido o expirado' }, 401)
  }
}

/**
 * Permite llamadas de cron (pg_cron/pg_net) validando la cabecera `x-cron-secret`
 * contra el secreto `CRON_SECRET` de la función.
 */
export function verifyCronSecret(request: Request): boolean {
  const secret = Deno.env.get('CRON_SECRET')
  if (!secret) return false
  return request.headers.get('x-cron-secret') === secret
}

/**
 * Rate limiting simple respaldado por la tabla `rate_limits` (vía service role).
 * Devuelve una Response 429 si se supera el límite, o `null` si la petición continúa.
 * Si la tabla no existe (migración pendiente) se ignora silenciosamente.
 */
export async function rateLimit(
  client: SupabaseClient,
  key: string,
  limit: number,
  windowMs: number
): Promise<Response | null> {
  const now = Date.now()

  await client.from('rate_limits').delete().lt('window_end', new Date(now - windowMs).toISOString())

  const { data, error } = await client
    .from('rate_limits')
    .select('window_end, count')
    .eq('key', key)
    .maybeSingle()

  if (error) return null

  if (!data || new Date(data.window_end).getTime() < now) {
    await client.from('rate_limits').upsert(
      { key, window_end: new Date(now + windowMs).toISOString(), count: 1 },
      { onConflict: 'key' }
    )
    return null
  }

  if (data.count >= limit) {
    return jsonResponse({ ok: false, error: 'Demasiadas peticiones. Intenta más tarde.' }, 429)
  }

  await client.from('rate_limits').update({ count: data.count + 1 }).eq('key', key)
  return null
}
