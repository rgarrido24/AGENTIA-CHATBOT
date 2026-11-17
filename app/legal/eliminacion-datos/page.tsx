import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Eliminación de datos — Agentia',
  description: 'Cómo solicitar la eliminación de tus datos personales en Agentia (Facebook / Instagram / WhatsApp).',
};

const MAIL = 'privacidad@agentia.software';

export default function EliminacionDatosPage() {
  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      <nav className="border-b px-4 py-3" style={{ borderColor: '#111' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo-agentia-2026.png" alt="Agentia" width={32} height={32} className="rounded-xl" />
          </Link>
          <Link href="/" className="text-xs" style={{ color: '#555' }}>← Inicio</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-10" style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6 }}>
        <h1 className="text-2xl font-extrabold text-white mb-1">Eliminación de datos / Data deletion</h1>
        <p className="text-xs mb-8" style={{ color: '#555' }}>Última actualización: noviembre 2026</p>

        <h2 className="text-base font-bold text-white mb-2">Cómo solicitar la eliminación de tus datos</h2>
        <p className="mb-3">
          Si enviaste un formulario de Facebook o Instagram (Lead Ads), escribiste un mensaje o comentaste en la página de
          un asesor que usa Agentia, puedes pedir que eliminemos tus datos personales (nombre, teléfono, correo y el historial de mensajes).
        </p>
        <ol className="mb-3" style={{ paddingLeft: 20, listStyle: 'decimal' }}>
          <li>Envía un correo a{' '}
            <a href={`mailto:${MAIL}?subject=Eliminaci%C3%B3n%20de%20datos`} style={{ color: '#22c55e' }}>{MAIL}</a>{' '}
            con el asunto “Eliminación de datos”.
          </li>
          <li>Indica el nombre y el teléfono (o usuario de Facebook/Instagram) con los que nos contactaste, y la página o asesor, si lo sabes.</li>
          <li>Eliminaremos tus datos de nuestros sistemas en un plazo máximo de 20 días hábiles y te confirmaremos por correo.</li>
        </ol>
        <p className="mb-6">
          Si eres un asesor que conectó su página, también puedes revocar el acceso de Agentia en Facebook (Configuración →
          Integraciones de negocios) y pedirnos por el mismo correo que borremos tu cuenta y sus datos.
        </p>

        <h2 className="text-base font-bold text-white mb-2">Request to delete your data</h2>
        <p className="mb-6">
          To request deletion of your personal data (name, phone number, email and message history) collected through Facebook or
          Instagram Lead Ads, messages or comments, email <a href={`mailto:${MAIL}?subject=Data%20deletion`} style={{ color: '#22c55e' }}>{MAIL}</a>{' '}
          with the subject “Data deletion”, including the name and phone number you used. We will delete your data within 20 business days and confirm by email.
        </p>

        <p className="text-xs" style={{ color: '#555' }}>
          Más información: <Link href="/legal/privacidad" style={{ color: '#22c55e' }}>Aviso de privacidad</Link>.
        </p>
      </main>
    </div>
  );
}
