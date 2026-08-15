interface CacheEntry<T> {
  expiresAt: number
  promise: Promise<T>
}

const store = new Map<string, CacheEntry<unknown>>()

/**
 * Caché de consultas en memoria (una por pestaña).
 *
 * - **Dedupe en vuelo**: si dos componentes piden la misma clave a la vez,
 *   comparten el mismo Promise y solo se ejecuta una petición a la BD.
 * - **TTL**: el resultado se reutiliza durante `ttlMs` sin volver a llamar a la BD.
 * - **Invalidación**: las mutaciones llaman `invalidateAll()` para que el siguiente
 *   read vuelva a traer datos frescos.
 *
 * La forma de retorno la mantiene cada servicio (`{ ok, error, data }`); este módulo
 * solo orquesta cuándo se ejecuta el fetcher.
 */
export function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
  options: { force?: boolean; isError?: (value: T) => boolean } = {}
): Promise<T> {
  const { force = false, isError } = options
  const now = Date.now()

  const hit = store.get(key)
  if (!force && hit && hit.expiresAt > now) {
    return hit.promise as Promise<T>
  }

  const promise = fetcher()
    .then((value) => {
      if (isError?.(value)) {
        store.delete(key)
      }
      return value
    })
    .catch((err) => {
      store.delete(key)
      throw err
    })

  store.set(key, { expiresAt: now + ttlMs, promise })
  return promise
}

/** Limpia toda la caché (sign out, cambio de cuenta o tras una mutación). */
export function invalidateAll(): void {
  store.clear()
}
