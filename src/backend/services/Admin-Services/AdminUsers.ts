import { supabase } from '@/server/supabase.service'

export interface AdminUser {
  id: string
  email: string
  name: string
  phone: string
  createdAt: string
  lastSignInAt: string | null
  confirmed: boolean
  suspended: boolean
}

export interface ListUsersResult {
  ok: boolean
  error?: string
  data?: { usuarios: AdminUser[] }
}

interface AdminUserRow {
  id: string
  email: string
  name: string
  phone: string
  created_at: string
  last_sign_in_at: string | null
  confirmed: boolean
  suspended: boolean
}

function mapRow(u: AdminUserRow): AdminUser {
  return {
    id: u.id,
    email: u.email ?? '',
    name: u.name ?? u.email?.split('@')[0] ?? '',
    phone: u.phone ?? '',
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at,
    confirmed: Boolean(u.confirmed),
    suspended: Boolean(u.suspended),
  }
}

/** Lista los usuarios de la app (solo superadmin). */
export async function ListUsers(): Promise<ListUsersResult> {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: { usuarios: ((data ?? []) as AdminUserRow[]).map(mapRow) } }
}

/** Elimina un usuario y todo su historial (solo superadmin). */
export async function DeleteUser(userId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId })
  return error ? { ok: false, error: error.message } : { ok: true }
}

/** Suspende o reactiva un usuario (bloqueo server-side vía banned_until). */
export async function SuspendUser(
  userId: string,
  suspended: boolean,
  reason?: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_suspend_user', {
    p_user_id: userId,
    p_suspended: suspended,
    p_reason: reason?.trim() ? reason.trim() : null,
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}

/** ¿La cuenta actual está suspendida? Leído server-side desde auth.users. */
export async function IsAccountSuspended(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_banned')
  if (error) throw new Error(error.message)
  return (data as boolean) === true
}

/** ¿El usuario actual es el superadmin? Lo decide Postgres (server-side). */
let isAdminCache: Promise<boolean> | null = null
let isAdminCacheUserId: string | null = null

/** Invalida la caché de verificación de superadmin (al cerrar sesión). */
export function clearAdminCache(): void {
  isAdminCache = null
  isAdminCacheUserId = null
}

export async function IsSuperAdmin(): Promise<boolean> {
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user?.id ?? null
  if (!userId) return false

  if (isAdminCacheUserId === userId && isAdminCache) {
    return isAdminCache
  }

  const pending = (async () => {
    const { data: res, error } = await supabase.rpc('is_super_admin')
    if (error) throw new Error(error.message)
    return (res as boolean) === true
  })().catch((err) => {
    clearAdminCache()
    throw err
  })

  isAdminCache = pending
  isAdminCacheUserId = userId
  return pending
}
