export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'VES', label: 'VES (Bs)' },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]['value']

export interface CurrencySettings {
  baseCurrency: CurrencyCode
  rates: Record<string, number>
}

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  baseCurrency: 'USD',
  rates: {},
}

export function currencySymbol(currency: string): string {
  switch (currency) {
    case 'EUR':
      return '€'
    case 'VES':
      return 'Bs '
    default:
      return '$'
  }
}

export function convertToBase(
  amount: number,
  currency: string | null | undefined,
  settings: CurrencySettings
): number {
  if (!currency || currency === settings.baseCurrency) return amount
  const rate = settings.rates[currency]
  if (typeof rate !== 'number' || Number.isNaN(rate) || rate <= 0) return 0
  // VES se expresa como "Bs por 1 unidad de la moneda base" (ej. 36 Bs = 1 USD) -> se divide.
  // EUR se expresa como "1 unidad vale X en la base" (ej. 1 EUR = 1.08 USD) -> se multiplica.
  if (currency === 'VES') return amount / rate
  return amount * rate
}

export function formatMoney(amount: number, baseCurrency: string): string {
  return `${currencySymbol(baseCurrency)}${amount.toFixed(2)}`
}

export function missingRates(
  movements: { currency?: string | null }[],
  settings: CurrencySettings
): string[] {
  const found = new Set<string>()
  for (const m of movements) {
    const c = m.currency ?? 'USD'
    if (c === settings.baseCurrency) continue
    const rate = settings.rates[c]
    if (typeof rate !== 'number' || Number.isNaN(rate) || rate <= 0) {
      found.add(c)
    }
  }
  return Array.from(found)
}
