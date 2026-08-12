import { supabase } from '@/server/supabase.service'

interface SignInData {
    email: string
    password: string
}

export async function SignInUser(userData: SignInData) {
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

        return { ok: true, data }
    } catch (err: any) {
        return { ok: false, error: err?.message ?? 'Error al iniciar sesión.' }
    }
}


