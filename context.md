# Contexto de la conversación — App-Finances / G-amount

Repo: `C:\Users\pc\Documents\App-finances\App-Finances`
Proyecto Supabase (ref observada en errores): `wdxvgscwmdzzgjgstkkj`
Stack: React 19 + TypeScript + Vite + Supabase (Auth, Postgres, Edge Functions) + Cloudflare Workers; Resend para correos transaccionales.

## Preferencias y acuerdos

- El usuario pidió responder en español. La interfaz y los textos legales están en español.
- No se realizó ningún commit; los cambios quedan en el working tree.
- Cuando se preguntó si debía excluir/diferir términos y privacidad («exclude terms and privacy, it use after»), el usuario descartó la aclaración; **no se eliminó nada**.
- El usuario pidió detener la sesión de diagnóstico («stop»); se paró sin más cambios. Después aportó el log definitivo de Resend.

## Objetivo general

Añadir páginas legales, cambiar el tagline y, sobre todo, implementar la confirmación de correo al registrarse usando Supabase Auth + Resend, de modo que el enlace llegue a correos reales (Gmail) y no solo al correo del dueño de Resend.

## Decisiones clave

1. **Privacidad y términos**: páginas Spanish en `/privacidad` y `/terminos`, componente compartido `LegalPage`, enlaces desde Login, SignUp, Landing y Sidebar. No se borraron pese a la mención de «excluir».
2. **Tagline**: de `Luminous Engine` a `Tus finanzas en un solo flujo` en `src/config.ts` y `README.md`; se quitaron comentarios obsoletos en Recover/ResetPassword.
3. **Confirmación de registro**: se decidió gestionar en la app el estado «correo pendiente de confirmar» en lugar de navegar al dashboard.
4. **Envío de correos**: se decidió no depender del SMTP integrado de Supabase (2 mensajes/hora y solo a correos del equipo), sino de una Edge Function propia con hook **Send Email** de Supabase Auth que usa el `RESEND_API_KEY` ya existente.
5. **Remitente**: se decidió **no** usar `onboarding@resend.dev` como fallback; exige dominio verificado en Resend para evitar fallos silenciosos.
6. `SEND_EMAIL_HOOK_SECRET` y `RESEND_API_KEY` son claves distintas: la primera autentica Supabase → función; la segunda, función → Resend.
7. `CRON_SECRET` no interviene en la confirmación: solo valida las llamadas del cron (`x-cron-secret`) a `send-reminders`.

## Cambios realizados

### Páginas legales y configuración

- Creado `src/components/legal/LegalPage.tsx` con `LegalSection` y layout compartido; `Privacy.tsx` refactorizado para usarlo.
- Creado `src/pages/Privacy.tsx` (política de privacidad en español) y `src/pages/Terms.tsx` (términos y condiciones, 13 secciones).
- `src/config.ts`: `PRIVACY_CONTACT_EMAIL` (aún placeholder `privacidad@TU-DOMINIO.com`), `PRIVACY_EFFECTIVE_DATE` (`25 de noviembre de 2026`), `TERMS_EFFECTIVE_DATE`, `APP_TAGLINE`.
- `src/App.tsx`: rutas `/privacidad` y `/terminos`.
- Enlaces legales añadidos en `src/pages/Login.tsx`, `src/pages/SignUp.tsx`, `src/pages/Landing.tsx`, `src/components/layout/Sidebar.tsx`.
- En SignUp se sustituyó `href="#"` por `Link to="/terminos"`.
- Se corrigió la política: se eliminó la afirmación de «movimientos inmutables» porque la migración `20260815030000_movements_update_policy.sql` permite actualizar movimientos.

### Registro con confirmación de correo

- `src/backend/services/Auth-Services/SignUp.Services.ts`:
  - `RegisterUserResult` = `{ ok: true; user: { id, email }; requiresConfirmation: boolean } | { ok: false; error: string }`.
  - Llama a `supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })`.
  - `requiresConfirmation = !auth.user || !auth.user.email_confirmed_at || auth.session === null` (confirmación activa puede devolver `user: null` sin error).
  - **Eliminado** el retorno de error `'Supabase no devolvió el usuario creado.'`; ahora significa «confirmación pendiente» y se usa el correo del formulario.
  - `ResendConfirmation(email)` usa `supabase.auth.resend({ type: 'signup', email })`.
  - `friendlyAuthError(message)` traduce errores de Supabase/Resend a español: envío de correo, rate limit, no autorizado, ya registrado, correo no confirmado, usuario suspendido, error de base de datos y valor por defecto.
- `src/pages/SignUp.tsx`:
  - Sin import directo de Supabase; usa `RegisterUser` / `ResendConfirmation` y `RegisterUserResult`.
  - Estado `pendingEmail`, `resending` y `handleResend`.
  - Panel «Revisa tu correo» con botón de reenvío y enlace a `/login`; cabecera condicional.
  - Sin confirmación pendiente muestra toast y `navigate('/dashboard', { replace: true })`.
  - Corrección de build: `setPendingEmail(result.user.email)` (antes variable `email` inexistente → TS2552).
- `src/pages/Login.tsx` **no** se tocó para usuarios sin confirmar: esos intentos siguen contando como fallos.

### Edge Function `send-auth-email` (nueva)

Ruta: `supabase/functions/send-auth-email/index.ts`.

- Importa `Webhook` de `https://esm.sh/standardwebhooks@1.0.0`.
- Secrets: `RESEND_API_KEY`, `SEND_EMAIL_HOOK_SECRET`, `AUTH_FROM_EMAIL` (o `REMINDER_FROM_EMAIL`), `SUPABASE_URL` (automático).
- `SEND_EMAIL_HOOK_SECRET` se limpia con `.replace('v1,whsec_', '')` y verifica firma con `new Webhook(hookSecret).verify(payload, headers)`; si falla → 401 y log.
- Valida que existan key, hook secret y `from`; si `from` es `resend.dev` o falta, devuelve mensaje claro: «Verifica un dominio en Resend y configura AUTH_FROM_EMAIL con ese dominio».
- Plantilla HTML en español con cabecera verde, botón «Continuar» y código OTP cuando aplica.
- Asuntos para `signup`, `invite`, `magiclink`, `recovery`, `email_change`, `reauthentication`, `email` y notificaciones.
- URL de verificación: `${SUPABASE_URL}/auth/v1/verify?token=...&type=...&redirect_to=...`.
- Cambio de correo: envía dos mensajes cuando hay `token_hash_new` / `token_new` (dirección actual y nueva).
- Envía a `https://api.resend.com/emails` con `Authorization: Bearer <RESEND_API_KEY>`.
- Errores: `console.error` + respuesta `{ error: { http_code, message } }` con status 200 por defecto para que Supabase Auth pueda propagar el mensaje; éxito → `{}` y `console.log('send-auth-email enviado:', actionType)`.

### `send-reminders` (existente)

- Ruta: `supabase/functions/send-reminders/index.ts`.
- Antes: `REMINDER_FROM_EMAIL ?? 'G-amount <onboarding@resend.dev>'`.
- Ahora: `REMINDER_FROM_EMAIL ?? ''` y guard temprano que devuelve 500 con «Verifica un dominio en Resend y configura REMINDER_FROM_EMAIL con ese dominio».
- Sigue usando `RESEND_API_KEY`, `verifyCronSecret` y rate limiting.
- Llamada a Resend en la línea ~169; se declaró que funcionaba, pero el dominio de prueba limitaba los destinatarios.

### README

- Sección «Confirmación de correo al registrarse» con activación de **Confirm email**, Site URL/Redirect URLs y límites del SMTP integrado.
- Subsección «Correo de confirmación con Resend (recomendado)» con despliegue del hook, creación del hook HTTPS y secrets.
- Nota explícita sobre el error de Resend: `The resend.dev domain is for testing and can only send to your own email address...` y pasos para verificar dominio en Resend → Domains.
- Lista de despliegue incluye `send-auth-email`.
- Aviso corregido: la migración del cron contiene un valor de ejemplo que debe sustituirse por el `CRON_SECRET` real.

## Errores encontrados y causa final

| Mensaje | Causa | Resolución |
| --- | --- | --- |
| `No API key found in request` en Auth Logs | Hook/config de envío de Supabase Auth llamando a Resend sin cabecera `Authorization` | Hook HTTPS propio con firma y clave del servidor |
| `error sending confirmation email` / `POST .../auth/v1/signup` 500 | Fallo en el proveedor de correo de Supabase Auth | Verificación de firma, logs y Mensajes amigables |
| `TS2552: Cannot find name 'email'` | Variable inexistente en SignUp | `result.user.email` |
| `Supabase no devolvió el usuario creado.` | Guard propio asumiendo que `signUp` siempre devuelve `user` | Tratar `user: null` sin error como confirmación pendiente |
| `The resend.dev domain is for testing and can only send to your own email address. To send to other recipients, verify a domain and update the from address to use it.` | `from = onboarding@resend.dev` | Verificar dominio en Resend y configurar `AUTH_FROM_EMAIL` / `REMINDER_FROM_EMAIL`; se eliminó el fallback |

## Estado actual

- Código listo: app, Edge Functions y documentación.
- `npm run lint` y `npm run build` pasan tras cada cambio. Persiste el aviso de Vite de chunk > 500 kB; no bloquea.
- **Pendiente fuera del repo** (no se puede hacer desde el código sin acceso al dashboard):
  1. Verificar un dominio en Resend (Resend → Domains → registros DNS → **Verified**).
  2. Guardar secrets con el remitente verificado y volver a desplegar las funciones:
     ```bash
     supabase secrets set AUTH_FROM_EMAIL="G-amount <no-reply@tu-dominio.com>"
     supabase secrets set REMINDER_FROM_EMAIL="G-amount <no-reply@tu-dominio.com>"
     supabase functions deploy send-auth-email --no-verify-jwt
     supabase functions deploy send-reminders --no-verify-jwt
     ```
  3. Crear/reemplazar en Supabase → Authentication → Hooks un hook **Send Email** HTTPS hacia `https://wdxvgscwmdzzgjgstkkj.supabase.co/functions/v1/send-auth-email`, generar el secreto y guardarlo:
     ```bash
     supabase secrets set SEND_EMAIL_HOOK_SECRET="v1,whsec_..."
     ```
  4. Confirmar que **Confirm email** está activo y que Site URL/Redirect URLs incluyen el dominio de la app.
  5. Probar un registro con Gmail y revisar Resend → Logs, Edge Functions → send-auth-email → Logs y Supabase → Logs → Auth Logs.
- Seguridad pendiente: rotar el valor fijo `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (hash SHA-256 de cadena vacía) en `supabase/migrations/20260811000010_schedule_reminder_emails.sql:23`, poner el mismo valor en `CRON_SECRET` y volver a ejecutar la migración.
- Legal pendiente: sustituir `PRIVACY_CONTACT_EMAIL` placeholder y revisar textos con criterio legal.

## Archivos relevantes

- `src/config.ts`: constantes de app, tagline y fechas/contacto legales.
- `src/App.tsx`: rutas `/privacidad` y `/terminos`.
- `src/components/legal/LegalPage.tsx`, `src/pages/Privacy.tsx`, `src/pages/Terms.tsx`.
- `src/pages/SignUp.tsx`, `src/pages/Login.tsx`, `src/pages/Landing.tsx`, `src/components/layout/Sidebar.tsx`.
- `src/backend/services/Auth-Services/SignUp.Services.ts`, `src/backend/services/Auth-Services/SignIn.Services.ts` (modificado por el usuario).
- `supabase/functions/send-auth-email/index.ts`: nuevo hook de correo de Auth.
- `supabase/functions/send-reminders/index.ts`: recordatorios con Resend.
- `supabase/functions/_shared/middleware.ts`: `requireUser`, `verifyCronSecret`, `rateLimit`.
- `supabase/migrations/20260811000010_schedule_reminder_emails.sql`: cron diario a las 08:00.
- `supabase/migrations/20260815030000_movements_update_policy.sql`: movimientos editables.
- `README.md`: documentación de registro, correos y despliegue.
