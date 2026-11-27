import { Link } from 'react-router-dom'
import { LegalPage, type LegalSection } from '@/components/legal/LegalPage'
import { APP_NAME, PRIVACY_CONTACT_EMAIL, TERMS_EFFECTIVE_DATE } from '@/config'

const SECTIONS: LegalSection[] = [
  {
    id: 'aceptacion',
    icon: 'fact_check',
    title: 'Aceptación de los términos',
    paragraphs: [
      `Al acceder a ${APP_NAME}, crear una cuenta o utilizar cualquiera de sus funciones, aceptas estos Términos y Condiciones de Uso. Si no estás de acuerdo con ellos, no utilices el servicio.`,
      'Estos términos se complementan con la Política de privacidad, que describe cómo tratamos tus datos personales y forma parte de este acuerdo.',
    ],
  },
  {
    id: 'cuenta',
    icon: 'account_circle',
    title: 'Tu cuenta',
    paragraphs: [
      'Debes proporcionar información veraz y mantenerla actualizada. Eres responsable de la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.',
      'La opción «Recuérdame» determina si tu sesión se conserva en el navegador de forma persistente o solo mientras la ventana permanezca abierta. Cierra sesión al terminar cuando uses un dispositivo compartido.',
      `Si sospechas un acceso no autorizado o un uso indebido de tu cuenta, avísanos de inmediato a ${PRIVACY_CONTACT_EMAIL}.`,
    ],
  },
  {
    id: 'uso-permitido',
    icon: 'checklist',
    title: 'Uso permitido',
    paragraphs: ['Puedes usar la app para gestionar tu información financiera, siempre que respetes las siguientes reglas:'],
    items: [
      'Utilizar el servicio únicamente para tus propias finanzas o las que tengas autorización legítima para administrar.',
      'No intentar acceder a cuentas, datos o funciones administrativas de otros usuarios.',
      'No eludir los límites de peticiones ni los controles de seguridad, ni manipular el servicio para obtener acceso indebido.',
      'No introducir código malicioso ni automatizar la app de una forma que degrade su funcionamiento.',
      'No emplear el servicio para actividades ilícitas o que vulneren derechos de terceros.',
    ],
  },
  {
    id: 'naturaleza',
    icon: 'info',
    title: 'Naturaleza del servicio',
    paragraphs: [
      `${APP_NAME} es una herramienta de organización, registro y seguimiento financiero. No es una entidad financiera y no ejecuta pagos, transferencias ni operaciones bancarias reales.`,
      'Los balances, reportes, presupuestos y proyecciones se calculan con la información que tú registras y tienen carácter informativo. No constituyen asesoramiento financiero, contable, fiscal ni legal, y las decisiones que tomes a partir de ellos son de tu exclusiva responsabilidad.',
      'Verifica la exactitud de los datos que ingresas, en especial los intereses de las cuentas por cobrar o pagar y las tasas de conversión entre monedas.',
    ],
  },
  {
    id: 'registros',
    icon: 'receipt_long',
    title: 'Registros e integridad',
    paragraphs: [
      'Los movimientos, cuentas y abonos que registres quedan asociados a tu usuario. Puedes consultarlos, exportarlos y, según la función de que se trate, editarlos o eliminarlos desde la propia aplicación.',
      'Los registros de seguridad y auditoría se conservan para proteger la integridad del servicio y no pueden modificarse desde la interfaz de usuario.',
    ],
  },
  {
    id: 'propiedad',
    icon: 'copyright',
    title: 'Propiedad intelectual',
    paragraphs: [
      `El código, el diseño, el logotipo, los textos y los demás elementos de ${APP_NAME} pertenecen a sus titulares y están protegidos por la normativa aplicable.`,
      'Se te concede una licencia limitada, personal y no exclusiva para usar la aplicación mientras tengas una cuenta activa. No puedes copiar, modificar, distribuir, vender ni crear productos derivados sin autorización previa.',
    ],
  },
  {
    id: 'disponibilidad',
    icon: 'cloud_off',
    title: 'Disponibilidad y cambios',
    paragraphs: [
      'El servicio se ofrece «tal cual». Podemos añadir, modificar o retirar funciones, así como suspender el acceso por mantenimiento, seguridad o causas fuera de nuestro control; cuando sea urgente, haremos lo posible por avisarte.',
      'No garantizamos una disponibilidad ininterrumpida ni que los archivos exportados sean compatibles con todas las versiones de programas de terceros.',
    ],
  },
  {
    id: 'terceros',
    icon: 'hub',
    title: 'Servicios de terceros',
    paragraphs: [
      'La app depende de proveedores externos para la autenticación y la base de datos (Supabase), el alojamiento (Cloudflare Workers), el envío de correos (Resend) y la carga de tipografías (Google Fonts). Su funcionamiento está sujeto a las condiciones de dichos proveedores.',
    ],
  },
  {
    id: 'responsabilidad',
    icon: 'balance',
    title: 'Limitación de responsabilidad',
    paragraphs: [
      'En la medida en que lo permita la ley, no respondemos por daños derivados del uso del servicio, de decisiones financieras tomadas a partir de la información mostrada, de pérdidas de datos causadas por fallos de terceros o de interrupciones del acceso.',
      'Nada de lo dispuesto en estos términos limita tus derechos irrenunciables ni nuestra responsabilidad en los casos en que la ley no permita limitarla.',
    ],
  },
  {
    id: 'terminacion',
    icon: 'logout',
    title: 'Suspensión y terminación',
    paragraphs: [
      'Podemos suspender o cerrar una cuenta cuando detectemos un incumplimiento de estos términos, un riesgo para la seguridad o cuando la ley lo requiera. Estas acciones quedan registradas en la bitácora de auditoría.',
      `Puedes dejar de usar el servicio en cualquier momento y solicitar la eliminación de tu cuenta escribiendo a ${PRIVACY_CONTACT_EMAIL}. Tras la terminación, permanecen vigentes las cláusulas que por su naturaleza deban sobrevivir, como la propiedad intelectual y la limitación de responsabilidad.`,
    ],
  },
  {
    id: 'privacidad',
    icon: 'privacy_tip',
    title: 'Privacidad y protección de datos',
    paragraphs: [
      'El tratamiento de tus datos personales se rige por la Política de privacidad, que forma parte de estos términos. Al usar la aplicación aceptas también esa política y puedes ejercer allí los derechos que la ley te reconoce.',
    ],
  },
  {
    id: 'ley',
    icon: 'gavel',
    title: 'Ley aplicable',
    paragraphs: [
      'Estos términos se rigen por la legislación aplicable según tu lugar de residencia, sin perjuicio de las normas de protección a los consumidores y de los derechos irrenunciables que la ley te otorgue.',
    ],
  },
  {
    id: 'cambios',
    icon: 'history',
    title: 'Cambios en estos términos',
    paragraphs: [
      'Podemos actualizar estos términos para reflejar cambios legales o del servicio. Publicaremos la versión vigente en esta página y actualizaremos la fecha de vigencia. Si el cambio es relevante, intentaremos comunicarlo a los usuarios registrados por correo electrónico.',
    ],
  },
]

export function Terms() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Términos y Condiciones de Uso"
      description="Define las reglas para usar la aplicación, tus responsabilidades y el alcance del servicio que ofrecemos."
      effectiveDate={TERMS_EFFECTIVE_DATE}
      summary={
        <>
          La app es una herramienta de gestión financiera, no un asesor ni una entidad bancaria. Eres responsable de tu
          cuenta y de la información que registras, y debes usar el servicio de forma lícita. Consulta también la{' '}
          <Link className="font-medium text-primary hover:underline" to="/privacidad">
            Política de privacidad
          </Link>
          .
        </>
      }
      sections={SECTIONS}
      contactEmail={PRIVACY_CONTACT_EMAIL}
      related={{ label: 'Política de privacidad', to: '/privacidad' }}
    />
  )
}
