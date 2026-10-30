import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import { APP_NAME } from '@/config'
import { AppTourContext } from '@/components/tour/tour-context'

const TOUR_SEEN_KEY = 'g-amount:tour:seen:v1'

function marcarTourVisto() {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, '1')
  } catch {
    // El almacenamiento puede no estar disponible; el tour se puede abrir manualmente.
  }
}

function tourYaVisto() {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function construirPasos(): DriveStep[] {
  const esEscritorio = window.matchMedia('(min-width: 768px)').matches
  const selector = (escritorio: string, movil: string) => (esEscritorio ? escritorio : movil)

  const pasos: DriveStep[] = [
    {
      popover: {
        title: `Bienvenido a ${APP_NAME}`,
        description:
          'Este recorrido te explica para qué sirve cada módulo y qué hacer primero. Puedes cerrarlo cuando quieras y volver a abrirlo con el botón Guía de la app.',
      },
    },
    {
      element: selector('[data-tour="sidebar-profile"]', '[data-tour="mobile-profile"]'),
      popover: {
        title: 'Tu perfil y configuración',
        side: esEscritorio ? 'right' : 'bottom',
        align: 'start',
        description:
          'Aquí están tu nombre, foto, contraseña y la conversión de moneda. Antes de registrar movimientos, configura tu moneda base y las tasas de cambio para que los totales sean correctos.',
      },
    },
    {
      element: selector('[data-tour="nav-dashboard"]', '[data-tour="bottom-dashboard"]'),
      popover: {
        title: 'Panel',
        side: esEscritorio ? 'right' : 'top',
        align: 'start',
        description:
          'Es tu resumen general: balance, ingresos, egresos, próximos vencimientos y movimientos recientes. Revísalo al entrar para saber cómo están tus finanzas.',
      },
    },
    {
      element: selector('[data-tour="nuevo-movimiento-desktop"]', '[data-tour="nuevo-movimiento-mobile"]'),
      popover: {
        title: 'Registra movimientos',
        side: esEscritorio ? 'bottom' : 'top',
        align: 'end',
        description:
          'Usa Nuevo Movimiento para anotar cada ingreso o egreso con monto, categoría, moneda y descripción. Estos datos alimentan el balance, los reportes y las proyecciones.',
      },
    },
    {
      element: '[data-tour="balance"]',
      popover: {
        title: 'Balance total',
        description:
          'Muestra la diferencia entre ingresos y egresos en tu moneda base. Si aparece una alerta de moneda sin tasa, configúrala en Ajustes para que los montos se incluyan.',
      },
    },
    {
      element: '[data-tour="presupuesto"]',
      popover: {
        title: 'Presupuesto y proyecciones',
        description:
          'Entra aquí para planificar cuánto puedes gastar por categoría y ver la proyección mensual con base en tus movimientos.',
      },
    },
    {
      element: selector('[data-tour="nav-accounts"]', '[data-tour="bottom-accounts"]'),
      popover: {
        title: 'Cuentas por pagar y por cobrar',
        side: esEscritorio ? 'right' : 'top',
        align: 'start',
        description:
          'Registra proveedores y clientes, montos, vencimientos e intereses. Dentro de cada cuenta puedes abonar y consultar el historial. Usa Agrupar por concepto para ver cuántas personas comparten un mismo concepto.',
      },
    },
    {
      element: selector('[data-tour="nav-reports"]', '[data-tour="bottom-reports"]'),
      popover: {
        title: 'Reportes',
        side: esEscritorio ? 'right' : 'top',
        align: 'start',
        description:
          'Filtra y analiza tus movimientos por fecha, categoría y tipo. Desde aquí también puedes exportar la información para revisarla o compartirla.',
      },
    },
    {
      element: selector('[data-tour="nav-profile"]', '[data-tour="bottom-profile"]'),
      popover: {
        title: 'Ajustes',
        side: esEscritorio ? 'right' : 'top',
        align: 'start',
        description:
          'Configura moneda base, tasas de cambio, foto de perfil y contraseña. Revisa esta sección si algún monto no aparece o si cambias de moneda.',
      },
    },
  ]

  const selectorAdmin = selector('[data-tour="nav-admin"]', '[data-tour="bottom-admin"]')
  if (document.querySelector(selectorAdmin)) {
    pasos.push({
      element: selectorAdmin,
      popover: {
        title: 'Usuarios',
        side: esEscritorio ? 'right' : 'top',
        align: 'start',
        description:
          'Solo para administradores: consulta usuarios, actividad y aplica suspensiones cuando sea necesario.',
      },
    })
  }

  pasos.push({
    popover: {
      title: 'Orden recomendado',
      description:
        '1. Configura tu moneda en Ajustes. 2. Registra tus movimientos. 3. Crea tus cuentas por pagar y cobrar. 4. Revisa el Panel y los Reportes para tomar decisiones.',
    },
  })

  return pasos
}

export function AppTourProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const rutaActual = useRef(location.pathname)

  useEffect(() => {
    rutaActual.current = location.pathname
  }, [location.pathname])

  const startTour = useCallback(() => {
    marcarTourVisto()

    const iniciar = () => {
      if (rutaActual.current !== '/dashboard') {
        navigate('/dashboard')
      }

      window.setTimeout(() => {
        const tour = driver({
          animate: true,
          smoothScroll: true,
          allowClose: true,
          allowKeyboardControl: true,
          overlayClickBehavior: 'none',
          overlayColor: 'rgba(11, 28, 48, 0.68)',
          stagePadding: 8,
          stageRadius: 12,
          waitForElement: 2500,
          skipMissingElement: true,
          popoverClass: 'app-tour-popover',
          showProgress: true,
          progressText: 'Paso {{current}} de {{total}}',
          nextBtnText: 'Siguiente',
          prevBtnText: 'Anterior',
          doneBtnText: 'Entendido',
          showButtons: ['next', 'previous', 'close'],
          onPopoverRender: (popover) => {
            popover.nextButton.classList.add('app-tour-next')
            popover.previousButton.classList.add('app-tour-prev')
            popover.closeButton.classList.add('app-tour-close')
          },
          onDestroyed: () => {
            marcarTourVisto()
          },
          steps: construirPasos(),
        })
        tour.drive()
      }, rutaActual.current === '/dashboard' ? 250 : 700)
    }

    iniciar()
  }, [navigate])

  useEffect(() => {
    if (location.pathname !== '/dashboard' || tourYaVisto()) return

    const timer = window.setTimeout(() => {
      startTour()
    }, 900)

    return () => window.clearTimeout(timer)
  }, [location.pathname, startTour])

  return <AppTourContext.Provider value={{ startTour }}>{children}</AppTourContext.Provider>
}
