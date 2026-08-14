import { supabase } from '@/server/supabase.service'
import { IsSuperAdmin } from '@/backend/services/Admin-Services/AdminUsers'

interface SignInData {
    email: string
    password: string
}

export type SignInResult =
    | { ok: true; data: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data']; isAdmin: boolean }
    | { ok: false; error: string }

export async function SignInUser(userData: SignInData): Promise<SignInResult> {
    const { email, password } = userData
    if (!email || !password) {
        return { ok: false, error: 'Correo y contraseña son obligatorios.' }
    }

    try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (signInError) {
            return { ok: false, error: "Verifica tu email o contraseña, e inténtalo de nuevo." }
        }

        const userId = data.user?.id
        console.info('[SignIn] Sesión iniciada para userId:', userId)

        let isAdmin = false
        try {
            isAdmin = await IsSuperAdmin()
        } catch (err) {
            console.error(`[SignIn] Falló la verificación de superadmin para userId ${userId}:`, err)
        }

        return { ok: true, data, isAdmin }
    } catch (err: any) {
        return { ok: false, error: err?.message ?? 'Error al iniciar sesión.' }
    }
}


