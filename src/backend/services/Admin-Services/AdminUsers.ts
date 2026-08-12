import { supabase } from '@/server/supabase.service'

const ADMIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`

export interface AdminUser {
  id: string
  email: string
  name: string
  phone: string
  createdAt: string
  lastSignInAt: string | null
  confirmed: boolean
}

export interface ListUsersResult {
  ok: boolean
  error?: string
  data?: { usuarios: AdminUser[] }
}

async function call(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const res = await fetch(`${ADMIN_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  return res.json() as Promise<{ ok: boolean; error?: string; data?: { usuarios: AdminUser[] } }>
}

/** Lista los usuarios de la app (solo superadmin). */
export async function ListUsers(): Promise<ListUsersResult> {
  return call('')
}

/** Elimina un usuario y todo su historial (solo superadmin). */
export async function DeleteUser(userId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await call('', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', userId }),
  })
  return { ok: res.ok, error: res.error }
}

/** ¿El usuario actual es el superadmin configurado? */
export function IsSuperAdmin(userId?: string): boolean {
  const id = import.meta.env.VITE_SUPERADMIN_USER_ID as string | undefined
  return Boolean(id && userId && userId === id)
}
