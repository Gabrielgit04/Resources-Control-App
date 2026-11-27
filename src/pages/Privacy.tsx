import { Link } from 'react-router-dom'
import { LegalPage, type LegalSection } from '@/components/legal/LegalPage'
import { APP_NAME, PRIVACY_CONTACT_EMAIL, PRIVACY_EFFECTIVE_DATE } from '@/config'

const SECTIONS: LegalSection[] = [
  {
    id: 'responsable',
    icon: 'badge',
    title: 'Responsable del tratamiento',
    paragraphs: [
      `El responsable del tratamiento de tus datos personales es ${APP_NAME}. Para cualquier consulta o solicitud relacionada con tus datos, puedes escribir a ${PRIVACY_CONTACT_EMAIL}.`,
      'Esta política se aplica a la aplicación web, a sus versiones para escritorio y móvil, y a los correos automáticos que enviamos. Al crear una cuenta aceptas las prácticas descritas aquí.',
    ],
  },
  {
    id: 'datos',
    icon: 'database',
    title: 'Datos que recopilamos',
    paragraphs: ['Solo tratamos la información necesaria para prestar el servicio y mantenerlo seguro:'],
    items: [
      'Datos de cuenta y perfil: nombre, correo electrónico, teléfono y foto de perfil (opcionales), rol, fecha de creación y último acceso. La contraseña se guarda como hash en Supabase Auth; nunca se almacena en texto plano.',
      'Datos financieros: movimientos de ingresos y egresos (monto, moneda, categoría, fecha y notas), cuentas por cobrar y pagar (contraparte, concepto, monto, abonos, vencimiento e intereses), presupuestos, proyecciones y tasas de conversión.',
      'Datos técnicos y de seguridad: dirección IP, marcas de tiempo, intentos de acceso, límites de peticiones, registros de auditoría administrativa y estado de conexión.',
      'Datos en tu dispositivo: token de sesión en localStorage o sessionStorage según la opción «Recuérdame», preferencias de moneda y notificaciones, y el estado de la visita guiada.',
    ],
  },
  {
    id: 'finalidad',
    icon: 'tune',
    title: 'Para qué usamos tus datos',
    paragraphs: ['Utilizamos la información exclusivamente para:'],
    items: [
      'Crear y mantener tu cuenta, autentificarte y permitirte recuperar el acceso.',
      'Registrar, organizar y mostrar tus finanzas, y generar reportes y exportaciones en PDF, CSV y Excel.',
      'Enviar recordatorios de cuentas próximas a vencer y correos de servicio, como la confirmación de la cuenta, el cambio de correo y la recuperación de contraseña.',
      'Proteger la plataforma: evitar abusos, limitar intentos de acceso, auditar las acciones de administración y preservar la integridad de los movimientos.',
    ],
  },
  {
    id: 'base-legal',
    icon: 'gavel',
    title: 'Base legal',
    paragraphs: [
      'Tratamos tus datos para ejecutar el servicio que solicitaste al registrarte, con tu consentimiento cuando usas funciones opcionales como los recordatorios por correo, y por interés legítimo en seguridad y prevención de fraude. Cuando la ley lo exige, conservamos determinados registros para cumplir obligaciones legales.',
      'No vendemos tus datos ni los utilizamos para publicidad o elaboración de perfiles comerciales.',
    ],
  },
  {
    id: 'destinatarios',
    icon: 'cloud',
    title: 'Con quién compartimos tus datos',
    paragraphs: [
      'Trabajamos con proveedores que actúan como encargados del tratamiento y solo procesan la información para las finalidades indicadas:',
    ],
    items: [
      'Supabase: autenticación, base de datos y almacenamiento de la foto de perfil.',
      'Cloudflare Workers: alojamiento de la aplicación y procesamiento de las solicitudes.',
      'Resend: envío de correos transaccionales; recibe tu dirección de correo y el contenido del recordatorio.',
      'Google Fonts: carga de tipografías; puede recibir la dirección IP al cargar la página.',
    ],
    paragraphsAfter: [
      'También podemos revelar información si una autoridad competente la solicita conforme a la ley. No cedemos tus datos a terceros con fines publicitarios.',
    ],
  },
  {
    id: 'conservacion',
    icon: 'schedule',
    title: 'Conservación de los datos',
    paragraphs: [
      'Conservamos tus datos mientras tu cuenta esté activa. Los movimientos y cuentas se conservan para mantener la trazabilidad de tu información, y los registros de seguridad se guardan solo durante el tiempo necesario para investigar incidentes.',
      'Si solicitas la eliminación de tu cuenta, suprimimos o anonimizamos tus datos personales, salvo aquella información que debamos conservar por obligación legal o para mantener la integridad de los registros de auditoría.',
    ],
  },
  {
    id: 'derechos',
    icon: 'verified_user',
    title: 'Tus derechos',
    paragraphs: [
      'Puedes revisar y corregir tu nombre, correo electrónico, teléfono y foto desde «Perfil», donde también puedes cambiar tu contraseña y ajustar tus preferencias.',
      `Además, puedes solicitar el acceso, la rectificación, la supresión, la portabilidad, la limitación o la oposición al tratamiento de tus datos escribiendo a ${PRIVACY_CONTACT_EMAIL}. responderemos tu solicitud en un plazo razonable. Si dejas de recibir correos, también puedes indicárnoslo en esa dirección.`,
    ],
  },
  {
    id: 'seguridad',
    icon: 'lock',
    title: 'Seguridad',
    paragraphs: [
      'La app usa autenticación gestionada por Supabase, contraseñas almacenadas como hash, políticas de acceso por fila para que cada usuario solo vea sus propios datos, limitación de intentos de acceso, una bitácora de auditoría de las acciones de administración y una política de seguridad de contenido estricta en producción.',
      `Ningún sistema es completamente infalible. Si detectas un problema de seguridad o un uso indebido de tu cuenta, avísanos de inmediato a ${PRIVACY_CONTACT_EMAIL}.`,
    ],
  },
  {
    id: 'menores',
    icon: 'person_off',
    title: 'Menores de edad',
    paragraphs: [`${APP_NAME} no está dirigido a menores de 16 años. Si tenemos conocimiento de que un menor ha creado una cuenta, eliminaremos sus datos personales.`],
  },
  {
    id: 'cambios',
    icon: 'history',
    title: 'Cambios en esta política',
    paragraphs: [
      'Podemos actualizar esta política para reflejar cambios en el servicio o en la normativa. Publicaremos la versión vigente en esta página y modificaremos la fecha de vigencia indicada arriba.',
    ],
  },
]

export function Privacy() {
  return (
    <LegalPage
      eyebrow="Privacidad"
      title="Política de privacidad"
      description="Explicamos de forma clara qué información recopilamos, cómo la usamos y qué control tienes sobre ella."
      effectiveDate={PRIVACY_EFFECTIVE_DATE}
      summary={
        <>
          Tus datos financieros son tuyos. Solo los usamos para que la app funcione, los protegemos con controles de
          acceso y auditoría, y no los vendemos ni los usamos para publicidad. Puedes pedirnos acceso, corrección o
          eliminación en cualquier momento. Consulta también los{' '}
          <Link className="font-medium text-primary hover:underline" to="/terminos">
            Términos y Condiciones
          </Link>
          .
        </>
      }
      sections={SECTIONS}
      contactEmail={PRIVACY_CONTACT_EMAIL}
      related={{ label: 'Términos y Condiciones', to: '/terminos' }}
    />
  )
}
