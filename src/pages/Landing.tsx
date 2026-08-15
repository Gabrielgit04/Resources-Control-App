import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/Reveal'
import { APP_NAME } from '@/config'

const FEATURES = [
  {
    icon: 'add_circle',
    title: 'Registros rápidos',
    description: 'Captura ingresos y egresos en segundos con categorías y notas. Registros inmutables por seguridad de auditoría.',
    color: 'bg-primary-container/20 text-primary',
  },
  {
    icon: 'bar_chart',
    title: 'Reportes y exportación',
    description: 'Estados de resultado, balances e historial completo. Exporta a PDF y Excel con un clic.',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    icon: 'savings',
    title: 'Presupuestos y proyecciones',
    description: 'Asigna tu capital por categorías y proyecta el flujo de caja mes a mes con alertas de límite.',
    color: 'bg-tertiary-fixed/50 text-on-tertiary-fixed',
  },
  {
    icon: 'auto_mode',
    title: 'Automatizaciones',
    description: 'Reglas que mantienen tus finanzas en piloto automático: recordatorios, categorización y resúmenes.',
    color: 'bg-primary-fixed/20 text-on-primary-fixed',
  },
  {
    icon: 'verified_user',
    title: 'Seguridad de auditoría',
    description: 'Autenticación de dos factores, cifrado de extremo a extremo y movimientos inmutables.',
    color: 'bg-error/10 text-error',
  },
  {
    icon: 'devices',
    title: 'Acceso en cualquier dispositivo',
    description: 'Interfaz responsiva que se adapta a tu escritorio, tablet o celular sin perder contexto.',
    color: 'bg-primary-container/20 text-on-primary-container',
  },
]

const STEPS = [
  {
    icon: 'person_add',
    step: '01',
    title: 'Crea tu cuenta',
    description: 'Regístrate en menos de un minuto con tu correo o con Google y empieza de inmediato.',
  },
  {
    icon: 'edit_note',
    step: '02',
    title: 'Registra tus movimientos',
    description: 'Cada ingreso o egreso queda clasificado y protegido para auditoría futura.',
  },
  {
    icon: 'query_stats',
    step: '03',
    title: 'Analiza y exporta',
    description: 'Visualiza reportes, ajusta presupuestos y exporta la información cuando la necesites.',
  },
]

const STATS = [
  { value: '$24.5k', label: 'Movimientos gestionados' },
  { value: '2', label: 'Formatos de exportación' },
  { value: '0', label: 'Errores de auditoría' },
  { value: '24/7', label: 'Disponibilidad' },
]

const NAV_LINKS = [
  { label: 'Características', href: '#features' },
  { label: 'Cómo funciona', href: '#how-it-works' },
  { label: 'Precios', href: '#pricing' },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-container/20 text-primary">
        <Icon name="account_balance" fill size={22} />
      </span>
      <span className="font-headline font-bold text-xl tracking-tight text-on-surface">{APP_NAME}</span>
    </Link>
  )
}

function FeatureCard({ feature }: { feature: (typeof FEATURES)[number] }) {
  return (
    <div className="group h-full bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/20 shadow-[0_4px_24px_rgba(11,28,48,0.03)] hover:shadow-[0_8px_32px_rgba(11,28,48,0.06)] hover:-translate-y-0.5 transition-all">
      <div
        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 group-hover:scale-105 transition-transform ${feature.color}`}
      >
        <Icon name={feature.icon} size={24} />
      </div>
      <h3 className="font-headline font-semibold text-lg text-on-surface mb-2">{feature.title}</h3>
      <p className="text-sm text-on-surface-variant leading-relaxed">{feature.description}</p>
    </div>
  )
}

function AppPreview() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-[0_24px_64px_rgba(11,28,48,0.1)] overflow-hidden">
      {/* Mock window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-container-low border-b border-outline-variant/20">
        <span className="w-2.5 h-2.5 rounded-full bg-error/40" />
        <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-secondary/40" />
        <div className="ml-4 flex-1 max-w-[220px] bg-surface-container-lowest border border-outline-variant/20 rounded-md px-3 py-1 text-[10px] text-on-surface-variant">
          app.g-amount.com/dashboard
        </div>
      </div>

      {/* Mock sidebar + content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden sm:flex flex-col w-40 p-4 gap-1 bg-surface-container-low border-r border-outline-variant/20">
          {['dashboard', 'bar_chart', 'settings_input_component', 'settings'].map((icon, i) => (
            <div
              key={icon}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                i === 0 ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'
              }`}
            >
              <Icon name={icon} fill={i === 0} size={16} />
              {['Panel', 'Reportes', 'Automatizaciones', 'Ajustes'][i]}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Balance card */}
          <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-5">
            <p className="text-on-primary/80 text-[10px] font-semibold uppercase tracking-wider mb-1">Balance Total</p>
            <p className="font-display font-bold text-3xl text-on-primary tracking-tight">$24,500.00</p>
            <div className="flex gap-6 mt-3">
              <div>
                <p className="text-on-primary/80 text-[10px] uppercase tracking-wider">Ingresos</p>
                <p className="font-display font-semibold text-sm text-on-primary">+$6,300</p>
              </div>
              <div>
                <p className="text-on-primary/80 text-[10px] uppercase tracking-wider">Egresos</p>
                <p className="font-display font-semibold text-sm text-on-primary">-$18,200</p>
              </div>
            </div>
          </div>

          {/* Mini chart */}
          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-headline font-semibold text-on-surface">Flujo de caja</p>
              <span className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-primary-container inline-block" />
                Proyectado
              </span>
            </div>
            <div className="flex items-end gap-2 h-16">
              {[40, 55, 45, 70, 60, 75].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-sm ${i === 3 ? 'bg-primary' : 'bg-surface-container-highest'}`}
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recent movements */}
          <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
            {[
              { desc: 'Factura cliente #402', amount: '+$1,200.00', good: true },
              { desc: 'Servidor hosting - AWS', amount: '-$340.50', good: false },
            ].map((row) => (
              <div key={row.desc} className="flex items-center justify-between bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/20">
                <span className="text-xs font-medium text-on-surface">{row.desc}</span>
                <span className={`font-display text-xs font-semibold ${row.good ? 'text-primary' : 'text-error'}`}>
                  {row.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Landing() {
  return (
    <div className="bg-surface text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-surface border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium shadow-[0_4px_14px_rgba(0,109,50,0.3)] hover:bg-surface-tint transition-all"
              >
                Crear cuenta
                <Icon name="arrow_forward" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-primary-container/15 to-transparent blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-tr from-secondary/10 to-transparent blur-[100px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 text-on-primary-container text-xs font-semibold uppercase tracking-wide">
                <Icon name="bolt" fill size={14} />
                Nueva generación de finanzas
              </span>
            <h1 className="mt-6 font-headline font-bold text-4xl md:text-6xl leading-tight tracking-tight text-on-surface">
              Tus finanzas en
              <br />
              un solo <span className="text-primary">flujo.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed">
              G-amount es el ecosistema inteligente para registrar, analizar y proyectar tus recursos. Reportes,
              presupuestos y automatizaciones en una sola plataforma, con la seguridad de una auditoría impecable.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-on-primary font-medium shadow-[0_8px_24px_rgba(0,109,50,0.3)] hover:bg-surface-tint hover:-translate-y-0.5 transition-all"
              >
                <Icon name="rocket_launch" size={18} />
                Crear cuenta gratis
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium hover:bg-surface-container-high transition-colors"
              >
                Ver la app
                <Icon name="visibility" size={18} />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {['Sin tarjeta de crédito', 'Configuración en 1 minuto', 'Exporta a PDF, CSV y Excel'].map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Icon name="check_circle" fill size={16} className="text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          </Reveal>
          <Reveal delay={120} className="relative">
            <AppPreview />
          </Reveal>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-surface-container-low border-y border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 60} className="text-center">
              <p className="font-display font-bold text-3xl md:text-4xl text-primary">{stat.value}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 scroll-mt-16">
        <div className="max-w-2xl mb-14">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 text-on-primary-container text-xs font-semibold uppercase tracking-wide">
            <Icon name="widgets" fill size={14} />
            Funcionalidades
          </span>
          <h2 className="mt-5 font-headline font-bold text-3xl md:text-4xl tracking-tight text-on-surface">
            Todo lo que necesitas para dominar tus finanzas
          </h2>
          <p className="mt-4 text-on-surface-variant text-base leading-relaxed">
            Cada herramienta fue diseñada para darte claridad total sobre tu dinero, de principio a fin.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 60}>
              <FeatureCard feature={feature} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-surface-container-low border-y border-outline-variant/20 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 text-on-primary-container text-xs font-semibold uppercase tracking-wide">
              <Icon name="route" fill size={14} />
              Cómo funciona
            </span>
            <h2 className="mt-5 font-headline font-bold text-3xl md:text-4xl tracking-tight text-on-surface">
              Empieza en tres pasos
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <Reveal key={step.step} delay={i * 70}>
                <div className="h-full bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/20">
                  <div className="flex items-center justify-between mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container/20 text-primary">
                      <Icon name={step.icon} size={24} />
                    </div>
                    <span className="font-display font-bold text-4xl text-surface-container-highest">{step.step}</span>
                  </div>
                  <h3 className="font-headline font-semibold text-lg text-on-surface mb-2">{step.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      {/* <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 scroll-mt-16">
        <div className="max-w-2xl mb-14 mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 text-on-primary-container text-xs font-semibold uppercase tracking-wide">
            <Icon name="sell" fill size={14} />
            Precios
          </span>
          <h2 className="mt-5 font-headline font-bold text-3xl md:text-4xl tracking-tight text-on-surface">
            Un plan simple, sin sorpresas
          </h2>
          <p className="mt-4 text-on-surface-variant text-base leading-relaxed">
            Comienza gratis y escala cuando lo necesites.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: 'Básico',
              price: '$0',
              period: '/mes',
              description: 'Para empezar a registrar tus finanzas.',
              features: ['Registro ilimitado de movimientos', 'Reportes mensuales', 'Exportación CSV'],
              highlighted: false,
            },
            {
              name: 'Pro',
              price: '$9',
              period: '/mes',
              description: 'Para quienes quieren control total.',
              features: [
                'Todo lo del plan Básico',
                'Presupuestos y proyecciones',
                'Automatizaciones avanzadas',
                'Exportación PDF y Excel',
              ],
              highlighted: true,
            },
            {
              name: 'Business',
              price: '$19',
              period: '/mes',
              description: 'Para equipos y multi-empresa.',
              features: ['Todo lo del plan Pro', 'Hasta 5 usuarios', 'Roles y permisos', 'Soporte prioritario'],
              highlighted: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-6 flex flex-col ${
                plan.highlighted
                  ? 'bg-primary text-on-primary shadow-[0_12px_40px_rgba(0,109,50,0.35)] md:-mt-4 md:mb-4'
                  : 'bg-surface-container-lowest border border-outline-variant/20'
              }`}
            >
              <h3 className={`font-headline font-semibold text-lg ${plan.highlighted ? 'text-on-primary' : 'text-on-surface'}`}>
                {plan.name}
              </h3>
              <p className={`mt-1 text-sm ${plan.highlighted ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                {plan.description}
              </p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display font-bold text-4xl tracking-tight">{plan.price}</span>
                <span className={`text-sm ${plan.highlighted ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                  {plan.period}
                </span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Icon
                      name="check_circle"
                      fill
                      size={16}
                      className={plan.highlighted ? 'text-primary-fixed' : 'text-primary'}
                    />
                    <span className={plan.highlighted ? 'text-on-primary/90' : 'text-on-surface'}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-8 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  plan.highlighted
                    ? 'bg-on-primary text-primary hover:bg-surface-bright'
                    : 'bg-primary text-on-primary hover:bg-surface-tint'
                }`}
              >
                Empezar ahora
                <Icon name="arrow_forward" size={16} />
              </Link>
            </div>
          ))}
        </div>
      </section> */}

      {/* Final CTA */}
      <section className="bg-primary">
        <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="font-headline font-bold text-3xl md:text-5xl tracking-tight text-on-primary">
            Toma el control de tu dinero hoy
          </h2>
          <p className="mt-4 text-on-primary/80 text-base md:text-lg max-w-xl mx-auto">
            Únete a miles de personas que ya gestionan sus finanzas con inteligencia.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-on-primary text-primary font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all"
          >
            Crear cuenta gratis
            <Icon name="rocket_launch" size={18} />
          </Link>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Logo />
              <p className="mt-4 text-sm text-on-surface-variant max-w-sm leading-relaxed">
                El ecosistema inteligente para registrar, analizar y proyectar tus finanzas personales y de negocio.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-on-surface mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>
                  <a href="#features" className="hover:text-primary transition-colors">
                    Características
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-primary transition-colors">
                    Precios
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-primary transition-colors">
                    Cómo funciona
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-on-surface mb-4">Cuenta</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>
                  <Link to="/login" className="hover:text-primary transition-colors">
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-primary transition-colors">
                    Crear cuenta
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-primary transition-colors">
                    Ver la app
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-on-surface-variant">
              © {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 text-on-surface-variant">
              <Icon name="verified_user" size={16} />
              <span className="text-xs">Auditoría y cifrado garantizados</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
