import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/EmptyState'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Skeleton } from '@/components/ui/skeleton'
import { DonutChart, MonthlyBars } from '@/components/charts/charts'
import { useAuth } from '@/components/auth/auth-context'
import { SelectMovements } from '@/backend/services/Movements-Services/Select.Movements'
import { SelectAccounts } from '@/backend/services/Accounts-Services/Select.Accounts'
import { GetCurrencySettings } from '@/backend/services/Currency-Services/Get.CurrencySettings'
import {
  convertToBase,
  currencySymbol,
  DEFAULT_CURRENCY_SETTINGS,
  formatMoney,
  missingRates,
  type CurrencySettings,
} from '@/lib/currency'

interface RecentRow {
  id: string
  date: string
  type: 'Ingreso' | 'Egreso'
  category: string
  description: string
  amount: string
  value: string
}

interface Vencimiento {
  id: string
  esPagar: boolean
  contraparte: string
  restante: number
  vencimiento: string
  vencida: boolean
  currency: string
}

const PAGE_SIZE = 6

function formatAmount(mount: number | string, currency: string, isIngreso: boolean) {
  const symbol = currency === 'EUR' ? '€' : currency === 'VES' ? 'Bs ' : '$'
  const base = `${Number(mount).toFixed(2)}`
  return `${isIngreso ? '+' : '-'}${symbol}${base}`
}

export function Dashboard() {
  const { user } = useAuth()
  const [recent, setRecent] = useState<RecentRow[]>([])
  const [items, setItems] = useState<any[]>([])
  const [ingresos, setIngresos] = useState(0)
  const [egresos, setEgresos] = useState(0)
  const [settings, setSettings] = useState<CurrencySettings>(DEFAULT_CURRENCY_SETTINGS)
  const [missing, setMissing] = useState<string[]>([])
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([])
  const [recentPage, setRecentPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let activo = true
    setLoading(true)
    Promise.all([SelectMovements(user.id), GetCurrencySettings(user.id)]).then(([mov, cfg]) => {
      if (!activo) return
      setLoading(false)
      const base = cfg.ok ? (cfg.data.base_currency ?? 'USD') : 'USD'
      const rates = cfg.ok ? (cfg.data.rates ?? {}) : {}
      const s: CurrencySettings = { baseCurrency: base as CurrencySettings['baseCurrency'], rates }
      setSettings(s)
      if (!mov.ok) return
      const items = mov.data as any[]
      setItems(items)
      setMissing(missingRates(items, s))
      const toBase = (m: any) => convertToBase(Number(m.mount), m.currency ?? 'USD', s)
      const rows = items.map((m) => {
        const type: 'Ingreso' | 'Egreso' = m.type === 'ingreso' ? 'Ingreso' : 'Egreso'
        return {
          id: m.id,
          date: new Date(m.created_at).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          type,
          category: m.category,
          description: m.description,
          amount: formatAmount(m.mount, m.currency ?? 'USD', type === 'Ingreso'),
          value: type === 'Ingreso' ? 'text-primary' : 'text-error',
        }
      })
      setRecent(rows)

      setIngresos(
        items
          .filter((m) => m.type === 'ingreso')
          .reduce((acc: number, m) => acc + toBase(m), 0)
      )
      setEgresos(
        items
          .filter((m) => m.type === 'egreso')
          .reduce((acc: number, m) => acc + toBase(m), 0)
      )
    })
    return () => {
      activo = false
    }
  }, [user])

  const balance = ingresos - egresos
  const symbol = currencySymbol(settings.baseCurrency)

  useEffect(() => {
    if (!user) return
    let activo = true
    Promise.all([SelectAccounts(user.id, 'payable'), SelectAccounts(user.id, 'receivable')]).then(([p, c]) => {
      if (!activo) return
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const tope = new Date(hoy)
      tope.setDate(tope.getDate() + 2)
      const aVencimiento = (row: any, esPagar: boolean): Vencimiento | null => {
        if (!row.due_date) return null
        const d = new Date(`${row.due_date}T00:00:00`)
        if (d > tope) return null
        const restante = Number(row.amount) - Number(row.paid)
        if (restante <= 0) return null
        return {
          id: row.id,
          esPagar,
          contraparte: row.counterparty,
          restante,
          vencimiento: row.due_date,
          vencida: d < hoy,
          currency: row.currency ?? 'USD',
        }
      }
      const lista = [
        ...(p.ok ? (p.data as any[]) : []).map((r) => aVencimiento(r, true)),
        ...(c.ok ? (c.data as any[]) : []).map((r) => aVencimiento(r, false)),
      ]
        .filter((v): v is Vencimiento => v !== null)
        .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento))
      setVencimientos(lista)
    })
    return () => {
      activo = false
    }
  }, [user])

  const formatFechaCorta = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })

  const toBase = (m: any) => convertToBase(Number(m.mount), m.currency ?? 'USD', settings)

  const porCategoria = (tipo: 'ingreso' | 'egreso') => {
    const map = new Map<string, number>()
    for (const m of items) {
      if (m.type !== tipo) continue
      const key = m.category ?? 'Otros'
      map.set(key, (map.get(key) ?? 0) + toBase(m))
    }
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }

  const ingresosPorCategoria = porCategoria('ingreso')
  const egresosPorCategoria = porCategoria('egreso')

  const mensual = useMemo(() => {
    const map = new Map<string, { month: string; ingresos: number; egresos: number }>()
    for (const m of items) {
      const d = new Date(m.created_at)
      if (Number.isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const entry = map.get(key) ?? {
        month: d.toLocaleDateString('es-ES', { month: 'short' }),
        ingresos: 0,
        egresos: 0,
      }
      const base = convertToBase(Number(m.mount), m.currency ?? 'USD', settings)
      if (m.type === 'ingreso') entry.ingresos += base
      else entry.egresos += base
      map.set(key, entry)
    }
    return Array.from(map, ([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key: _key, ...rest }) => rest)
  }, [items, settings])

  const totalPaginas = Math.max(1, Math.ceil(recent.length / PAGE_SIZE))
  const paginaActual = Math.min(recentPage, totalPaginas - 1)
  const rowsPagina = recent.slice(paginaActual * PAGE_SIZE, paginaActual * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-2">Panel</h2>
          <p className="text-on-surface-variant text-sm md:text-base">Tu panorama financiero de un vistazo.</p>
        </div>
        <Link
          to="/movimientos/nuevo"
          className="hidden md:inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary font-medium text-sm glow-hover transition-all active:scale-95"
        >
          <Icon name="add" size={18} />
          Nuevo Movimiento
        </Link>
      </div>

      {/* Balance Hero */}
      <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-6 md:p-8 relative overflow-hidden shadow-[0_12px_40px_rgba(0,109,50,0.25)]">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="text-on-primary/80 text-xs font-medium uppercase tracking-wider mb-2">Balance Total</p>
            <p className="font-display font-bold text-4xl md:text-5xl text-on-primary tracking-tight">
              {loading ? (
                <Skeleton className="h-12 w-60 bg-white/25" />
              ) : (
                <AnimatedNumber value={balance} formatter={(v) => `${symbol}${v.toFixed(2)}`} />
              )}
            </p>
            <p className="text-on-primary/70 text-sm mt-2">Actualizado hace un momento</p>
          </div>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-on-primary/80 text-xs font-medium uppercase tracking-wider mb-1">Ingresos</p>
              <p className="font-display font-semibold text-xl text-on-primary">
                {loading ? (
                  <Skeleton className="h-6 w-24 bg-white/25" />
                ) : (
                  <AnimatedNumber value={ingresos} formatter={(v) => `+${symbol}${v.toFixed(2)}`} />
                )}
              </p>
            </div>
            <div>
              <p className="text-on-primary/80 text-xs font-medium uppercase tracking-wider mb-1">Egresos</p>
              <p className="font-display font-semibold text-xl text-on-primary">
                {loading ? (
                  <Skeleton className="h-6 w-24 bg-white/25" />
                ) : (
                  <AnimatedNumber value={egresos} formatter={(v) => `-${symbol}${v.toFixed(2)}`} />
                )}
              </p>
            </div>
          </div>
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
              Configura la tasa en Perfil → Conversión de moneda para que esos montos se incluyan en tu balance y
              proyecciones.
            </p>
          </div>
        </Link>
      )}

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/budget"
          className="group bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_8px_32px_rgba(11,28,48,0.03)] hover:bg-surface-bright transition-colors flex items-start justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container/20 text-primary">
              <Icon name="savings" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-on-surface">Presupuesto y proyecciones</h3>
              <p className="text-sm text-on-surface-variant">Proyección mensual y asignación de recursos.</p>
            </div>
          </div>
          <Icon name="chevron_right" className="text-on-surface-variant group-hover:text-primary transition-colors" />
        </Link>
        <Link
          to="/reports"
          className="group bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_8px_32px_rgba(11,28,48,0.03)] hover:bg-surface-bright transition-colors flex items-start justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 text-secondary">
              <Icon name="bar_chart" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-on-surface">Reportes y exportación</h3>
              <p className="text-sm text-on-surface-variant">Genera y exporta reportes inteligentes.</p>
            </div>
          </div>
          <Icon name="chevron_right" className="text-on-surface-variant group-hover:text-primary transition-colors" />
        </Link>
      </div>

      {/* Resumen visual */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
              <Skeleton className="h-5 w-44 mb-2" />
              <Skeleton className="h-3 w-56 mb-4" />
              <Skeleton className="h-52 w-full rounded-xl" />
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-3 w-56 mb-4" />
              <Skeleton className="h-52 w-full rounded-xl" />
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-3 w-64 mb-4" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      ) : items.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
              <h3 className="font-display font-semibold text-lg text-on-surface mb-1">Ingresos por categoría</h3>
              <p className="text-xs text-on-surface-variant mb-4">Distribución de tus entradas.</p>
              <DonutChart
                data={ingresosPorCategoria}
                formatter={(v) => formatMoney(v, settings.baseCurrency)}
                centerLabel={`+${formatMoney(ingresos, settings.baseCurrency)}`}
              />
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
              <h3 className="font-display font-semibold text-lg text-on-surface mb-1">Egresos por categoría</h3>
              <p className="text-xs text-on-surface-variant mb-4">Distribución de tus salidas.</p>
              <DonutChart
                data={egresosPorCategoria}
                formatter={(v) => formatMoney(v, settings.baseCurrency)}
                centerLabel={`-${formatMoney(egresos, settings.baseCurrency)}`}
              />
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-display font-semibold text-lg text-on-surface">Flujo mensual</h3>
                <p className="text-xs text-on-surface-variant">Ingresos vs egresos por mes en {settings.baseCurrency}.</p>
              </div>
            </div>
            <MonthlyBars data={mensual} formatter={(v) => formatMoney(v, settings.baseCurrency)} />
          </div>
        </div>
      )}

      {/* Próximos vencimientos */}
      {vencimientos.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-xl text-on-surface">Vencimientos próximos</h3>
            <Link to="/accounts" className="text-sm text-primary font-medium hover:underline">
              Ir a cuentas
            </Link>
          </div>
          <div className="space-y-2">
            {vencimientos.slice(0, 6).map((v, i) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface hover:bg-surface-container-low transition-colors ghost-border animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      v.vencida ? 'bg-error/10 text-error animate-pulse' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {v.vencida ? 'Vencida' : v.esPagar ? 'Por pagar' : 'Por cobrar'}
                  </span>
                  <span className="text-sm font-medium text-on-surface truncate">{v.contraparte}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-display font-medium text-on-surface">
                    {formatMoney(convertToBase(v.restante, v.currency, settings), settings.baseCurrency)}
                  </span>
                  <span className="block text-[10px] text-on-surface-variant">{formatFechaCorta(v.vencimiento)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Movements */}
      <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display font-semibold text-xl text-on-surface">Movimientos Recientes</h3>
          <Link to="/reports" className="text-sm text-primary font-medium hover:underline">
            Ver todo
          </Link>
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 p-4 rounded-lg bg-surface ghost-border items-center"
                >
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20 md:ml-auto" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon="receipt_long"
              title="Aún no hay movimientos"
              description="Cuando registres tu primer ingreso o egreso, aparecerá aquí."
            />
          ) : (
            rowsPagina.map((row, i) => (
              <div
                key={`${row.id}-${paginaActual}`}
                className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 p-4 rounded-lg bg-surface hover:bg-surface-container-low transition-colors ghost-border items-center animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="text-sm text-on-surface-variant">
                  <span className="md:hidden font-semibold mr-2">Fecha:</span>
                  {row.date}
                </div>
                <div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ghost-border ${
                      row.type === 'Ingreso' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                    }`}
                  >
                    {row.type}
                  </span>
                </div>
                <div className="text-sm text-on-surface-variant">
                  <span className="md:hidden font-semibold mr-2">Categoría:</span>
                  {row.category}
                </div>
                <div className="text-sm font-medium text-on-surface truncate">
                  <span className="md:hidden text-on-surface-variant font-normal mr-2">Desc:</span>
                  {row.description}
                </div>
                <div className={`text-sm md:text-right font-display font-medium ${row.value}`}>
                  <span className="md:hidden text-on-surface-variant font-normal mr-2">Monto:</span>
                  {row.amount}
                </div>
              </div>
            ))
          )}
        </div>
        {recent.length > 0 && totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10">
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:pointer-events-none"
              disabled={paginaActual === 0}
              onClick={() => setRecentPage(paginaActual - 1)}
            >
              <Icon name="chevron_left" size={18} />
              Anterior
            </button>
            <span className="text-sm text-on-surface-variant">
              {paginaActual * PAGE_SIZE + 1}–{Math.min((paginaActual + 1) * PAGE_SIZE, recent.length)} de {recent.length}
            </span>
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:pointer-events-none"
              disabled={paginaActual >= totalPaginas - 1}
              onClick={() => setRecentPage(paginaActual + 1)}
            >
              Siguiente
              <Icon name="chevron_right" size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <Link
        to="/movimientos/nuevo"
        className="md:hidden fixed bottom-20 right-4 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_8px_24px_rgba(0,109,50,0.4)] active:scale-95 transition-all"
        aria-label="Nuevo Movimiento"
      >
        <Icon name="add" fill size={28} />
      </Link>
    </div>
  )
}
