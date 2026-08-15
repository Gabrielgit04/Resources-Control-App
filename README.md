# G-amount

> **Luminous Engine** · Control de finanzas personales con auditoría, reportes y automatizaciones.

Aplicación web para registrar ingresos y egresos, controlar cuentas por cobrar/pagar y generar reportes exportables, con una experiencia responsiva para escritorio y móvil.

## Características

- **Registros rápidos** — captura ingresos y egresos en segundos con categorías y notas. Registros inmutables por seguridad de auditoría.
- **Cuentas por cobrar/pagar** — control de abonos, fechas de vencimiento, intereses e importes restantes.
- **Reportes y exportación** — estados de resultado, balances e historial completo. Exporta a PDF, CSV y Excel con un clic.
- **Presupuestos y proyecciones** — asigna capital por categorías y proyecta el flujo de caja mes a mes con alertas de límite.
- **Automatizaciones** — recordatorios por correo de cuentas próximas a vencer (lanzados vía cron).
- **Seguridad de auditoría** — autenticación con Supabase Auth, rate limiting en las Edge Functions y movimientos inmutables.
- **Multi-dispositivo** — interfaz responsiva que se adapta a escritorio, tablet o celular.
- **Multi-moneda** — soporta USD, EUR y VES con símbolos y conversiones.
- **Módulo de administración** — listado y borrado de usuarios (acceso solo superadmin).

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Estilos | Tailwind CSS, shadcn/ui (estilo new-york), Radix UI, lucide-react |
| Backend | Supabase (Auth, Postgres, Storage) + Edge Functions (Deno) |
| Correo | Resend (API vía Edge Function `send-reminders`) |
| Reportes | jspdf (PDF), xlsx (Excel), CSV nativo |

## Estructura

```
src/
  pages/            # Vistas (Login, Dashboard, Accounts, Reports, Budget, Admin, Profile, …)
  components/       # UI, layout y contexto de autenticación
  backend/services/ # Capa de datos tipada contra Supabase (accounts, payments, movements, …)
  server/           # Cliente Supabase compartido (timeout + manejo de 401)
  lib/              # utilidades (formato de moneda, cn, …)
supabase/
  functions/        # Edge Functions (admin-users, send-reminders, _shared/middleware)
  migrations/       # Esquema de BD (NO se sube a git)
```

## Requisitos

- Node.js 20+ o Bun
- Un proyecto en [Supabase](https://supabase.com)
- (Opcional) Una API key de [Resend](https://resend.com) para los recordatorios por correo

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install        # o: bun install

# 2. Configurar variables de entorno
cp .env.example .env
#   Edita .env y rellena tus valores de Supabase y superadmin

# 3. Desarrollo
npm run dev

# 4. Lint y build de producción
npm run lint
npm run build
```

### Variables de entorno

```env
VITE_SUPABASE_URL=            # URL de tu proyecto (pública)
VITE_SUPABASE_ANON_KEY=       # anon key (pública)

SUPERADMIN_USER_ID=           # UUID del superadmin (Edge Function admin-users, server-side)
# SUPABASE_JWKS_URL opcional: las Edge Functions derivan las JWKS de SUPABASE_URL.
```

### Edge Functions (Supabase)

Las funciones se despliegan con la CLI de Supabase. Ejecuta antes de desplegar:

```bash
# SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY y SUPABASE_JWKS
# son auto-gestionadas por Supabase (no se definen manualmente).
supabase secrets set SUPERADMIN_USER_ID=<tu_uuid>
supabase secrets set CRON_SECRET=<secreto_aleatorio>
supabase secrets set RESEND_API_KEY=<resend_key>
supabase secrets set REMINDER_FROM_EMAIL="G-amount <tu@dominio.com>"
```

```bash
supabase functions deploy admin-users --no-verify-jwt
supabase functions deploy send-reminders --no-verify-jwt
```

> **Endurecimiento:** el build de producción inyecta una `Content-Security-Policy` estricta (vía `vite.config.ts`), y la Edge Function `admin-users` registra en `public.admin_audit_log` los accesos denegados y borrados de usuarios (migración `20260814120000_admin_audit_log.sql`).

> **Aviso:** las migraciones de `supabase/migrations/` contienen el esquema de la BD y están excluidas de git. Aplícalas en tu proyecto con la CLI de Supabase antes de usar la app; el secret del cron se parametriza por variables de entorno, nunca se commitea.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Type-check (`tsc -b`) + build de Vite |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Lint con Oxlint |