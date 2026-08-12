import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

/** Tiempo máximo (en ms) que una petición a Supabase puede tardar antes de abortarse. */
export const SUPABASE_TIMEOUT_MS = 15000;

/** fetch con timeout vía AbortController para que un Supabase lento no cuelgue el Worker. */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
  return fetch(input as RequestInfo, { ...(init ?? {}), signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

let _onUnauthorized: (() => void) | null = null;

/**
 * Registra un callback global que se ejecuta cuando una petición a Supabase
 * devuelve 401 (sesión expirada). Útil como "middleware" de sesión.
 */
export function setUnauthorizedHandler(fn: () => void): void {
  _onUnauthorized = fn;
}

/** fetch que detecta 401 (token expirado) y dispara el handler global de sesión. */
function fetchWithIntercept(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetchWithTimeout(input, init).then((res) => {
    if (res.status === 401) {
      _onUnauthorized?.();
    }
    return res;
  });
}

/**
 * Resuelve variables de entorno desde process.env (Node.js) o desde los
 * bindings de Cloudflare Workers (globalThis.env), según dónde se ejecute.
 */
function getEnv(key: string): string | undefined {
  const g = globalThis as {
    process?: { env?: Record<string, string> };
    env?: Record<string, string>;
  };
  return g.process?.env?.[key] ?? g.env?.[key];
}

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = getEnv("SUPABASE_URL") ?? import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey =
    getEnv("SUPABASE_ANON_KEY") ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'Sin variable de entorno';

  if (!supabaseUrl) {
    throw new Error("[Supabase] Falta SUPABASE_URL en el entorno del servidor.");
  }
  if (!supabaseKey) {
    throw new Error(
      "[Supabase] Falta SUPABASE_ANON_KEY en el entorno del servidor. " +
        "En Cloudflare Workers, ejecuta `wrangler secret put SUPABASE_ANON_KEY` o `wrangler secret put SUPABASE_PUBLISHABLE_KEY` o `wrangler secret put SUPABASE_SECRET_KEY`.",
    );
  }

  _supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true },
    global: { fetch: fetchWithIntercept },
    db: { schema: "public" },
  });
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  },
  set(_, prop, value) {
    (getSupabase() as any)[prop] = value;
    return true;
  },
});
