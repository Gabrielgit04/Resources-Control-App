// Validadores de entrada para formularios y servicios.
// Siempre validan el string completo (regex ancladas), evitando los fallos
// de `parseFloat` que aceptan prefijos parciales (p. ej. "12abc" → 12).

const TEXT_ONLY_RE = /^[\p{L}\p{M}]+(?:(?:[\s'._-]|,)[\p{L}\p{M}]+)*$/u
const FREE_TEXT_RE = /^[\p{L}\p{M}\p{N}\s.,;:_'"()/@+-]+$/u
const POSITIVE_NUMBER_RE = /^[0-9]+(?:\.[0-9]+)?$/
const WHOLE_NUMBER_RE = /^[0-9]+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9][0-9\s\-()]{5,19}$/

/** ¿La cadena no está vacía tras recortar espacios? */
export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0
}

/** ¿Es texto sin números ni símbolos? Útil para nombres y contrapartes. */
export function isTextOnly(value: string): boolean {
  return TEXT_ONLY_RE.test(value.trim())
}

/** ¿Es texto libre sin etiquetas HTML/llaves y con longitud razonable? */
export function isFreeText(value: string, maxLength = 500): boolean {
  const v = value.trim()
  if (v.length === 0 || v.length > maxLength) return false
  return FREE_TEXT_RE.test(v)
}

/** ¿Es un correo electrónico con formato válido? */
export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

/** ¿Es un número entero no negativo (solo dígitos)? */
export function isWholeNumber(value: string): boolean {
  return WHOLE_NUMBER_RE.test(value.trim())
}

/** ¿Es un número positivo (décimales opcionales, máx. `maxDecimals`)? Para montos. */
export function isPositiveNumber(value: string, maxDecimals = 2): boolean {
  const v = value.trim()
  if (!POSITIVE_NUMBER_RE.test(v)) return false
  const decimals = v.includes('.') ? v.split('.')[1].length : 0
  if (decimals > maxDecimals) return false
  return Number(v) > 0
}

/** ¿Es un porcentaje válido entre 0 y 100 (décimales opcionales)? */
export function isRate(value: string, maxDecimals = 2): boolean {
  const v = value.trim()
  if (!POSITIVE_NUMBER_RE.test(v)) return false
  const decimals = v.includes('.') ? v.split('.')[1].length : 0
  if (decimals > maxDecimals) return false
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= 100
}

/** ¿Es un número de teléfono válido? (dígitos, +, espacios, guiones, paréntesis) */
export function isPhone(value: string): boolean {
  return PHONE_RE.test(value.trim())
}

/** ¿Es una contraseña mínimamente segura? (≥8 caracteres, letras y números) */
export function isStrongPassword(value: string): boolean {
  return value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value)
}