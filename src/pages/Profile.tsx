import { useRef, useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Icon } from '@/components/Icon'
import { BottomNav } from '@/components/layout/BottomNav'
import { Switch } from '@/components/ui/switch'
import { SelectRow } from '@/components/ui/select'
import { useAuth } from '@/components/auth/auth-context'
import { useProfile } from '@/hooks/use-profile'
import { isEmail, isPhone, isPositiveNumber, isTextOnly } from '@/lib/validation'
import { CURRENCIES, type CurrencyCode } from '@/lib/currency'
import { GetCurrencySettings } from '@/backend/services/Currency-Services/Get.CurrencySettings'
import { UpsertCurrencySettings } from '@/backend/services/Currency-Services/Upsert.CurrencySettings'

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'VES', label: 'VES (Bs)' },
] as const

const NOTIFICATION_OPTIONS = [
  { value: 'all', label: 'Push, Email' },
  { value: 'push', label: 'Solo Push' },
  { value: 'email', label: 'Solo Email' },
] as const

const CURRENCY_STORAGE_KEY = 'g-finances:currency'
const NOTIFICATIONS_STORAGE_KEY = 'g-finances:notifications'

interface RowProps {
  icon: string
  title: string
  subtitle: string
  trailing?: 'chevron' | 'expand'
  onClick?: () => void
}

function Row({ icon, title, subtitle, trailing, onClick }: RowProps) {
  return (
    <div
      className="group flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors cursor-pointer border-b border-outline-variant/10"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary">
          <Icon name={icon} />
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface">{title}</p>
          <p className="text-sm text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      {trailing === 'expand' ? (
        <Icon name="expand_more" className="text-on-surface-variant group-hover:text-primary transition-colors" />
      ) : (
        <Icon name="chevron_right" className="text-on-surface-variant group-hover:text-primary transition-colors" />
      )}
    </div>
  )
}

export function Profile() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { profile, updatePhone, updateName, updateEmail, uploadAvatar } = useProfile(user?.id)

  const nombre = profile?.name ?? (user?.user_metadata?.full_name as string | undefined) ?? 'Usuario'
  const email = user?.email ?? '—'
  const telefono = profile?.phone ?? (user?.user_metadata?.phone as string | undefined) ?? '—'
  const avatar = profile?.avatar ?? (user?.user_metadata?.avatar_url as string | undefined) ?? ''
  const tier = ''
  const idUsuario = user?.id ?? ''
  const inicial = nombre.charAt(0).toUpperCase()
  const miembroDesde = user?.created_at
    ? new Intl.DateTimeFormat('es', { month: 'short', year: 'numeric' }).format(new Date(user.created_at))
    : '—'
  const ultimoAcceso = user?.last_sign_in_at
    ? new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(user.last_sign_in_at))
    : '—'

  const [tfa, setTfa] = useState(true)
  const [phoneDialog, setPhoneDialog] = useState(false)
  const [nameDialog, setNameDialog] = useState(false)
  const [emailDialog, setEmailDialog] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPhone, setSavingPhone] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [conversionBase, setConversionBase] = useState<CurrencyCode>('USD')
  const [ratesInput, setRatesInput] = useState<Record<string, string>>({})
  const [savingCurrency, setSavingCurrency] = useState(false)
  const [currency, setCurrency] = useState(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY)
    return stored !== null && CURRENCY_OPTIONS.some((c) => c.value === stored) ? stored : 'USD'
  })
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    return stored !== null && NOTIFICATION_OPTIONS.some((n) => n.value === stored) ? stored : 'all'
  })

  const handleCurrencyChange = (value: string) => {
    setCurrency(value)
    localStorage.setItem(CURRENCY_STORAGE_KEY, value)
  }

  const handleNotificationsChange = (value: string) => {
    setNotifications(value)
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, value)
  }

  useEffect(() => {
    if (!user) return
    GetCurrencySettings(user.id).then((res) => {
      if (!res.ok) return
      const d = res.data
      setConversionBase(d.base_currency ?? 'USD')
      const rates: Record<string, string> = {}
      for (const key of Object.keys(d.rates ?? {})) {
        rates[key] = String(d.rates[key])
      }
      setRatesInput(rates)
    })
  }, [user])

  const handleConversionBaseChange = (value: string) => {
    setConversionBase(value as CurrencyCode)
    setRatesInput({})
  }

  const guardarConversion = async () => {
    if (!user) return
    const rates: Record<string, number> = {}
    for (const c of CURRENCIES) {
      if (c.value === conversionBase) continue
      const raw = ratesInput[c.value]?.trim()
      if (raw === undefined || raw === '') continue
      if (!isPositiveNumber(raw)) {
        toast.error(`Ingresa una tasa válida para ${c.value} (mayor a cero).`)
        return
      }
      rates[c.value] = Number(raw)
    }
    setSavingCurrency(true)
    const result = await UpsertCurrencySettings({
      userId: user.id,
      baseCurrency: conversionBase,
      rates,
    })
    setSavingCurrency(false)
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo guardar la conversión.')
      return
    }
    toast.success('Conversión de moneda guardada.')
  }

  const abrirDialogTelefono = () => {
    setPhoneInput(telefono === '—' ? '' : telefono)
    setPhoneDialog(true)
  }

  const abrirDialogName = () => {
    setNameInput(nombre)
    setNameDialog(true)
  }

  const abrirDialogEmail = () => {
    setEmailInput(email === '—' ? '' : email)
    setEmailDialog(true)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido.')
      return
    }

    setUploadingAvatar(true)
    const result = await uploadAvatar(file)
    setUploadingAvatar(false)

    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo subir la imagen.')
      return
    }

    toast.success('Foto de perfil actualizada.')
  }

  const guardarTelefono = async () => {
    const valor = phoneInput.trim()
    if (!valor) {
      toast.error('Ingresa un número de teléfono.')
      return
    }
    if (!isPhone(valor)) {
      toast.error('Ingresa un número de teléfono válido (solo números, + y espacios).')
      return
    }

    setSavingPhone(true)
    const result = await updatePhone(valor)
    setSavingPhone(false)

    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo guardar el teléfono.')
      return
    }

    toast.success(telefono === '—' ? 'Teléfono agregado.' : 'Teléfono actualizado.')
    setPhoneDialog(false)
  }

  const guardarNombre = async () => {
    const valor = nameInput.trim()
    if (!valor) {
      toast.error('Ingresa un nombre.')
      return
    }
    if (!isTextOnly(valor)) {
      toast.error('El nombre solo puede contener letras y espacios.')
      return
    }

    setSavingName(true)
    const result = await updateName(valor)
    setSavingName(false)

    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo guardar el nombre.')
      return
    }

    toast.success('Nombre actualizado.')
    setNameDialog(false)
  }

  const guardarEmail = async () => {
    const valor = emailInput.trim()
    if (!valor) {
      toast.error('Ingresa un correo electrónico.')
      return
    }
    if (!isEmail(valor)) {
      toast.error('Ingresa un correo electrónico válido.')
      return
    }

    setSavingEmail(true)
    const result = await updateEmail(valor)
    setSavingEmail(false)

    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo guardar el correo.')
      return
    }

    toast.success(`Se envió un correo de confirmación a ${valor}.`)
    setEmailDialog(false)
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24 md:pb-8 flex flex-col items-center selection:bg-primary-container selection:text-on-primary-container">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(11,28,48,0.04)] bg-surface-container-low">
        <div className="flex justify-between items-center px-6 h-16 w-full max-w-none">
          <button
            aria-label="Volver"
            className="text-on-surface-variant hover:bg-primary-container/10 p-2 rounded-full transition-colors duration-300 active:scale-95"
            onClick={() => navigate(-1)}
          >
            <Icon name="arrow_back" />
          </button>
          <h1 className="font-headline font-bold tracking-tight text-primary">Perfil</h1>
          <div className="w-10 h-10" />
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="w-full max-w-3xl px-6 pt-24 space-y-8 flex-grow">
        {/* User Info Header (Bento Style) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Profile Card */}
          <div className="md:col-span-2 bg-surface-container-low rounded-xl p-6 flex items-center space-x-6 relative overflow-hidden group hover:bg-surface-container transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 w-24 h-24 rounded-full overflow-visible border-2 border-surface-container-highest shadow-sm bg-primary-container/20 text-primary font-headline font-bold text-4xl flex items-center justify-center">
              {avatar ? (
                <img alt={nombre} className="w-full h-full rounded-full object-cover" src={avatar} />
              ) : (
                inicial
              )}
              <button
                aria-label="Cambiar foto de perfil"
                className="absolute bottom-0 right-0 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-on-primary ring-4 ring-surface-container-low shadow-[0_4px_12px_rgba(0,109,50,0.4)] hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingAvatar ? (
                  <Icon name="progress_activity" size={16} className="animate-spin" />
                ) : (
                  <Icon name="photo_camera" size={16} />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              type="file"
              onChange={handleAvatarChange}
            />
            <div className="relative z-10 flex-grow">
              <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">{nombre}</h2>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-primary-container/20 text-primary rounded-full text-xs font-semibold tracking-wide uppercase border border-primary-container/30">
                  {tier || 'Nivel'}
                </span>
                <span className="text-sm text-on-surface-variant">ID: {idUsuario.slice(0, 8)}</span>
              </div>
            </div>
          </div>

          {/* Stats Column */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-center items-center md:items-start text-center md:text-left">
              <Icon name="calendar_month" className="text-tertiary mb-2" />
              <p className="text-xs text-on-surface-variant font-medium">Miembro desde</p>
              <p className="font-headline font-semibold text-on-surface">{miembroDesde}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-center items-center md:items-start text-center md:text-left">
              <Icon name="history" className="text-tertiary mb-2" />
              <p className="text-xs text-on-surface-variant font-medium">Último acceso</p>
              <p className="font-headline font-semibold text-on-surface text-sm">{ultimoAcceso}</p>
            </div>
          </div>
        </section>

        {/* Settings Modules */}
        <div className="space-y-8">
          {/* Personal Information */}
          <section>
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4 pl-2 border-l-4 border-primary">
              Información personal
            </h3>
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgb(11,28,48,0.02)] border border-outline-variant/20 overflow-hidden">
              <Row icon="person" title="Nombre completo" subtitle={nombre} trailing="chevron" onClick={abrirDialogName} />
              <Row icon="mail" title="Correo electrónico" subtitle={email} trailing="chevron" onClick={abrirDialogEmail} />
              <Row icon="call" title="Teléfono" subtitle={telefono} trailing="chevron" onClick={abrirDialogTelefono} />
            </div>
          </section>

          {/* Security */}
          <section>
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4 pl-2 border-l-4 border-primary">
              Seguridad
            </h3>
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgb(11,28,48,0.02)] border border-outline-variant/20 overflow-hidden">
              <Row icon="lock" title="Cambiar contraseña" subtitle="Actualizada hace 3 meses" trailing="chevron" />
              <div className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors border-b border-outline-variant/10">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary">
                    <Icon name="verified_user" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-surface">Autenticación de dos factores</p>
                    <p className="text-sm text-on-surface-variant">Seguridad reforzada de la cuenta</p>
                  </div>
                </div>
                <Switch checked={tfa} onCheckedChange={setTfa} />
              </div>            </div>
          </section>

          {/* Preferences */}
          <section>
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4 pl-2 border-l-4 border-primary">
              Preferencias
            </h3>
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgb(11,28,48,0.02)] border border-outline-variant/20 overflow-hidden">
              <SelectRow
                icon="payments"
                title="Moneda por defecto"
                subtitle="Moneda para nuevos movimientos"
                value={currency}
                options={CURRENCY_OPTIONS}
                onValueChange={handleCurrencyChange}
              />
              <SelectRow
                icon="notifications"
                title="Configuración de notificaciones"
                subtitle="Cómo te contactamos"
                value={notifications}
                options={NOTIFICATION_OPTIONS}
                onValueChange={handleNotificationsChange}
                borderless
              />
            </div>
          </section>

          {/* Currency Conversion */}
          <section>
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4 pl-2 border-l-4 border-primary">
              Conversión de moneda
            </h3>
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgb(11,28,48,0.02)] border border-outline-variant/20 overflow-hidden">
              <SelectRow
                icon="payments"
                title="Moneda base"
                subtitle="El balance y las proyecciones se muestran en esta moneda"
                value={conversionBase}
                options={CURRENCY_OPTIONS}
                onValueChange={handleConversionBaseChange}
              />
              {CURRENCIES.filter((c) => c.value !== conversionBase).map((c) => (
                <div
                  key={c.value}
                  className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors border-b border-outline-variant/10"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary">
                      <Icon name="currency_exchange" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{c.label}</p>
                      <p className="text-sm text-on-surface-variant">
                        {c.value === 'VES'
                          ? `${c.value} por 1 ${conversionBase}`
                          : `1 ${c.value} en ${conversionBase}`}
                      </p>
                    </div>
                  </div>
                  <input
                    aria-label={`Tasa ${c.value}`}
                    className="w-24 px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm text-on-surface text-right focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    min="0"
                    placeholder="0.00"
                    step="any"
                    type="number"
                    value={ratesInput[c.value] ?? ''}
                    onChange={(e) => setRatesInput((prev) => ({ ...prev, [c.value]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-on-surface-variant max-w-sm">
                  Sin tasa definida, los montos en esa moneda no se contabilizan en el balance ni en las
                  proyecciones.
                </p>
                <button
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
                  disabled={savingCurrency}
                  onClick={guardarConversion}
                >
                  {savingCurrency && <Icon name="progress_activity" size={16} className="animate-spin" />}
                  Guardar tasas
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Logout Action */}
        <div className="pt-8 pb-12 flex justify-center">
          <button
            className="flex items-center justify-center space-x-2 px-8 py-3 bg-surface-container-highest text-error font-headline font-semibold rounded-lg hover:bg-error-container/50 transition-colors duration-300 w-full md:w-auto min-w-[200px]"
            onClick={async () => {
              await signOut()
              navigate('/login', { replace: true })
            }}
          >
            <Icon name="logout" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </main>

      <BottomNav />

      {/* Teléfono Dialog */}
      {phoneDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPhoneDialog(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_24px_60px_rgba(11,28,48,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-semibold text-xl text-on-surface mb-1">
              {telefono === '—' ? 'Agregar teléfono' : 'Editar teléfono'}
            </h3>
            <p className="text-sm text-on-surface-variant mb-5">
              El número se usará para contactarte y como respaldo de tu cuenta.
            </p>

            <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="telefono">
              Número de teléfono
            </label>
            <input
              autoFocus
              className="block w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              id="telefono"
              placeholder="+58 412 123 4567"
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  guardarTelefono()
                }
              }}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                onClick={() => setPhoneDialog(false)}
              >
                Cancelar
              </button>
              <button
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
                disabled={savingPhone}
                onClick={guardarTelefono}
              >
                {savingPhone && <Icon name="progress_activity" size={16} className="animate-spin" />}
                {telefono === '—' ? 'Agregar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Name Dialog */}
      {nameDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setNameDialog(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_24px_60px_rgba(11,28,48,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-semibold text-xl text-on-surface mb-1">Editar nombre</h3>
            <p className="text-sm text-on-surface-variant mb-5">
              Cambia tu nombre completo. Este se mostrará en tu perfil y en los movimientos que crees.
            </p>

            <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="nombre">
              Nombre completo
            </label>
            <input
              autoFocus
              className="block w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              id="nombre"
              placeholder="Tu nombre completo"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  guardarNombre()
                }
              }}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                onClick={() => setNameDialog(false)}
              >
                Cancelar
              </button>
              <button
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
                disabled={savingName}
                onClick={guardarNombre}
              >
                {savingName && <Icon name="progress_activity" size={16} className="animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Dialog */}
      {emailDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEmailDialog(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_24px_60px_rgba(11,28,48,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-semibold text-xl text-on-surface mb-1">Editar correo electrónico</h3>
            <p className="text-sm text-on-surface-variant mb-5">
              Modifica tu dirección de correo electrónico.
            </p>

            <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="email">
              Correo electrónico
            </label>
            <input
              autoFocus
              className="block w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              id="email"
              placeholder="tu.email@ejemplo.com"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  guardarEmail()
                }
              }}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                onClick={() => setEmailDialog(false)}
              >
                Cancelar
              </button>
              <button
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
                disabled={savingEmail}
                onClick={guardarEmail}
              >
                {savingEmail && <Icon name="progress_activity" size={16} className="animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
