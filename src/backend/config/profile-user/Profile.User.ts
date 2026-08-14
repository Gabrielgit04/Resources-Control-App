import { supabase } from '@/server/supabase.service'
import { isEmail, isPhone, isTextOnly } from '@/lib/validation'
import type { Email, UserProfile } from '@/backend/utils/types'

export async function GetUserProfile(
  userId: string
): Promise<{ ok: true; data: UserProfile } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone, avatar, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se encontró el perfil.' }
  }

  return {
    ok: true,
    data: {
      id: data.id,
      name: data.name,
      email: data.email as Email,
      phone: data.phone as UserProfile['phone'],
      avatar: data.avatar ?? undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    },
  }
}

export async function UpdateUserPhone(
  userId: string,
  phone: string
): Promise<{ ok: true; data: Pick<UserProfile, 'phone'> } | { ok: false; error: string }> {
  if (!isPhone(phone)) {
    return { ok: false, error: 'Ingresa un número de teléfono válido.' }
  }

  const { error: authError } = await supabase.auth.updateUser({ data: { phone } })
  if (authError) {
    return { ok: false, error: authError.message }
  }

  const { error: dbError } = await supabase
    .from('users')
    .update({ phone })
    .eq('user_id', userId)

  if (dbError) {
    return { ok: false, error: dbError.message }
  }

  return { ok: true, data: { phone } as Pick<UserProfile, 'phone'> }
}

export async function UpdateUserName(
  userId: string,
  name: string
): Promise<{ ok: true; data: Pick<UserProfile, 'name'> } | { ok: false; error: string }> {
  if (!isTextOnly(name)) {
    return { ok: false, error: 'El nombre solo puede contener letras y espacios.' }
  }

  const { error: authError } = await supabase.auth.updateUser({ data: { full_name: name } })
  if (authError) {
    return { ok: false, error: authError.message }
  }

  const { error: dbError } = await supabase
    .from('users')
    .update({ name })
    .eq('user_id', userId)

  if (dbError) {
    return { ok: false, error: dbError.message }
  }

  return { ok: true, data: { name } as Pick<UserProfile, 'name'> }
}

export async function UpdateUserEmail(
  email: string
): Promise<{ ok: true; data: { email: string } } | { ok: false; error: string }> {
  if (!isEmail(email)) {
    return { ok: false, error: 'Ingresa un correo electrónico válido.' }
  }

  const { error } = await supabase.auth.updateUser({ email })
  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: { email } }
}

export async function UploadUserAvatar(
  userId: string,
  file: File
): Promise<{ ok: true; data: { avatar: string } } | { ok: false; error: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatar')
    .upload(path, file, { upsert: true })

  if (uploadError) {
    return { ok: false, error: uploadError.message }
  }

  const avatar = supabase.storage.from('avatar').getPublicUrl(path).data.publicUrl

  const { error: authError } = await supabase.auth.updateUser({ data: { avatar_url: avatar } })
  if (authError) {
    return { ok: false, error: authError.message }
  }

  const { error: dbError } = await supabase
    .from('users')
    .update({ avatar })
    .eq('user_id', userId)

  if (dbError) {
    return { ok: false, error: dbError.message }
  }

  return { ok: true, data: { avatar } }
}
