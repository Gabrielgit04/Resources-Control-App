import { supabase } from '@/server/supabase.service'
import { isEmail, isStrongPassword, isTextOnly } from '@/lib/validation'
import type { User } from '../../utils/types'

export type RegisterUserData = Pick<User, 'name' | 'email' | 'password'>

export type RegisterUserResult =
  | { ok: true; user: { id: string; email: string }; requiresConfirmation: boolean }
  | { ok: false; error: string }

function friendlyAuthError(message: string): string {
  if (/error sending (confirmation|recovery|invite|magic link)|could not send email|enviando correo de autenticación|no se pudo enviar el correo|api key/i.test(message)) {
    return 'No pudimos enviar el correo de confirmación. Inténtalo de nuevo en unos minutos; si el problema persiste, contacta al administrador.'
  }
  if (/rate limit|too many requests/i.test(message)) {
    return 'Se alcanzó el límite de correos de confirmación. Espera un momento e inténtalo de nuevo.'
  }
  if (/not authorized/i.test(message)) {
    return 'Ese correo no está autorizado para registrarse. Contacta al administrador.'
  }
  if (/already registered|already exists/i.test(message)) {
    return 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.'
  }
  if (/email not confirmed/i.test(message)) {
    return 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada.'
  }
  if (/banned|suspended/i.test(message)) {
    return 'Tu cuenta ha sido suspendida temporalmente.'
  }
  if (/database error|unexpected_failure/i.test(message)) {
    return 'No pudimos crear tu cuenta en este momento. Inténtalo de nuevo más tarde.'
  }
  return message
}

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
    return { ok: false, error: friendlyAuthError(authError.message) }
  }

  const userId = auth.user?.id ?? ''

  // 3) El perfil en `public.users` se crea automáticamente por el trigger
  //    `on_auth_user_created` (migración supabase/migrations). No insertar aquí.

  // 4) Con "Confirm email" activo, Supabase crea el usuario pero no devuelve sesión
  //    hasta que se valida el enlace enviado al correo.
  const requiresConfirmation = !auth.user || !auth.user.email_confirmed_at || auth.session === null

  return { ok: true, user: { id: userId, email }, requiresConfirmation }
}

export async function ResendConfirmation(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!isEmail(email)) {
    return { ok: false, error: 'Ingresa un correo electrónico válido.' }
  }

  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) {
    return { ok: false, error: friendlyAuthError(error.message) }
  }

  return { ok: true }
}
