import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '@/config'
import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/EmptyState'
import { BottomNav } from '@/components/layout/BottomNav'
import { RouteTransition } from '@/components/RouteTransition'
import { useAuth } from '@/components/auth/auth-context'
import { SelectMovements } from '@/backend/services/Movements-Services/Select.Movements'
import { GetCurrencySettings } from '@/backend/services/Currency-Services/Get.CurrencySettings'
import {
  convertToBase,
  DEFAULT_CURRENCY_SETTINGS,
  formatMoney,
  missingRates,
  type CurrencySettings,
} from '@/lib/currency'

const MONTHS_PAST = 6
const MONTHS_FUTURE = 3

interface Bar {
  month: string
  value: string
  height: string
  active: boolean
  predicted: boolean
}

const GRUPOS = [
  {
    key: 'fijas',
    titulo: 'Operaciones fijas',
    descripcion: 'Operaciones, nómina, imprevistos, servicios fijos y otros gastos recurrentes',
    icon: 'domain',
    categorias: ['Operaciones', 'Nómina', 'Imprevistos', 'Servicios', 'Otros'],
  },
  {
    key: 'variables',
    titulo: 'Recursos variables',
    descripcion: 'Consumo de energía, agua, viveres y otros',
    icon: 'electric_bolt',
    categorias: ['Servicios', 'Otros'],
  },
  {
    key: 'contingencia',
    titulo: 'Fondo de contingencia',
    descripcion: 'Reservas de emergencia, o ahorros',
    icon: 'savings',
    categorias: ['Contingencia'],
  },
]

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function Budget() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState<any[]>([])
  const [settings, setSettings] = useState<CurrencySettings>(DEFAULT_CURRENCY_SETTINGS)
  const [missing, setMissing] = useState<string[]>([])
  const [dialogo, setDialogo] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let activo = true
    Promise.all([SelectMovements(user.id), GetCurrencySettings(user.id)]).then(([mov, cfg]) => {
      if (!activo) return
      const base = cfg.ok ? (cfg.data.base_currency ?? 'USD') : 'USD'
      const rates = cfg.ok ? (cfg.data.rates ?? {}) : {}
      const s: CurrencySettings = {
        baseCurrency: base as CurrencySettings['baseCurrency'],
        rates,
      }
      setSettings(s)
      const items = mov.ok ? (mov.data as any[]) : []
      setMovements(items)
      setMissing(missingRates(items, s))
      setLoading(false)
    })
    return () => {
      activo = false
    }
  }, [user])

  const bars = useMemo(() => {
    const netByMonth = new Map<string, number>()
    for (const m of movements) {
      const key = monthKey(new Date(m.created_at))
      const amount = convertToBase(Number(m.mount), m.currency ?? 'USD', settings)
      netByMonth.set(key, (netByMonth.get(key) ?? 0) + (m.type === 'ingreso' ? amount : -amount))
    }

    const now = new Date()
    const entries: { month: string; value: number; active: boolean; predicted: boolean }[] = []
    for (let i = MONTHS_PAST - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      entries.push({
        month: d.toLocaleDateString('es-ES', { month: 'short' }),
        value: netByMonth.get(monthKey(d)) ?? 0,
        active: i === 0,
        predicted: false,
      })
    }

    const past = entries.map((e) => e.value)
    const promedio = past.length > 0 ? past.reduce((a, b) => a + b, 0) / past.length : 0
    for (let i = 1; i <= MONTHS_FUTURE; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      entries.push({
        month: d.toLocaleDateString('es-ES', { month: 'short' }),
        value: promedio,
        active: false,
        predicted: true,
      })
    }

    const maxAbs = Math.max(...entries.map((e) => Math.abs(e.value)), 1)
    return entries.map<Bar>((e) => ({
      ...e,
      height: `${Math.max(4, (Math.abs(e.value) / maxAbs) * 100)}%`,
      value: formatMoney(e.value, settings.baseCurrency),
    }))
  }, [movements, settings])

  const grupos = useMemo(() => {
    const now = new Date()
    const key = monthKey(now)
    const delMes = movements.filter(
      (m) => m.type === 'egreso' && monthKey(new Date(m.created_at)) === key
    )
    const toBase = (m: any) => convertToBase(Number(m.mount), m.currency ?? 'USD', settings)
    const total = delMes.reduce((a, m) => a + toBase(m), 0)
    return GRUPOS.map((g) => {
      const gasto = delMes
        .filter((m) => g.categorias.includes(m.category))
        .reduce((a, m) => a + toBase(m), 0)
      return { ...g, gasto, pct: total > 0 ? (gasto / total) * 100 : 0 }
    })
  }, [movements, settings])

  const grupoActivo = grupos.find((g) => g.key === dialogo) ?? null

  const operacionesDelGrupo = useMemo(() => {
    if (!grupoActivo) return []
    const key = monthKey(new Date())
    const toBase = (m: any) => convertToBase(Number(m.mount), m.currency ?? 'USD', settings)
    return movements
      .filter(
        (m) =>
          m.type === 'egreso' &&
          monthKey(new Date(m.created_at)) === key &&
          grupoActivo.categorias.includes(m.category)
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((m) => ({
        id: m.id,
        date: new Date(m.created_at).toLocaleString('es-ES', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        category: m.category,
        description: m.description,
        amount: toBase(m),
      }))
  }, [movements, settings, grupoActivo])

  const totalDialogo = operacionesDelGrupo.reduce((a, o) => a + o.amount, 0)

  return (
    <div className="flex flex-col min-h-screen antialiased bg-surface text-on-surface">
      {/* Top App Bar */}
      <header className="flex items-center justify-between p-4 bg-surface/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 flex-shrink-0 bg-primary-container/20 text-primary font-headline font-bold flex items-center justify-center">
            G
          </div>
          <h1 className="text-xl font-headline font-bold tracking-tight text-on-surface">{APP_NAME}</h1>
        </div>
        <button
          aria-label="Notificaciones"
          className="p-2 rounded-full hover:bg-surface-container transition-colors relative text-on-surface"
        >
          <Icon name="notifications" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </button>
      </header>

      {/* Main Content */}
      <RouteTransition>
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24 md:pb-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface mb-2">
              Presupuesto y proyecciones
            </h2>
            <p className="text-on-surface-variant font-body text-sm md:text-base">
              Proyección mensual y asignación de recursos.
            </p>
          </div>
        </div>

        {/* Currency Warning */}
        {missing.length > 0 && (
          <Link
            to="/profile"
            className="flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/15 transition-colors"
          >
            <Icon name="warning" size={20} className="mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">
                Tienes movimientos en {missing.join(' y ')} sin tasa configurada.
              </p>
              <p className="text-error/80">
                Configura la tasa en Perfil → Conversión de moneda para que esos montos se incluyan en la proyección.
              </p>
            </div>
          </Link>
        )}

        {/* Projections Chart Area */}
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-headline font-semibold text-on-surface">Proyección de flujo de caja</h3>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-container inline-block" />
                <span className="text-xs font-label text-on-surface-variant">Flujo real</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-surface-container-highest border border-outline-variant/40 inline-block" />
                <span className="text-xs font-label text-on-surface-variant">Proyectado</span>
              </span>
            </div>
          </div>

          {/* Conceptual Chart Visualization */}
          <div className="relative z-10 mt-4">
            {loading ? (
              <div className="h-64 w-full flex items-end gap-2 md:gap-4" aria-hidden="true">
                {[45, 70, 55, 80, 65, 90, 60, 75, 40].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end h-full pb-6">
                    <div
                      className="w-full rounded-t-sm animate-pulse bg-surface-container-highest"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
            ) : movements.length === 0 ? (
              <EmptyState
                icon="monitoring"
                title="Aún no hay datos de flujo"
                description="Cuando registres movimientos, verás aquí la proyección de flujo de caja."
              />
            ) : (
              <div className="h-64 w-full flex items-end gap-2 md:gap-4">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-outline-variant/20 pb-6">
                  <div className="w-full border-t border-outline-variant/10 h-0" />
                  <div className="w-full border-t border-outline-variant/10 h-0" />
                  <div className="w-full border-t border-outline-variant/10 h-0" />
                  <div className="w-full border-t border-outline-variant/10 h-0" />
                </div>

                {/* Bars */}
                {bars.map((bar) =>
                  bar.predicted ? (
                    <div key={bar.month} className="flex-1 flex flex-col justify-end group h-full pb-6">
                      <div
                        className="w-full bg-surface-container-low border border-outline-variant/30 border-dashed rounded-t-sm"
                        style={{ height: bar.height }}
                      />
                      <div className="text-center text-xs font-label text-on-surface-variant mt-2">
                        {bar.month}
                      </div>
                    </div>
                  ) : (
                    <div key={bar.month} className="flex-1 flex flex-col justify-end group h-full pb-6">
                      <div
                        className={`w-full rounded-t-sm relative transition-colors ${
                          bar.active
                            ? 'bg-primary/80 glow-effect'
                            : 'bg-surface-container-highest group-hover:bg-primary-container/20'
                        }`}
                        style={{ height: bar.height }}
                      >
                        {bar.active && (
                          <span className="absolute -top-2 -right-1 w-3 h-3 bg-primary-fixed rounded-full shadow-[0_0_8px_rgba(100,255,146,0.8)] animate-pulse" />
                        )}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-label text-on-surface bg-surface-container px-2 py-1 rounded shadow-sm transition-opacity pointer-events-none z-20 whitespace-nowrap">
                          {bar.value}
                        </div>
                      </div>
                      <div
                        className={`text-center text-xs font-label mt-2 ${
                          bar.active ? 'font-semibold text-primary' : 'text-on-surface-variant'
                        }`}
                      >
                        {bar.month}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        {/* Budget Categories */}
        <section className="space-y-6">
          <h3 className="text-xl font-headline font-bold text-on-surface">Gasto por categorías del mes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {grupos.map((g, idx) => {
              const warning = idx === 1
              const barColor = warning ? 'bg-error' : g.key === 'contingencia' ? 'bg-primary' : 'bg-secondary'
              return (
                <div
                  key={g.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver operaciones de ${g.titulo}`}
                  onClick={() => setDialogo(g.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setDialogo(g.key)
                    }
                  }}
                  className={`p-5 rounded-xl border border-outline-variant/20 transition-colors cursor-pointer ${
                    warning
                      ? 'bg-surface-container-lowest shadow-sm relative overflow-hidden hover:shadow-md'
                      : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  {warning && <div className="absolute inset-0 bg-error/5 pointer-events-none" />}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h4 className="font-headline font-semibold text-on-surface">{g.titulo}</h4>
                      <p className="text-xs font-label text-on-surface-variant mt-1">{g.descripcion}</p>
                    </div>
                    <Icon
                      name={g.icon}
                      className={`p-2 rounded-full ${
                        warning
                          ? 'text-error bg-error-container'
                          : g.key === 'contingencia'
                            ? 'text-primary bg-primary-container/20'
                            : 'text-secondary bg-secondary-fixed'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-end mb-2 relative z-10">
                    <span className="font-display text-2xl font-bold text-on-surface">
                      {formatMoney(g.gasto, settings.baseCurrency)}
                    </span>
                    <span className="text-sm font-label text-on-surface-variant">
                      {Math.round(g.pct)}% del gasto del mes
                    </span>
                  </div>
                  <div
                    className={`w-full rounded-full h-2.5 overflow-hidden ${
                      warning ? 'bg-surface-container' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${g.pct}%` }} />
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs font-label text-on-surface-variant">
                    <Icon name="visibility" size={14} />
                    Ver operaciones
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      </RouteTransition>

      {/* Dialog de operaciones por categoría */}
      {dialogo && grupoActivo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDialogo(null)}
        >
          <div
            className="w-full max-w-lg bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_24px_60px_rgba(11,28,48,0.25)] max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-display font-semibold text-xl text-on-surface">{grupoActivo.titulo}</h3>
              <button
                className="p-1.5 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
                aria-label="Cerrar"
                onClick={() => setDialogo(null)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <p className="text-sm text-on-surface-variant mb-2">{grupoActivo.descripcion}</p>
            <p className="font-display font-bold text-2xl text-on-surface mb-4">
              {formatMoney(totalDialogo, settings.baseCurrency)}
            </p>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {operacionesDelGrupo.length === 0 ? (
                <EmptyState
                  icon="receipt_long"
                  title="Sin operaciones este mes"
                  description={`No hay egresos registrados en ${grupoActivo.categorias.join(' o ')} durante este mes.`}
                />
              ) : (
                operacionesDelGrupo.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface ghost-border"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{o.description}</p>
                      <p className="text-xs text-on-surface-variant">
                        {o.date} · {o.category}
                      </p>
                    </div>
                    <span className="text-sm font-display font-medium text-error flex-shrink-0">
                      -{formatMoney(o.amount, settings.baseCurrency)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
                onClick={() => setDialogo(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
