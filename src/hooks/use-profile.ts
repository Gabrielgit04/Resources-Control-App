import { useCallback, useEffect, useState } from 'react'
import type { UserProfile } from '@/backend/utils/types'
import {
  GetUserProfile,
  UpdateUserName,
  UpdateUserPhone,
  UpdateUserEmail,
  UploadUserAvatar,
} from '@/backend/config/profile-user/Profile.User'

type Result = { ok: boolean; error?: string }

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const res = await GetUserProfile(userId)
    setLoading(false)
    if (res.ok) {
      setProfile(res.data)
    }
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  const updatePhone = async (phone: string): Promise<Result> => {
    if (!userId) return { ok: false, error: 'Usuario no autenticado.' }
    const res = await UpdateUserPhone(userId, phone)
    if (!res.ok) return { ok: false, error: res.error }
    setProfile((p) => (p ? { ...p, phone: res.data.phone } : p))
    return { ok: true }
  }

  const updateName = async (name: string): Promise<Result> => {
    if (!userId) return { ok: false, error: 'Usuario no autenticado.' }
    const res = await UpdateUserName(userId, name)
    if (!res.ok) return { ok: false, error: res.error }
    setProfile((p) => (p ? { ...p, name: res.data.name } : p))
    return { ok: true }
  }

  const updateEmail = async (email: string): Promise<Result> => {
    const res = await UpdateUserEmail(email)
    if (!res.ok) return { ok: false, error: res.error }
    return { ok: true }
  }

  const uploadAvatar = async (file: File): Promise<Result> => {
    if (!userId) return { ok: false, error: 'Usuario no autenticado.' }
    const res = await UploadUserAvatar(userId, file)
    if (!res.ok) return { ok: false, error: res.error }
    setProfile((p) => (p ? { ...p, avatar: res.data.avatar } : p))
    return { ok: true }
  }

  return { profile, loading, reload, updatePhone, updateName, updateEmail, uploadAvatar }
}
