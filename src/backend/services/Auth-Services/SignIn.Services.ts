import { supabase } from '@/server/supabase.service'
import { IsSuperAdmin } from '@/backend/services/Admin-Services/AdminUsers'

interface SignInData {
    email: string
    password: string
}

export type SignInResult =
    | { ok: true; data: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data']; isAdmin: boolean }
    | { ok: false; error: string; suspended?: boolean }

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
            // GoTrue devuelve "User is banned" (código `banned`) para cuentas suspendidas.
            const suspended = signInError.code === 'banned' || /banned/i.test(signInError.message)
            return {
                ok: false,
                error: 'Tu cuenta ha sido suspendida temporalmente.',
                suspended,
            }
        }

        // const userId = data.user?.id
        // console.info('[SignIn] Sesión iniciada para userId:', userId)

        let isAdmin = false
        try {
            isAdmin = await IsSuperAdmin()
        } catch (err) {
            console.error(`[SignIn] Falló la verificación de superadmin`, err)
        }

        return { ok: true, data, isAdmin }
    } catch (err: any) {
        return { ok: false, error: err?.message ?? 'Error al iniciar sesión.' }
    }
}


