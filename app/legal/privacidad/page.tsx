import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Aviso de Privacidad — Agentia',
  description: 'Aviso de privacidad y tratamiento de datos personales de Agentia.',
};

export default function PrivacidadPage() {
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

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-extrabold text-white mb-1">Aviso de Privacidad</h1>
        <p className="text-xs mb-8" style={{ color: '#555' }}>Última actualización: abril 2026</p>

        <Section title="1. Responsable del tratamiento">
          <p>Agentia Software, con domicilio en Mérida, Yucatán, México. Contacto de privacidad:{' '}
            <a href="mailto:privacidad@agentia.software" style={{ color: '#22c55e' }}>privacidad@agentia.software</a>
          </p>
        </Section>

        <Section title="2. Datos que recopilamos">
          <ul>
            <li><strong className="text-white">Datos de clientes contratantes:</strong> nombre completo, razón social, correo electrónico, teléfono, giro del negocio, país, datos de facturación y método de pago (procesados por Stripe, no almacenados por Agentia).</li>
            <li><strong className="text-white">Datos de usuarios finales (leads):</strong> nombre, número de WhatsApp, correo electrónico y cualquier información proporcionada voluntariamente en las conversaciones con el chatbot.</li>
            <li><strong className="text-white">Datos de uso:</strong> logs de conversación, métricas de interacción, dirección IP.</li>
          </ul>
        </Section>

        <Section title="3. Finalidades del tratamiento">
          <ul>
            <li>Prestación y mejora del servicio Agentia.</li>
            <li>Gestión de facturación y cobros recurrentes.</li>
            <li>Comunicaciones relacionadas con el servicio (alertas, reportes, soporte).</li>
            <li>Cumplimiento de obligaciones legales y fiscales.</li>
          </ul>
        </Section>

        <Section title="4. Transferencia de datos">
          <p>Los datos pueden ser compartidos con:</p>
          <ul>
            <li><strong className="text-white">Stripe Inc.</strong> — procesamiento de pagos (EUA). Sujeto a su propia política de privacidad.</li>
            <li><strong className="text-white">Google LLC</strong> — servicios de IA (Gemini) y análisis. Sujeto a las políticas de Google.</li>
            <li><strong className="text-white">MongoDB Inc.</strong> — almacenamiento de base de datos. Sujeto a su DPA.</li>
          </ul>
          <p>No vendemos ni cedemos datos personales a terceros con fines comerciales.</p>
        </Section>

        <Section title="5. Derechos ARCO (México — LFPDPPP)">
          <p>Los titulares de datos en México tienen derecho a Acceso, Rectificación, Cancelación y Oposición al tratamiento de sus datos personales. Para ejercer estos derechos, enviar solicitud a <a href="mailto:privacidad@agentia.software" style={{ color: '#22c55e' }}>privacidad@agentia.software</a>. Responderemos en un plazo máximo de 20 días hábiles.</p>
        </Section>

        <Section title="6. Derechos de titulares (Argentina — Ley 25.326)">
          <p>Los titulares de datos en Argentina tienen derecho a acceso, rectificación, supresión y confidencialidad de sus datos. Pueden ejercer estos derechos contactando al correo de privacidad indicado. La Dirección Nacional de Protección de Datos Personales (DNPDP) es el organismo de control.</p>
        </Section>

        <Section title="7. Derechos de titulares (Chile — Ley 19.628)">
          <p>Las personas en Chile tienen derecho a solicitar información, modificación, bloqueo o eliminación de sus datos. Pueden dirigirse a la dirección de contacto indicada en este aviso.</p>
        </Section>

        <Section title="8. Cookies y tecnologías de rastreo">
          <p>El sitio web utiliza cookies esenciales para el funcionamiento de la sesión y cookies analíticas de Google Analytics. Puede deshabilitar las cookies no esenciales desde la configuración de su navegador.</p>
        </Section>

        <Section title="9. Retención de datos">
          <p>Los datos de clientes se conservan durante la vigencia del contrato y 3 años adicionales por obligaciones fiscales. Los datos de conversaciones del chatbot se conservan 12 meses. Los datos de leads se conservan según la configuración del cliente contratante.</p>
        </Section>

        <Section title="10. Seguridad">
          <p>Implementamos medidas técnicas y organizativas para proteger los datos: cifrado en tránsito (TLS), acceso restringido por roles, y auditorías periódicas de seguridad.</p>
        </Section>

        <Section title="11. Cambios a este aviso">
          <p>Notificaremos cambios materiales por correo electrónico con al menos 15 días de anticipación. El uso continuado del servicio implica aceptación de los cambios.</p>
        </Section>

        <div className="mt-10 pt-6 border-t" style={{ borderColor: '#111' }}>
          <p className="text-xs" style={{ color: '#444' }}>
            © {new Date().getFullYear()} Agentia Software · Mérida, Yucatán, México ·{' '}
            <a href="mailto:privacidad@agentia.software" style={{ color: '#555' }}>privacidad@agentia.software</a>
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-bold text-white mb-2">{title}</h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: '#888' }}>{children}</div>
    </section>
  );
}
