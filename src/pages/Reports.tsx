import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/ui/modal'
import { DonutChart, MonthlyBars } from '@/components/charts/charts'
import { useAuth } from '@/components/auth/auth-context'
import { SelectMovements } from '@/backend/services/Movements-Services/Select.Movements'
import { DeleteMovement } from '@/backend/services/Movements-Services/Delete.Movement'
import { SelectAccounts } from '@/backend/services/Accounts-Services/Select.Accounts'
import { GetCurrencySettings } from '@/backend/services/Currency-Services/Get.CurrencySettings'
import {
  convertToBase,
  currencySymbol,
  DEFAULT_CURRENCY_SETTINGS,
  formatMoney,
  type CurrencySettings,
} from '@/lib/currency'

interface HistoryRow {
  id: string
  date: string
  type: string
  category: string
  description: string
  amount: string
  value: string
  icon: string
}

const TYPE_STYLES: Record<string, string> = {
  Ingreso: 'bg-primary/10 text-primary',
  Egreso: 'bg-error/10 text-error',
  Métrica: 'bg-tertiary-fixed/50 text-on-tertiary-fixed',
}

const PAGE_SIZE = 6

function formatAmount(mount: number | string, currency: string, isIngreso: boolean) {
  const symbol = currencySymbol(currency)
  const base = `${Number(mount).toFixed(2)}`
  return `${isIngreso ? '+' : '-'}${symbol}${base}`
}

function mesesEntre(inicio: Date, ahora: Date): number {
  let meses = (ahora.getFullYear() - inicio.getFullYear()) * 12 + (ahora.getMonth() - inicio.getMonth())
  if (ahora.getDate() < inicio.getDate()) meses -= 1
  return Math.max(0, meses)
}

function restanteDeCuenta(a: any): number {
  const saldo = Number(a.amount) - Number(a.paid)
  if (saldo <= 0) return 0
  const rate = Number(a.interest_rate ?? 0)
  if (rate <= 0) return saldo
  const inicio = new Date(a.created_at)
  if (Number.isNaN(inicio.getTime())) return saldo
  const dias = Math.floor((Date.now() - inicio.getTime()) / 86400000)
  if (dias < 0) return saldo
  let periodos = 0
  if (a.interest_period === 'weekly') periodos = Math.floor(dias / 7)
  else if (a.interest_period === 'monthly') periodos = mesesEntre(inicio, new Date())
  return saldo + saldo * (rate / 100) * periodos
}

export function Reports() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState<any[]>([])
  const [porPagar, setPorPagar] = useState<any[]>([])
  const [porCobrar, setPorCobrar] = useState<any[]>([])
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [category, setCategory] = useState('Todos los recursos')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(0)
  const [verTodos, setVerTodos] = useState(false)
  const [settings, setSettings] = useState<CurrencySettings>(DEFAULT_CURRENCY_SETTINGS)
  const [eliminando, setEliminando] = useState<HistoryRow | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  const cargar = () => {
    if (!user) return
    Promise.all([
      SelectMovements(user.id),
      GetCurrencySettings(user.id),
      SelectAccounts(user.id, 'payable'),
      SelectAccounts(user.id, 'receivable'),
    ]).then(([mov, cfg, pag, cob]) => {
      if (mov.ok) setRows((mov.data as any[]) ?? [])
      if (cfg.ok) {
        setSettings({
          baseCurrency: (cfg.data.base_currency ?? 'USD') as CurrencySettings['baseCurrency'],
          rates: cfg.data.rates ?? {},
        })
      }
      if (pag.ok) setPorPagar((pag.data as any[]) ?? [])
      if (cob.ok) setPorCobrar((cob.data as any[]) ?? [])
    })
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const toBase = (m: any) => convertToBase(Number(m.mount), m.currency ?? 'USD', settings)

  const enRango = (m: any) => {
    if (!fechaDesde && !fechaHasta) return true
    const fecha = new Date(m.created_at).getTime()
    if (fechaDesde && fecha < new Date(`${fechaDesde}T00:00:00`).getTime()) return false
    if (fechaHasta && fecha > new Date(`${fechaHasta}T23:59:59.999`).getTime()) return false
    return true
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return rows.filter(
      (m) =>
        (category === 'Todos los recursos' || m.category === category) &&
        enRango(m) &&
        (q === '' ||
          String(m.description ?? '').toLowerCase().includes(q) ||
          String(m.category ?? '').toLowerCase().includes(q))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, category, busqueda, fechaDesde, fechaHasta])

  const categorias = useMemo(
    () => ['Todos los recursos', ...Array.from(new Set(rows.map((m) => m.category)))],
    [rows]
  )

  const ingresos = visibles
    .filter((m) => m.type === 'ingreso')
    .reduce((acc: number, m) => acc + toBase(m), 0)
  const egresos = visibles
    .filter((m) => m.type === 'egreso')
    .reduce((acc: number, m) => acc + toBase(m), 0)
  const neto = ingresos - egresos
  const symbol = currencySymbol(settings.baseCurrency)

  const porCategoria = (tipo: 'ingreso' | 'egreso') => {
    const map = new Map<string, number>()
    for (const m of visibles) {
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
    for (const m of visibles) {
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
  }, [visibles, settings])

  const porCobrarPendientes = porCobrar.filter((c) => restanteDeCuenta(c) > 0)
  const porPagarPendientes = porPagar.filter((c) => restanteDeCuenta(c) > 0)

  const activos = porCobrarPendientes.reduce(
    (acc, c) => acc + convertToBase(restanteDeCuenta(c), c.currency ?? 'USD', settings),
    0
  )
  const pasivos = porPagarPendientes.reduce(
    (acc, c) => acc + convertToBase(restanteDeCuenta(c), c.currency ?? 'USD', settings),
    0
  )

  const history: HistoryRow[] = visibles.map((m) => {
    const isIngreso = m.type === 'ingreso'
    return {
      id: m.id,
      date: new Date(m.created_at).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      type: isIngreso ? 'Ingreso' : 'Egreso',
      category: m.category,
      description: m.description,
      amount: formatAmount(m.mount, m.currency ?? 'USD', isIngreso),
      value: isIngreso ? 'text-primary' : 'text-error',
      icon: isIngreso ? 'trending_up' : 'trending_down',
    }
  })

  const totalPaginas = Math.max(1, Math.ceil(history.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas - 1)
  const historyPagina = verTodos ? history : history.slice(paginaActual * PAGE_SIZE, paginaActual * PAGE_SIZE + PAGE_SIZE)

  const confirmarEliminar = async () => {
    if (!eliminando || !user) return
    setEliminandoId(eliminando.id)
    const result = await DeleteMovement({ id: eliminando.id, userId: user.id })
    setEliminandoId(null)
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo eliminar el movimiento.')
      return
    }
    toast.success('Movimiento eliminado.')
    setEliminando(null)
    cargar()
  }

  const periodo = fechaDesde && fechaHasta ? `${fechaDesde} — ${fechaHasta}` : fechaDesde ? `desde ${fechaDesde}` : fechaHasta ? `hasta ${fechaHasta}` : 'todo el período'

  const descargarBlob = (blob: Blob, nombre: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombre
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportarCSV = () => {
    if (visibles.length === 0) {
      toast.error('No hay movimientos para exportar con los filtros actuales.')
      return
    }
    const cabecera = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Moneda', 'Monto']
    const lineas = visibles.map((m) => [
      new Date(m.created_at).toLocaleString('es-ES'),
      m.type === 'ingreso' ? 'Ingreso' : 'Egreso',
      m.category,
      m.description,
      m.currency ?? 'USD',
      String(Number(m.mount)),
    ])
    const csv =
      '\uFEFF' +
      [cabecera, ...lineas]
        .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
        .join('\r\n')
    descargarBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `reporte-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const exportarPDF = (tipo: 'resultados' | 'balance') => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('G-amount', 14, 18)
    doc.setFontSize(13)
    doc.text(tipo === 'resultados' ? 'Estado de Resultados' : 'Balance General', 14, 27)
    doc.setFontSize(9)
    doc.text(`Período: ${periodo}`, 14, 34)
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 39)

    let y = 52
    doc.setFontSize(11)
    if (tipo === 'resultados') {
      doc.setFontSize(10)
      doc.text('Ingresos totales', 14, y)
      doc.text(formatMoney(ingresos, settings.baseCurrency), 196, y, { align: 'right' })
      y += 9
      doc.text('Egresos totales', 14, y)
      doc.text(formatMoney(egresos, settings.baseCurrency), 196, y, { align: 'right' })
      y += 9
      doc.setFontSize(12)
      doc.text('Ingreso neto', 14, y)
      doc.text(formatMoney(neto, settings.baseCurrency), 196, y, { align: 'right' })
    } else {
      doc.setFontSize(10)
      doc.text(`Cuentas por cobrar pendientes (${porCobrarPendientes.length})`, 14, y)
      doc.text(formatMoney(activos, settings.baseCurrency), 196, y, { align: 'right' })
      y += 9
      doc.text(`Cuentas por pagar pendientes (${porPagarPendientes.length})`, 14, y)
      doc.text(formatMoney(pasivos, settings.baseCurrency), 196, y, { align: 'right' })
      y += 9
      doc.setFontSize(12)
      doc.text('Patrimonio neto', 14, y)
      doc.text(formatMoney(activos - pasivos, settings.baseCurrency), 196, y, { align: 'right' })
    }

    doc.save(tipo === 'resultados' ? 'estado-de-resultados.pdf' : 'balance-general.pdf')
  }

  const exportarExcel = () => {
    if (visibles.length === 0) {
      toast.error('No hay movimientos para exportar con los filtros actuales.')
      return
    }
    const data = visibles.map((m) => ({
      Fecha: new Date(m.created_at).toLocaleString('es-ES'),
      Tipo: m.type === 'ingreso' ? 'Ingreso' : 'Egreso',
      Categoría: m.category,
      Descripción: m.description,
      Moneda: m.currency ?? 'USD',
      Monto: Number(m.mount),
      'Monto en moneda base': Number(toBase(m).toFixed(2)),
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')
    XLSX.writeFile(wb, `movimientos-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-2">Reportes y exportación</h2>
          <p className="text-on-surface-variant text-sm md:text-base">
            Genera, visualiza y exporta reportes inteligentes detallados.
          </p>
        </div>
        {/* Global Actions */}
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded bg-surface-container text-on-surface font-medium text-sm ghost-border hover:bg-surface-container-highest transition-colors"
            onClick={() => {
              const hoy = new Date()
              const hace30 = new Date()
              hace30.setDate(hace30.getDate() - 30)
              setFechaDesde(hace30.toISOString().slice(0, 10))
              setFechaHasta(hoy.toISOString().slice(0, 10))
            }}
          >
            <Icon name="calendar_month" size={18} />
            Últimos 30 días
          </button>
        </div>
      </div>

      {/* Filters Layer */}
      <div className="bg-surface-container-lowest p-6 rounded-xl ghost-border mb-8 shadow-[0_8px_32px_rgba(11,28,48,0.03)] relative overflow-hidden">
        {/* Subtle atmospheric gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-end">
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
              Desde
            </label>
            <div className="flex items-center bg-surface-container-low rounded-lg ghost-border p-1 focus-within:ring-2 focus-within:ring-primary focus-within:bg-surface-container-lowest transition-all">
              <Icon name="date_range" size={20} className="text-on-surface-variant ml-2 mr-1" />
              <input
                className="w-full bg-transparent border-none text-sm text-on-surface focus:ring-0 py-2 px-2"
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value)
                  setPagina(0)
                }}
              />
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
              Hasta
            </label>
            <div className="flex items-center bg-surface-container-low rounded-lg ghost-border p-1 focus-within:ring-2 focus-within:ring-primary focus-within:bg-surface-container-lowest transition-all">
              <Icon name="date_range" size={20} className="text-on-surface-variant ml-2 mr-1" />
              <input
                className="w-full bg-transparent border-none text-sm text-on-surface focus:ring-0 py-2 px-2"
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value)
                  setPagina(0)
                }}
              />
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
              Categoría
            </label>
            <div className="flex items-center bg-surface-container-low rounded-lg ghost-border p-1 focus-within:ring-2 focus-within:ring-primary focus-within:bg-surface-container-lowest transition-all">
              <Icon name="filter_list" size={20} className="text-on-surface-variant ml-2 mr-1" />
              <select
                className="w-full bg-transparent border-none text-sm text-on-surface focus:ring-0 py-2 px-2 appearance-none cursor-pointer"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setPagina(0)
                }}
              >
                {categorias.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="w-full md:w-1/3 flex justify-end">
            <button
              className="w-full md:w-auto px-6 py-2.5 rounded bg-primary text-on-primary font-medium text-sm glow-hover transition-all flex items-center justify-center gap-2"
              onClick={cargar}
            >
              <Icon name="sync" size={18} />
              Actualizar datos
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid: Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Estado de Resultados Card */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_12px_40px_rgba(11,28,48,0.04)] flex flex-col justify-between group hover:bg-surface-bright transition-colors">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-container/20 text-primary mb-4">
                  <Icon name="account_balance_wallet" />
                </div>
                <h3 className="font-display font-semibold text-xl text-on-surface mb-1">Estado de Resultados</h3>
                <p className="text-sm text-on-surface-variant">Resumen del estado de resultados para el período seleccionado.</p>
              </div>
              <span className="px-3 py-1 bg-surface-container text-xs font-medium rounded-full text-on-surface-variant ghost-border">
                {fechaDesde || fechaHasta ? periodo : 'Todo el período'}
              </span>
            </div>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-end border-b border-outline-variant/10 pb-2">
                <span className="text-sm text-on-surface-variant">Ingresos totales</span>
                <span className="font-display font-medium text-lg text-on-surface">{symbol}{ingresos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-outline-variant/10 pb-2">
                <span className="text-sm text-on-surface-variant">Egresos totales</span>
                <span className="font-display font-medium text-lg text-on-surface">{symbol}{egresos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-semibold text-primary">Ingreso neto</span>
                <span className="font-display font-bold text-2xl text-primary">{symbol}{neto.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-auto">
            <button
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded bg-surface-container-low text-primary font-medium text-sm hover:bg-primary-container hover:text-on-primary-container transition-colors ghost-border"
              onClick={() => exportarPDF('resultados')}
            >
              <Icon name="picture_as_pdf" size={18} />
              Exportar PDF
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded bg-surface-container-low text-secondary font-medium text-sm hover:bg-secondary hover:text-on-secondary transition-colors ghost-border"
              onClick={exportarCSV}
            >
              <Icon name="table" size={18} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Balance General Card */}
        <div className="lg:col-span-4 bg-surface-container rounded-xl p-6 ghost-border flex flex-col justify-between relative overflow-hidden group">
          {/* Decorative background element */}
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-secondary/5 rounded-full blur-2xl pointer-events-none group-hover:bg-secondary/10 transition-colors duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary/10 text-secondary mb-4">
                  <Icon name="account_balance" />
                </div>
                <h3 className="font-display font-semibold text-xl text-on-surface mb-1">Balance General</h3>
                <p className="text-sm text-on-surface-variant">Panorama actual de activos y pasivos.</p>
              </div>
            </div>
            <div className="space-y-4 mb-8">
              <div className="p-3 bg-surface-container-lowest rounded-lg ghost-border">
                <div className="text-xs text-on-surface-variant mb-1 uppercase tracking-wide font-semibold">Activos</div>
                <div className="font-display font-medium text-xl text-on-surface">
                  {formatMoney(activos, settings.baseCurrency)}
                </div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">
                  Cuentas por cobrar pendientes ({porCobrarPendientes.length})
                </div>
              </div>
              <div className="p-3 bg-surface-container-lowest rounded-lg ghost-border">
                <div className="text-xs text-on-surface-variant mb-1 uppercase tracking-wide font-semibold">
                  Pasivos
                </div>
                <div className="font-display font-medium text-xl text-on-surface">
                  {formatMoney(pasivos, settings.baseCurrency)}
                </div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">
                  Cuentas por pagar pendientes ({porPagarPendientes.length})
                </div>
              </div>
            </div>
          </div>
          <div className="relative z-10 flex flex-col gap-2 mt-auto">
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-surface-container-lowest text-on-surface font-medium text-sm hover:bg-surface-container transition-colors ghost-border"
              onClick={() => exportarPDF('balance')}
            >
              <Icon name="download" size={18} />
              Descargar PDF
            </button>
          </div>
        </div>

        {/* Análisis visual */}
        {visibles.length > 0 && (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
              <h3 className="font-display font-semibold text-lg text-on-surface mb-1">Ingresos por categoría</h3>
              <p className="text-xs text-on-surface-variant mb-4">Distribución en el período filtrado.</p>
              <DonutChart
                data={ingresosPorCategoria}
                formatter={(v) => formatMoney(v, settings.baseCurrency)}
                centerLabel={`+${formatMoney(ingresos, settings.baseCurrency)}`}
              />
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
              <h3 className="font-display font-semibold text-lg text-on-surface mb-1">Egresos por categoría</h3>
              <p className="text-xs text-on-surface-variant mb-4">Distribución en el período filtrado.</p>
              <DonutChart
                data={egresosPorCategoria}
                formatter={(v) => formatMoney(v, settings.baseCurrency)}
                centerLabel={`-${formatMoney(egresos, settings.baseCurrency)}`}
              />
            </div>
            <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
              <h3 className="font-display font-semibold text-lg text-on-surface mb-1">Flujo mensual</h3>
              <p className="text-xs text-on-surface-variant mb-4">Ingresos vs egresos por mes en {settings.baseCurrency}.</p>
              <MonthlyBars data={mensual} formatter={(v) => formatMoney(v, settings.baseCurrency)} />
            </div>
          </div>
        )}

        {/* Historial Completo (Full Width Data Table Style) */}
        <div className="lg:col-span-12 bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
                <Icon name="history" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-xl text-on-surface">Historial Completo</h3>
                <p className="text-sm text-on-surface-variant">
                  {visibles.length} registro(s) en el período seleccionado.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="flex items-center bg-surface-container-low rounded-lg ghost-border p-1 focus-within:ring-2 focus-within:ring-primary transition-all">
                <Icon name="search" size={18} className="text-on-surface-variant ml-2 mr-1" />
                <input
                  className="w-full min-w-[160px] bg-transparent border-none text-sm text-on-surface focus:ring-0 py-1.5 px-2"
                  placeholder="Buscar…"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value)
                    setPagina(0)
                  }}
                />
              </div>
              <button
                className="flex items-center justify-center gap-2 px-4 py-2 rounded bg-primary text-on-primary font-medium text-sm glow-hover transition-colors"
                onClick={exportarExcel}
              >
                <Icon name="file_download" size={18} />
                Exportar Excel
              </button>
            </div>
          </div>

          {/* Pseudo-table / List layout */}
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-6 gap-4 px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider md:grid">
              <div>Fecha</div>
              <div>Tipo</div>
              <div>Categoría</div>
              <div>Descripción</div>
              <div className="text-right">Monto / Métrica</div>
              <div className="text-right hidden md:block">Acciones</div>
            </div>

            {/* Items */}
            {historyPagina.length === 0 ? (
              <EmptyState
                icon="history"
                title="No hay registros"
                description="No hay movimientos que coincidan con los filtros seleccionados."
              />
            ) : (
              historyPagina.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 p-4 rounded-lg bg-surface hover:bg-surface-container-low transition-colors ghost-border items-center"
                >
                  <div className="text-sm text-on-surface-variant">
                    <span className="md:hidden font-semibold mr-2">Fecha:</span>
                    {row.date}
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ghost-border ${TYPE_STYLES[row.type]}`}
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
                  <div className="flex items-center gap-1 md:justify-end">
                    <button
                      aria-label="Editar movimiento"
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors active:scale-95"
                      onClick={() => navigate(`/movimientos/editar/${row.id}`)}
                    >
                      <Icon name="edit" size={18} />
                    </button>
                    <button
                      aria-label="Eliminar movimiento"
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors active:scale-95"
                      onClick={() => setEliminando(row)}
                    >
                      <Icon name="delete" size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {history.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              {!verTodos && totalPaginas > 1 ? (
                <div className="flex items-center gap-4">
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    disabled={paginaActual === 0}
                    onClick={() => setPagina(paginaActual - 1)}
                  >
                    <Icon name="chevron_left" size={18} />
                    Anterior
                  </button>
                  <span className="text-sm text-on-surface-variant">
                    {paginaActual * PAGE_SIZE + 1}–{Math.min((paginaActual + 1) * PAGE_SIZE, history.length)} de{' '}
                    {history.length}
                  </span>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    disabled={paginaActual >= totalPaginas - 1}
                    onClick={() => setPagina(paginaActual + 1)}
                  >
                    Siguiente
                    <Icon name="chevron_right" size={18} />
                  </button>
                </div>
              ) : (
                <span />
              )}
              <button
                className="text-sm text-primary font-medium hover:underline"
                onClick={() => {
                  setVerTodos((v) => !v)
                  setPagina(0)
                }}
              >
                {verTodos ? 'Ver solo 6 por página' : 'Ver todos los registros'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Eliminar Movimiento Modal */}
      <Modal
        open={eliminando !== null}
        onClose={() => setEliminando(null)}
        panelClassName="w-full max-w-sm my-auto bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_24px_60px_rgba(11,28,48,0.25)]"
        payload={eliminando}
      >
        {(eliminando) => (
          <>
            <h3 className="font-display font-semibold text-xl text-on-surface mb-2">¿Eliminar movimiento?</h3>
            <p className="text-sm text-on-surface-variant mb-2">
              <span className="font-medium text-on-surface">{eliminando.description}</span>
            </p>
            <p className="text-sm text-on-surface-variant">
              El movimiento se eliminará permanentemente. Esta acción no se puede deshacer.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                onClick={() => setEliminando(null)}
              >
                Cancelar
              </button>
              <button
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-error text-on-error hover:bg-error/90 transition-colors disabled:opacity-60"
                disabled={eliminandoId === eliminando.id}
                onClick={confirmarEliminar}
              >
                {eliminandoId === eliminando.id ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
