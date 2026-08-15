import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Icon } from '@/components/Icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RouteTransition } from '@/components/RouteTransition'
import { useAuth } from '@/components/auth/auth-context'
import { isFreeText, isPositiveNumber, parseDecimal } from '@/lib/validation'
import { CreateMovement } from '@/backend/services/Movements-Services/Create.Movement'
import type { UserMovements } from '@/backend/utils/types'

type TxType = 'egreso' | 'ingreso'

const CATEGORIES_INGRESO = [
  { name: 'Ventas', icon: 'point_of_sale' },
  { name: 'Servicios', icon: 'handshake' },
  { name: 'Pago de mi nómina', icon: 'badge' },
  { name: 'Otros', icon: 'more_horiz' },
]

const CATEGORIES_EGRESO = [
  { name: 'Operaciones', icon: 'storefront' },
  { name: 'Servicios', icon: 'bolt' },
  { name: 'Nómina', icon: 'badge' },
  { name: 'Imprevistos', icon: 'warning' },
  { name: 'Contingencia', icon: 'savings' },
]

export function NuevoMovimiento() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<TxType>('egreso')
  const [category, setCategory] = useState(0)
  const [currency, setCurrency] = useState('USD')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const sign = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'Bs'
  const CATEGORIES = type === 'ingreso' ? CATEGORIES_INGRESO : CATEGORIES_EGRESO

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!isPositiveNumber(amount)) {
      toast.error('Ingresa un monto válido mayor a cero (hasta 2 decimales).')
      return
    }
    const monto = parseDecimal(amount)
    if (!isFreeText(notes)) {
      toast.error('Agrega una descripción válida.')
      return
    }
    if (!user) {
      toast.error('Debes iniciar sesión.')
      return
    }

    const movement: UserMovements = {
      userId: user.id,
      mount: monto,
      description: notes.trim(),
      type,
      category: CATEGORIES[category].name as UserMovements['category'],
      currency,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setSaving(true)
    const result = await CreateMovement(movement)
    setSaving(false)

    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo registrar el movimiento.')
      return
    }

    toast.success('Movimiento registrado.')
    navigate('/dashboard')
  }



  return (
    <div className="bg-surface text-on-surface font-body antialiased min-h-screen flex flex-col relative selection:bg-primary-container selection:text-on-primary-container">
      {/* Ambient Background Glows */}
      <div className="fixed top-0 inset-x-0 h-64 bg-gradient-to-b from-surface-container-low to-transparent opacity-50 pointer-events-none z-0" />

      {/* Task-Focused Header (Suppresses Global Shell) */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl transition-all duration-300">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-2xl mx-auto">
          <button
            aria-label="Volver"
            className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface active:scale-95"
            onClick={() => navigate(-1)}
          >
            <Icon name="arrow_back" />
          </button>
          <h1 className="font-headline text-lg font-bold tracking-tight text-on-surface">Nuevo Movimiento</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content Canvas */}
      <RouteTransition>
        <main className="flex-1 w-full max-w-2xl mx-auto pt-20 pb-32 px-6 flex flex-col space-y-10 relative z-10">
        {/* Amount & Currency Section */}
        <section className="flex flex-col items-center justify-center pt-8 pb-4">
          {/* Currency Selector */}
          <div className="mb-6">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="mx-auto w-auto rounded-full border-none bg-surface-container-low px-4 py-1.5 h-auto font-headline font-semibold text-sm text-on-surface shadow-none hover:bg-surface-container focus:ring-2 focus:ring-primary data-[placeholder]:text-on-surface">
                <SelectValue placeholder="Moneda" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="VES">VES</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/*change sign moneda*/}
          {/* Large Prominent Amount Input */}
          <div className="relative w-full flex justify-center">
            <span className="absolute left-1/2 -translate-x-32 top-1 text-3xl font-headline font-medium text-on-surface-variant/50">
              {sign}
            </span>
            <input
              className="custom-input w-full text-center text-7xl font-headline font-bold text-on-surface bg-transparent border-none focus:ring-0 placeholder:text-on-surface-variant/20 tracking-tighter"
              inputMode="decimal"
              placeholder="0.00"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </section>

        {/* Transaction Type Segmented Control */}
        <section className="w-full">
          <div className="flex bg-surface-container-low p-1.5 rounded-2xl w-full relative">
            <button
              className={`flex-1 py-3 text-center rounded-xl font-headline text-sm transition-all z-10 ${
                type === 'egreso'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-[0_4px_16px_rgba(11,28,48,0.06)]'
                  : 'text-on-surface-variant font-medium hover:text-on-surface'
              }`}
              onClick={() => {
                setType('egreso')
                setCategory(0)
              }}
            >
              Egreso
            </button>
            <button
              className={`flex-1 py-3 text-center rounded-xl font-headline text-sm transition-all z-10 ${
                type === 'ingreso'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-[0_4px_16px_rgba(11,28,48,0.06)]'
                  : 'text-on-surface-variant font-medium hover:text-on-surface'
              }`}
              onClick={() => {
                setType('ingreso')
                setCategory(0)
              }}
            >
              Ingreso
            </button>
          </div>
        </section>

        {/* Category Selection Grid */}
        <section className="w-full space-y-4">
          <h2 className="font-headline font-semibold text-on-surface-variant text-sm px-2">Categoría</h2>
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map((cat, i) => {
              const active = category === i
              return (
                <button
                  key={cat.name}
                  className={`flex flex-col items-start p-4 rounded-[1.25rem] transition-all active:scale-95 group text-left ${
                    active
                      ? 'bg-surface-container-highest shadow-[0_2px_12px_rgba(0,109,50,0.04)]'
                      : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                  onClick={() => setCategory(i)}
                >
                  <div
                    className={`p-2.5 rounded-xl mb-3 transition-colors ${
                      active
                        ? 'bg-primary-container text-on-primary-container shadow-[0_4px_12px_rgba(0,209,102,0.2)]'
                        : 'bg-surface text-on-surface-variant group-hover:text-primary'
                    }`}
                  >
                    <Icon name={cat.icon} fill={active} />
                  </div>
                  <span
                    className={`font-headline text-sm transition-colors ${
                      active ? 'font-semibold text-on-surface' : 'font-medium text-on-surface-variant group-hover:text-on-surface'
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Details Section (Date & Notes) */}
        <section className="w-full space-y-4">
          <h2 className="font-headline font-semibold text-on-surface-variant text-sm px-2">Detalles</h2>
          <div className="flex flex-col space-y-4">
            {/* Date/Time Auto-filled */}
            <button className="flex items-center justify-between p-4 rounded-[1.25rem] bg-surface-container-low hover:bg-surface-container transition-colors text-left w-full group">
              <div className="flex items-center space-x-3">
                <Icon name="calendar_today" className="text-on-surface-variant group-hover:text-primary transition-colors" />
                <span className="font-body font-medium text-on-surface text-sm">{new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </button>

            {/* Notes Text Field */}
            <div className="relative bg-surface-container-low rounded-[1.25rem] p-1 transition-all focus-within:bg-surface-container-highest">
              <textarea
                className="custom-input w-full bg-transparent border-none text-on-surface text-sm font-body p-3 placeholder:text-on-surface-variant/60 resize-none focus:ring-0"
                placeholder="Añadir descripción o notas..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Security / Immutability Note */}
        <section className="w-full pt-2">
          <div className="flex items-start p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/20">
            <Icon name="lock" fill size={20} className="text-on-surface-variant mr-3 mt-0.5" />
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              Este registro es inmutable por seguridad de auditoría. Una vez registrado, cualquier corrección requerirá
              un movimiento de ajuste manual.
            </p>
          </div>
        </section>
      </main>
      </RouteTransition>

      {/* Floating Action CTA (Sticky Bottom) */}
      <form onSubmit={handleSubmit}>
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-surface via-surface/95 to-transparent pb-6 pt-12 px-6 z-50">
          <div className="max-w-2xl mx-auto w-full">
            <button
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-headline font-bold text-lg py-4 rounded-[1.25rem] shadow-[0_8px_30px_rgba(0,109,50,0.25)] hover:shadow-[0_8px_40px_rgba(0,209,102,0.35)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:pointer-events-none"
              disabled={saving}
              type="submit"
            >
              {saving ? (
                <Icon name="progress_activity" size={20} className="animate-spin" />
              ) : (
                <Icon name="check_circle" fill size={20} />
              )}
              <span>{saving ? 'Registrando...' : 'Registrar Movimiento'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
