import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/EmptyState'
import { TopCounterparties } from '@/components/charts/charts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/components/auth/auth-context'
import { isFreeText, isPositiveNumber, isRate, isTextOnly, parseDecimal } from '@/lib/validation'
import { CreateAccount, type AccountType, type InterestPeriod } from '@/backend/services/Accounts-Services/Create.Account'
import { SelectAccounts } from '@/backend/services/Accounts-Services/Select.Accounts'
import { CreatePayment } from '@/backend/services/Accounts-Services/Create.Payment'
import { UpdateAccount } from '@/backend/services/Accounts-Services/Update.Account'
import { DeleteAccount } from '@/backend/services/Accounts-Services/Delete.Account'
import { SelectPayments } from '@/backend/services/Accounts-Services/Select.Payments'
import { CreateMovement } from '@/backend/services/Movements-Services/Create.Movement'
import type { UserMovements } from '@/backend/utils/types'
import { GetCurrencySettings } from '@/backend/services/Currency-Services/Get.CurrencySettings'
import {
  convertToBase,
  DEFAULT_CURRENCY_SETTINGS,
  formatMoney,
  missingRates,
  type CurrencySettings,
} from '@/lib/currency'

type TipoCuenta = 'por-pagar' | 'por-cobrar'

const PAGE_SIZE = 6

const CATEGORIES_INGRESO = ['Ventas', 'Servicios', 'Nómina', 'Otros']
const CATEGORIES_EGRESO = ['Operaciones', 'Servicios', 'Nómina', 'Imprevistos', 'Contingencia']

interface Cuenta {
  id: string
  contraparte: string
  concepto: string
  monto: number
  abonado: number
  vencimiento: string
  vencida: boolean
  creadaEn: string
  interesRate: number
  interesPeriod: InterestPeriod | null
  currency: string
}

function mesesEntre(inicio: Date, ahora: Date): number {
  let meses = (ahora.getFullYear() - inicio.getFullYear()) * 12 + (ahora.getMonth() - inicio.getMonth())
  if (ahora.getDate() < inicio.getDate()) meses -= 1
  return Math.max(0, meses)
}

function calcularInteres(c: Cuenta): number {
  if (!c.interesRate || c.interesRate <= 0) return 0
  const saldo = c.monto - c.abonado
  if (saldo <= 0) return 0
  const inicio = new Date(c.creadaEn)
  if (Number.isNaN(inicio.getTime())) return 0
  const dias = Math.floor((Date.now() - inicio.getTime()) / 86400000)
  if (dias < 0) return 0
  let periodos = 0
  if (c.interesPeriod === 'weekly') periodos = Math.floor(dias / 7)
  else if (c.interesPeriod === 'monthly') periodos = mesesEntre(inicio, new Date())
  return saldo * (c.interesRate / 100) * periodos
}

function estadoDe(c: Cuenta, esPagar: boolean): 'Pendiente' | 'Vencida' | 'Pagada' | 'Cobrada' {
  if (c.abonado >= c.monto) return esPagar ? 'Pagada' : 'Cobrada'
  if (c.vencida) return 'Vencida'
  return 'Pendiente'
}

function colorEstado(estado: string): string {
  switch (estado) {
    case 'Vencida':
      return 'bg-error/10 text-error'
    case 'Pagada':
    case 'Cobrada':
      return 'bg-primary/10 text-primary'
    default:
      return 'bg-surface-container text-on-surface-variant'
  }
}

function mapearCuenta(row: any): Cuenta {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vencimiento = row.due_date ? new Date(row.due_date) : null
  return {
    id: row.id,
    contraparte: row.counterparty,
    concepto: row.description,
    monto: Number(row.amount),
    abonado: Number(row.paid),
    vencimiento: row.due_date ?? '',
    vencida: vencimiento ? vencimiento < hoy && Number(row.paid) < Number(row.amount) : false,
    creadaEn: row.created_at,
    interesRate: Number(row.interest_rate ?? 0),
    interesPeriod: row.interest_period ?? null,
    currency: row.currency ?? 'USD',
  }
}

export function Accounts() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TipoCuenta>('por-pagar')
  const [porPagar, setPorPagar] = useState<Cuenta[]>([])
  const [porCobrar, setPorCobrar] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(false)
  const [abonando, setAbonando] = useState<Cuenta | null>(null)
  const [montoAbono, setMontoAbono] = useState('')
  const [registrarMovimiento, setRegistrarMovimiento] = useState(true)
  const [categoriaMovimiento, setCategoriaMovimiento] = useState('Ventas')
  const [registrando, setRegistrando] = useState(false)
  const [creando, setCreando] = useState(false)
  const [guardandoCuenta, setGuardandoCuenta] = useState(false)
  const [editando, setEditando] = useState<Cuenta | null>(null)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [eliminando, setEliminando] = useState<Cuenta | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [form, setForm] = useState({
    contraparte: '',
    concepto: '',
    monto: '',
    vencimiento: '',
    interes: '',
    periodo: 'monthly' as InterestPeriod,
    currency: 'USD',
  })
  const [formEditar, setFormEditar] = useState({
    contraparte: '',
    concepto: '',
    monto: '',
    vencimiento: '',
    interes: '',
    periodo: 'monthly' as InterestPeriod,
    currency: 'USD',
  })
  const [expandidoId, setExpandidoId] = useState<string | null>(null)
  const [pagos, setPagos] = useState<Record<string, any[]>>({})
  const [cargandoPagos, setCargandoPagos] = useState<string | null>(null)
  const [settings, setSettings] = useState<CurrencySettings>(DEFAULT_CURRENCY_SETTINGS)
  const [missing, setMissing] = useState<string[]>([])
  const [pagina, setPagina] = useState(0)

  const esPagar = tab === 'por-pagar'
  const tipo: AccountType = esPagar ? 'payable' : 'receivable'
  const cuentas = esPagar ? porPagar : porCobrar
  const totalPaginas = Math.max(1, Math.ceil(cuentas.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas - 1)
  const cuentasPagina = cuentas.slice(paginaActual * PAGE_SIZE, paginaActual * PAGE_SIZE + PAGE_SIZE)

  const cargar = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [pagar, cobrar] = await Promise.all([
      SelectAccounts(user.id, 'payable'),
      SelectAccounts(user.id, 'receivable'),
    ])
    setLoading(false)
    if (pagar.ok) setPorPagar((pagar.data as any[]).map(mapearCuenta))
    if (cobrar.ok) setPorCobrar((cobrar.data as any[]).map(mapearCuenta))
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    if (!user) return
    let activo = true
    GetCurrencySettings(user.id).then((res) => {
      if (!activo) return
      const base = res.ok ? (res.data.base_currency ?? 'USD') : 'USD'
      const rates = res.ok ? (res.data.rates ?? {}) : {}
      const s: CurrencySettings = { baseCurrency: base as CurrencySettings['baseCurrency'], rates }
      setSettings(s)
      setMissing(missingRates([...porPagar, ...porCobrar], s))
    })
    return () => {
      activo = false
    }
  }, [user, porPagar, porCobrar])

  const abiertas = cuentas.filter((c) => estadoDe(c, esPagar) === 'Pendiente' || estadoDe(c, esPagar) === 'Vencida')
  const vencidas = cuentas.filter((c) => estadoDe(c, esPagar) === 'Vencida')
  const totalPendiente = abiertas.reduce(
    (acc, c) => acc + convertToBase(c.monto - c.abonado + calcularInteres(c), c.currency, settings),
    0
  )
  const totalAbonado = cuentas.reduce(
    (acc, c) => acc + convertToBase(c.abonado, c.currency, settings),
    0
  )

  const fmt = (monto: number, moneda: string) =>
    formatMoney(convertToBase(monto, moneda, settings), settings.baseCurrency)

  const topContrapartes = cuentas
    .map((c) => ({
      name: c.contraparte,
      value: convertToBase(Math.max(0, c.monto - c.abonado), c.currency, settings),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const abrirAbono = (c: Cuenta) => {
    setAbonando(c)
    setMontoAbono('')
    setRegistrarMovimiento(true)
    setCategoriaMovimiento(esPagar ? 'Operaciones' : 'Ventas')
  }

  const toggleExpandir = async (c: Cuenta) => {
    if (expandidoId === c.id) {
      setExpandidoId(null)
      return
    }
    setExpandidoId(c.id)
    if (!pagos[c.id]) {
      setCargandoPagos(c.id)
      const res = await SelectPayments(c.id)
      setCargandoPagos(null)
      if (res.ok) {
        setPagos((prev) => ({ ...prev, [c.id]: res.data as any[] }))
      }
    }
  }

  const formatFechaHora = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const formatFechaAbono = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const registrarAbono = async () => {
    if (!abonando || !user) return
    if (!isPositiveNumber(montoAbono)) {
      toast.error('Ingresa un monto válido mayor a cero (hasta 2 decimales).')
      return
    }
    const cantidad = parseDecimal(montoAbono)
    setRegistrando(true)
    const result = await CreatePayment({ accountId: abonando.id, amount: cantidad })
    if (!result.ok) {
      setRegistrando(false)
      toast.error(result.error ?? 'No se pudo registrar el abono.')
      return
    }
    if (registrarMovimiento) {
      const mov = await CreateMovement({
        userId: user.id,
        mount: cantidad,
        description: `${esPagar ? 'Pago' : 'Cobro'} de ${abonando.contraparte}: ${abonando.concepto}`,
        type: esPagar ? 'egreso' : 'ingreso',
        category: categoriaMovimiento as UserMovements['category'],
        currency: abonando.currency,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      if (!mov.ok) {
        setRegistrando(false)
        toast.error(`Abono registrado, pero no se pudo crear el movimiento: ${mov.error ?? ''}`)
        setAbonando(null)
        setPagos({})
        cargar()
        return
      }
    }
    setRegistrando(false)
    toast.success(
      registrarMovimiento
        ? esPagar
          ? 'Abono registrado y egreso creado.'
          : 'Cobro registrado e ingreso creado.'
        : esPagar
          ? 'Abono registrado.'
          : 'Cobro registrado.'
    )
    setAbonando(null)
    setPagos({})
    cargar()
  }

  const registrarCuenta = async () => {
    if (!user) return
    const contraparte = form.contraparte.trim()
    const concepto = form.concepto.trim()
    if (!isTextOnly(contraparte)) {
      toast.error('La contraparte solo puede contener letras y espacios.')
      return
    }
    if (!isFreeText(concepto)) {
      toast.error('Agrega un concepto válido.')
      return
    }
    if (!isPositiveNumber(form.monto)) {
      toast.error('Ingresa un monto válido mayor a cero (hasta 2 decimales).')
      return
    }
    const monto = parseDecimal(form.monto)
    const tieneInteres = form.interes.trim() !== ''
    if (tieneInteres && !isRate(form.interes)) {
      toast.error('Ingresa un porcentaje de interés válido (0 a 100).')
      return
    }
    const interes = tieneInteres ? parseDecimal(form.interes) : null
    setGuardandoCuenta(true)
    const result = await CreateAccount({
      userId: user.id,
      type: tipo,
      counterparty: contraparte,
      description: concepto,
      amount: monto,
      dueDate: form.vencimiento || null,
      interestRate: interes,
      interestPeriod: interes === null ? null : form.periodo,
      currency: form.currency,
    })
    setGuardandoCuenta(false)
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo crear la cuenta.')
      return
    }
    toast.success(esPagar ? 'Cuenta por pagar creada.' : 'Cuenta por cobrar creada.')
    setCreando(false)
    setForm({
      contraparte: '',
      concepto: '',
      monto: '',
      vencimiento: '',
      interes: '',
      periodo: 'monthly',
      currency: 'USD',
    })
    cargar()
  }

  const abrirEdicion = (c: Cuenta) => {
    setEditando(c)
    setFormEditar({
      contraparte: c.contraparte,
      concepto: c.concepto,
      monto: String(c.monto),
      vencimiento: c.vencimiento,
      interes: c.interesRate > 0 ? String(c.interesRate) : '',
      periodo: c.interesPeriod ?? 'monthly',
      currency: c.currency,
    })
  }

  const guardarEdicion = async () => {
    if (!editando || !user) return
    const contraparte = formEditar.contraparte.trim()
    const concepto = formEditar.concepto.trim()
    if (!isTextOnly(contraparte)) {
      toast.error('La contraparte solo puede contener letras y espacios.')
      return
    }
    if (!isFreeText(concepto)) {
      toast.error('Agrega un concepto válido.')
      return
    }
    if (!isPositiveNumber(formEditar.monto)) {
      toast.error('Ingresa un monto válido mayor a cero (hasta 2 decimales).')
      return
    }
    const monto = parseDecimal(formEditar.monto)
    const tieneInteres = formEditar.interes.trim() !== ''
    if (tieneInteres && !isRate(formEditar.interes)) {
      toast.error('Ingresa un porcentaje de interés válido (0 a 100).')
      return
    }
    const interes = tieneInteres ? parseDecimal(formEditar.interes) : null
    setGuardandoEdicion(true)
    const result = await UpdateAccount({
      accountId: editando.id,
      userId: user.id,
      counterparty: contraparte,
      description: concepto,
      amount: monto,
      dueDate: formEditar.vencimiento || null,
      interestRate: interes,
      interestPeriod: interes === null ? null : formEditar.periodo,
      currency: formEditar.currency,
      paid: editando.abonado,
    })
    setGuardandoEdicion(false)
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo actualizar la cuenta.')
      return
    }
    toast.success('Cuenta actualizada.')
    setEditando(null)
    setPagos({})
    cargar()
  }

  const confirmarEliminar = async () => {
    if (!eliminando || !user) return
    setEliminandoId(eliminando.id)
    const result = await DeleteAccount({ accountId: eliminando.id, userId: user.id })
    setEliminandoId(null)
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo eliminar la cuenta.')
      return
    }
    toast.success('Cuenta eliminada.')
    setEliminando(null)
    setPagos({})
    cargar()
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-2">Cuentas</h2>
          <p className="text-on-surface-variant text-sm md:text-base">
            Cuentas por pagar y por cobrar en un solo lugar.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary font-medium text-sm glow-hover transition-all"
          onClick={() => setCreando(true)}
        >
          <Icon name="add" size={18} />
          Nueva cuenta
        </button>
      </div>

      {/* Tabs */}
      <div className="inline-flex items-center gap-1 p-1 bg-surface-container-lowest rounded-lg ghost-border">
        <button
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            esPagar ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          onClick={() => {
            setTab('por-pagar')
            setPagina(0)
          }}
        >
          <Icon name="trending_down" size={18} />
          Cuentas por Pagar
        </button>
        <button
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            !esPagar ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          onClick={() => {
            setTab('por-cobrar')
            setPagina(0)
          }}
        >
          <Icon name="trending_up" size={18} />
          Cuentas por Cobrar
        </button>
      </div>

      {/* Currency Warning */}
      {missing.length > 0 && (
        <a
          href="#"
          className="flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/15 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            toast.error('Configura la tasa en Perfil → Conversión de moneda.')
          }}
        >
          <Icon name="warning" size={20} className="mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">
              Hay cuentas en {missing.join(' y ')} sin tasa configurada.
            </p>
            <p className="text-error/80">
              Sin tasa, sus montos no se incluyen en los totales en {settings.baseCurrency}.
            </p>
          </div>
        </a>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_8px_32px_rgba(11,28,48,0.03)]">
          <p className="text-sm text-on-surface-variant font-medium mb-1">Total pendiente</p>
          <p className="font-display font-bold text-3xl text-on-surface">{formatMoney(totalPendiente, settings.baseCurrency)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_8px_32px_rgba(11,28,48,0.03)]">
          <p className="text-sm text-on-surface-variant font-medium mb-1">Vencidas</p>
          <p className="font-display font-bold text-3xl text-error">{vencidas.length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_8px_32px_rgba(11,28,48,0.03)]">
          <p className="text-sm text-on-surface-variant font-medium mb-1">Abonado</p>
          <p className="font-display font-bold text-3xl text-primary">
            {formatMoney(totalAbonado, settings.baseCurrency)}
          </p>
        </div>
      </div>

      {/* Top contrapartes */}
      {topContrapartes.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-display font-semibold text-xl text-on-surface">Top contrapartes</h3>
              <p className="text-sm text-on-surface-variant">
                Montos pendientes por contraparte en {settings.baseCurrency}.
              </p>
            </div>
          </div>
          <TopCounterparties data={topContrapartes} formatter={(v) => fmt(v, settings.baseCurrency)} />
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_4px_24px_rgba(11,28,48,0.02)]">
        <h3 className="font-display font-semibold text-xl text-on-surface mb-6">
          {esPagar ? 'Cuentas por Pagar' : 'Cuentas por Cobrar'}
        </h3>
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-on-surface-variant text-center py-8">Cargando cuentas…</p>
          ) : cuentas.length === 0 ? (
            <EmptyState
              icon="receipt_long"
              title={`Aún no hay cuentas por ${esPagar ? 'pagar' : 'cobrar'}`}
              description="Crea una cuenta para empezar a llevar el control de tus pagos y cobros."
            />
          ) : (
            cuentasPagina.map((c) => {
            const estado = estadoDe(c, esPagar)
            const interes = calcularInteres(c)
            const restante = c.monto - c.abonado + interes
            const saldada = c.abonado >= c.monto
            const expandido = expandidoId === c.id
            const abonos = pagos[c.id] ?? []
            return (
              <div
                key={c.id}
                className="rounded-lg bg-surface hover:bg-surface-container-low transition-colors ghost-border"
              >
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 p-4 items-center">
                <div className="text-sm font-medium text-on-surface truncate">
                  <span className="md:hidden text-on-surface-variant font-normal mr-2">Contraparte:</span>
                  <span className="inline-flex items-center gap-1.5">
                    <button
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-on-surface-variant hover:bg-surface-container transition-colors"
                      onClick={() => toggleExpandir(c)}
                      aria-label={expandido ? 'Ocultar abonos' : 'Ver abonos'}
                    >
                      <Icon
                        name="chevron_right"
                        size={16}
                        className={`transition-transform ${expandido ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {c.contraparte}
                  </span>
                  <span className="block text-[10px] font-normal text-on-surface-variant mt-0.5">
                    Creada {formatFechaHora(c.creadaEn)}
                  </span>
                </div>
                <div className="text-sm text-on-surface-variant md:col-span-2">
                  <span className="md:hidden text-on-surface-variant font-normal mr-2">Concepto:</span>
                  {c.concepto}
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant">
                    {c.currency}
                  </span>
                </div>
                <div className="text-sm md:text-right font-display font-medium text-on-surface">
                  <span className="md:hidden text-on-surface-variant font-normal mr-2">Restante:</span>
                  {fmt(restante, c.currency)}
                  {interes > 0 && (
                    <span className="block text-[10px] text-error font-normal">
                      incluye {fmt(interes, c.currency)} de interés {c.interesPeriod === 'weekly' ? 'semanal' : 'mensual'} ({c.interesRate}%)
                    </span>
                  )}
                  {c.abonado > 0 && (
                    <span className="block text-[10px] text-on-surface-variant font-normal">
                      de {fmt(c.monto, c.currency)} · abonado {fmt(c.abonado, c.currency)}
                    </span>
                  )}
                </div>
                <div className="flex items-center md:justify-end gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorEstado(estado)}`}
                  >
                    {estado}
                  </span>
                </div>
                <div className="flex items-center md:justify-end gap-2">
                  {!saldada && (
                    <button
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-primary text-on-primary hover:bg-primary/90"
                      onClick={() => abrirAbono(c)}
                    >
                      <Icon name="payments" size={16} />
                      {esPagar ? 'Abonar' : 'Registrar cobro'}
                    </button>
                  )}
                  <button
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                    onClick={() => abrirEdicion(c)}
                    aria-label="Editar cuenta"
                    title="Editar cuenta"
                  >
                    <Icon name="edit" size={18} />
                  </button>
                  <button
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                    onClick={() => setEliminando(c)}
                    aria-label="Eliminar cuenta"
                    title="Eliminar cuenta"
                  >
                    {eliminandoId === c.id ? (
                      <Icon name="progress_activity" size={18} className="animate-spin" />
                    ) : (
                      <Icon name="delete" size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  expandido ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 border-t border-outline-variant/10">
                    <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider py-3">
                      Historial de abonos
                    </h4>
                    {cargandoPagos === c.id ? (
                      <p className="text-sm text-on-surface-variant py-2">Cargando…</p>
                    ) : abonos.length === 0 ? (
                      <p className="text-sm text-on-surface-variant py-2">Aún no hay abonos registrados.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {abonos.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-surface-container-low"
                          >
                            <span className="text-on-surface-variant">{formatFechaAbono(p.created_at)}</span>
                            <span className="font-display font-medium text-on-surface">
                              {esPagar ? '-' : '+'}
                              {fmt(Number(p.amount), c.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>
              )
            })
          )}
        </div>
        {cuentas.length > 0 && totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10">
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:pointer-events-none"
              disabled={paginaActual === 0}
              onClick={() => setPagina(paginaActual - 1)}
            >
              <Icon name="chevron_left" size={18} />
              Anterior
            </button>
            <span className="text-sm text-on-surface-variant">
              {paginaActual * PAGE_SIZE + 1}–{Math.min((paginaActual + 1) * PAGE_SIZE, cuentas.length)} de{' '}
              {cuentas.length}
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
        )}
      </div>

      {/* Abono Modal */}
      {abonando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAbonando(null)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_24px_60px_rgba(11,28,48,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-semibold text-xl text-on-surface mb-1">
              {esPagar ? 'Abonar a cuenta' : 'Registrar cobro'}
            </h3>
            <p className="text-sm text-on-surface-variant mb-5">
              {abonando.contraparte} · {abonando.concepto}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Restante por {esPagar ? 'pagar' : 'cobrar'}</label>
                <p className="font-display font-bold text-2xl text-on-surface">
                  {fmt(abonando.monto - abonando.abonado + calcularInteres(abonando), abonando.currency)}
                </p>
                {calcularInteres(abonando) > 0 && (
                  <p className="text-xs text-on-surface-variant mt-1">
                    Incluye {fmt(calcularInteres(abonando), abonando.currency)} de interés{' '}
                    {abonando.interesPeriod === 'weekly' ? 'semanal' : 'mensual'} ({abonando.interesRate}%).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="monto-abono">
                  Monto del {esPagar ? 'abono' : 'cobro'}
                </label>
                <input
                  autoFocus
                  className="block w-full pl-3 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  id="monto-abono"
                  inputMode="decimal"
                  placeholder="0.00"
                  type="text"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                <div>
                  <p className="text-sm font-medium text-on-surface">Registrar en movimientos</p>
                  <p className="text-xs text-on-surface-variant">
                    Crea un {esPagar ? 'egreso' : 'ingreso'} automáticamente
                  </p>
                </div>
                <Switch checked={registrarMovimiento} onCheckedChange={setRegistrarMovimiento} />
              </div>

              {registrarMovimiento && (
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="movimiento-categoria">
                    Categoría del movimiento
                  </label>
                  <Select value={categoriaMovimiento} onValueChange={setCategoriaMovimiento}>
                    <SelectTrigger className="w-full h-[42px] rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 text-sm font-medium text-on-surface shadow-none hover:bg-surface-container focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {(esPagar ? CATEGORIES_EGRESO : CATEGORIES_INGRESO).map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                onClick={() => setAbonando(null)}
              >
                Cancelar
              </button>
              <button
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60"
                disabled={registrando}
                onClick={registrarAbono}
              >
                {esPagar ? 'Abonar' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nueva Cuenta Modal */}
      {creando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setCreando(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_24px_60px_rgba(11,28,48,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-semibold text-xl text-on-surface mb-1">
              Nueva cuenta por {esPagar ? 'pagar' : 'cobrar'}
            </h3>
            <p className="text-sm text-on-surface-variant mb-5">
              Registra una cuenta asociada a tu usuario.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="cuenta-contraparte">
                  Contraparte
                </label>
                <input
                  autoFocus
                  className="block w-full pl-3 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  id="cuenta-contraparte"
                  placeholder="Proveedor o cliente"
                  type="text"
                  value={form.contraparte}
                  onChange={(e) => setForm({ ...form, contraparte: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="cuenta-concepto">
                  Concepto
                </label>
                <input
                  className="block w-full pl-3 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  id="cuenta-concepto"
                  placeholder="Descripción de la cuenta"
                  type="text"
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="cuenta-monto">
                    Monto
                  </label>
                  <input
                    className="block w-full pl-3 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    id="cuenta-monto"
                    inputMode="decimal"
                    placeholder="0.00"
                    type="text"
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Moneda</label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger className="w-full h-[42px] rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 text-sm font-medium text-on-surface shadow-none hover:bg-surface-container focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="VES">VES (Bs)</SelectItem>
                      <SelectItem value="CLP">CLP ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="cuenta-vencimiento">
                  Vencimiento
                </label>
                <input
                  className="block w-full pl-3 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  id="cuenta-vencimiento"
                  type="date"
                  value={form.vencimiento}
                  onChange={(e) => setForm({ ...form, vencimiento: e.target.value })}
                />
              </div>
              {!esPagar && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="cuenta-interes">
                      Interés (%) <span className="text-on-surface-variant font-normal">(opcional)</span>
                    </label>
                    <input
                      className="block w-full pl-3 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                      id="cuenta-interes"
                      inputMode="decimal"
                      placeholder="0.00"
                      type="text"
                      value={form.interes}
                      onChange={(e) => setForm({ ...form, interes: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Periodo del interés</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          form.periodo === 'weekly'
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                        }`}
                        type="button"
                        onClick={() => setForm({ ...form, periodo: 'weekly' })}
                      >
                        Semanal
                      </button>
                      <button
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          form.periodo === 'monthly'
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                        }`}
                        type="button"
                        onClick={() => setForm({ ...form, periodo: 'monthly' })}
                      >
                        Mensual
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {!esPagar && (
                <p className="text-xs text-on-surface-variant">
                  El interés se calcula sobre el saldo pendiente desde la fecha de creación de la cuenta.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                onClick={() => setCreando(false)}
              >
                Cancelar
              </button>
              <button
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60"
                disabled={guardandoCuenta}
                onClick={registrarCuenta}
              >
                Crear cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editar Cuenta Modal */}
      {editando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEditando(null)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_24px_60px_rgba(11,28,48,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-semibold text-xl text-on-surface mb-1">
              Editar cuenta por {esPagar ? 'pagar' : 'cobrar'}
            </h3>
            <p className="text-sm text-on-surface-variant mb-5">
              {editando.contraparte} · {editando.concepto}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="editar-contraparte">
                  Contraparte
                </label>
                <input
                  autoFocus
                  className="block w-full pl-3 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  id="editar-contraparte"
                  placeholder="Proveedor o cliente"
                  type="text"
                  value={formEditar.contraparte}
                  onChange={(e) => setFormEditar({ ...formEditar, contraparte: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="editar-concepto">
                  Concepto
                </label>
                <input
                  className="block w-full pl-3 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  id="editar-concepto"
                  placeholder="Descripción de la cuenta"
                  type="text"
                  value={formEditar.concepto}
                  onChange={(e) => setFormEditar({ ...formEditar, concepto: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="editar-monto">
                    Monto
                  </label>
                  <input
                    className="block w-full pl-3 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    id="editar-monto"
                    inputMode="decimal"
                    placeholder="0.00"
                    type="text"
                    value={formEditar.monto}
                    onChange={(e) => setFormEditar({ ...formEditar, monto: e.target.value })}
                  />
                  {editando.abonado > 0 && (
                    <p className="text-xs text-on-surface-variant mt-1">
                      Ya abonado {fmt(editando.abonado, editando.currency)} — el monto no puede ser menor.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Moneda</label>
                  <Select value={formEditar.currency} onValueChange={(v) => setFormEditar({ ...formEditar, currency: v })}>
                    <SelectTrigger className="w-full h-[42px] rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 text-sm font-medium text-on-surface shadow-none hover:bg-surface-container focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="VES">VES (Bs)</SelectItem>
                      <SelectItem value="CLP">CLP ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="editar-vencimiento">
                  Vencimiento
                </label>
                <input
                  className="block w-full pl-3 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  id="editar-vencimiento"
                  type="date"
                  value={formEditar.vencimiento}
                  onChange={(e) => setFormEditar({ ...formEditar, vencimiento: e.target.value })}
                />
              </div>
              {!esPagar && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="editar-interes">
                      Interés (%) <span className="text-on-surface-variant font-normal">(opcional)</span>
                    </label>
                    <input
                      className="block w-full pl-3 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                      id="editar-interes"
                      inputMode="decimal"
                      placeholder="0.00"
                      type="text"
                      value={formEditar.interes}
                      onChange={(e) => setFormEditar({ ...formEditar, interes: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Periodo del interés</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formEditar.periodo === 'weekly'
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                        }`}
                        type="button"
                        onClick={() => setFormEditar({ ...formEditar, periodo: 'weekly' })}
                      >
                        Semanal
                      </button>
                      <button
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formEditar.periodo === 'monthly'
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                        }`}
                        type="button"
                        onClick={() => setFormEditar({ ...formEditar, periodo: 'monthly' })}
                      >
                        Mensual
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                onClick={() => setEditando(null)}
              >
                Cancelar
              </button>
              <button
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60"
                disabled={guardandoEdicion}
                onClick={guardarEdicion}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eliminar Cuenta Modal */}
      {eliminando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEliminando(null)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_24px_60px_rgba(11,28,48,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-semibold text-xl text-on-surface mb-2">¿Eliminar cuenta?</h3>
            <p className="text-sm text-on-surface-variant mb-2">
              <span className="font-medium text-on-surface">{eliminando.contraparte}</span> · {eliminando.concepto}
            </p>
            <p className="text-sm text-on-surface-variant">
              Se eliminará la cuenta y su historial de abonos. Esta acción no se puede deshacer.
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
          </div>
        </div>
      )}
    </div>
  )
}
