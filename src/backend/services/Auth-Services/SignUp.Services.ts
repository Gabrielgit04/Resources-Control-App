import { supabase } from '@/server/supabase.service'
import { isEmail, isStrongPassword, isTextOnly } from '@/lib/validation'
import type { User } from '../../utils/types'

export type RegisterUserData = Pick<User, 'name' | 'email' | 'password'>

export type RegisterUserResult =
  | { ok: true; user: { id: string; email: string } }
  | { ok: false; error: string }

export async function RegisterUser(userData: RegisterUserData): Promise<RegisterUserResult> {
  const { name, email, password } = userData

  // 1) Validación de los datos recibidos
  if (!name.trim() || !email || !password) {
    return { ok: false, error: 'Nombre, correo y contraseña son obligatorios.' }
  }
  if (!isTextOnly(name)) {
    return { ok: false, error: 'El nombre solo puede contener letras y espacios.' }
  }
  if (!isEmail(email)) {
    return { ok: false, error: 'Ingresa un correo electrónico válido.' }
  }
  if (!isStrongPassword(password)) {
    return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres e incluir letras y números.' }
  }

  // 2) Crear la identidad en Supabase Auth (hashea la contraseña por nosotros)
  const { data: auth, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })

  if (authError) {
    return { ok: false, error: authError.message }
  }

  const userId = auth.user?.id
  if (!userId) {
    return {
      ok: false,
      error:
        'Supabase no devolvió el usuario. Si la confirmación por email está activa, el usuario debe confirmar antes de poder iniciar sesión.',
    }
  }

  // 3) El perfil en `public.users` se crea automáticamente por el trigger
  //    `on_auth_user_created` (migración supabase/migrations). No insertar aquí.

  // 4) Éxito
  return { ok: true, user: { id: userId, email } }
}
