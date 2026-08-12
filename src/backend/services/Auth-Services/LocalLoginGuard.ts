const MAX_ATTEMPTS = 3
const LOCK_MS = 3 * 60 * 1000
const STORAGE_PREFIX = 'login-guard:'

interface GuardState {
  attempts: number
  lockedUntil: number
}

export interface LoginGuardState {
  locked: boolean
  remainingSeconds: number
  attemptsLeft: number
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function read(email: string): GuardState {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + normalizeEmail(email))
    if (!raw) return { attempts: 0, lockedUntil: 0 }
    const parsed = JSON.parse(raw) as GuardState
    return {
      attempts: Number(parsed.attempts) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0,
    }
  } catch {
    return { attempts: 0, lockedUntil: 0 }
  }
}

function write(email: string, state: GuardState): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + normalizeEmail(email), JSON.stringify(state))
  } catch {
    // storage no disponible; el guard se vuelve no persistente
  }
}

/** Estado actual del bloqueo para un email. */
export function getLoginState(email: string): LoginGuardState {
  const state = read(email)
  const now = Date.now()
  if (state.lockedUntil > now) {
    return {
      locked: true,
      remainingSeconds: Math.ceil((state.lockedUntil - now) / 1000),
      attemptsLeft: 0,
    }
  }
  return {
    locked: false,
    remainingSeconds: 0,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - state.attempts),
  }
}

/** Registra un intento fallido y devuelve el nuevo estado. */
export function recordLoginFailure(email: string): LoginGuardState {
  const state = read(email)
  const now = Date.now()

  if (state.lockedUntil > now) return getLoginState(email)

  if (state.lockedUntil > 0 && state.lockedUntil <= now) {
    state.attempts = 0
    state.lockedUntil = 0
  }

  state.attempts += 1
  if (state.attempts >= MAX_ATTEMPTS) {
    state.attempts = MAX_ATTEMPTS
    state.lockedUntil = now + LOCK_MS
  }

  write(email, state)
  return getLoginState(email)
}

/** Limpia los intentos tras un login exitoso. */
export function clearLoginState(email: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + normalizeEmail(email))
  } catch {
    // storage no disponible
  }
}
