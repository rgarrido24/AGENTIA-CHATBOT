import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Términos y Condiciones — Agentia',
  description: 'Términos y condiciones del servicio Agentia CRM & Chatbot con IA.',
};

export default function TerminosPage() {
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

      <main className="max-w-3xl mx-auto px-4 py-10 prose prose-invert prose-sm max-w-none">
        <h1 className="text-2xl font-extrabold text-white mb-1">Términos y Condiciones</h1>
        <p className="text-xs mb-8" style={{ color: '#555' }}>Última actualización: abril 2026 · Vigentes desde el 1 de mayo de 2026</p>

        <Section title="1. Descripción del servicio">
          <p>Agentia es una plataforma SaaS de CRM y chatbot con inteligencia artificial para negocios.
          El servicio incluye un agente conversacional automatizado para WhatsApp y redes sociales,
          panel de administración de leads, reportes y herramientas de seguimiento comercial.</p>
        </Section>

        <Section title="2. Planes y precios">
          <table className="w-full text-xs border-collapse mb-2">
            <thead>
              <tr className="border-b" style={{ borderColor: '#222' }}>
                <th className="text-left py-2 font-semibold text-white">Plan</th>
                <th className="text-right py-2 font-semibold text-white">MXN/mes</th>
                <th className="text-right py-2 font-semibold text-white">USD/mes</th>
                <th className="text-right py-2 font-semibold text-white">Activación</th>
              </tr>
            </thead>
            <tbody style={{ color: '#888' }}>
              {[
                ['Starter',     '$399', '$25', '$500 MXN / $30 USD'],
                ['Profesional', '$599', '$35', '$500 MXN / $30 USD'],
                ['Premium',     '$899', '$55', '$500 MXN / $30 USD'],
              ].map(([plan, mxn, usd, act]) => (
                <tr key={plan} className="border-b" style={{ borderColor: '#111' }}>
                  <td className="py-2">{plan}</td>
                  <td className="text-right py-2">{mxn}</td>
                  <td className="text-right py-2">{usd}</td>
                  <td className="text-right py-2">{act}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Clientes en México pagan en MXN. Clientes internacionales pagan en USD.
          Los precios no incluyen IVA. La cuota de activación se cobra una sola vez al contratar.</p>
        </Section>

        <Section title="3. Fechas y ciclo de pago">
          <p>La suscripción se renueva mensualmente. El cobro se realiza los primeros 5 días de cada mes mediante cargo automático a la tarjeta registrada en Stripe.</p>
        </Section>

        <Section title="4. Suspensión automática">
          <p>Si al día 6 del mes el pago no se ha procesado exitosamente, el servicio quedará
          automáticamente suspendido hasta regularizar el adeudo. Durante la suspensión,
          el chatbot responderá: <em>"Este servicio está temporalmente suspendido."</em></p>
        </Section>

        <Section title="5. Reactivación">
          <p>Para reactivar un servicio suspendido, el cliente deberá liquidar el monto pendiente
          más una cuota de reactivación de $200 MXN / $12 USD. La reactivación se procesará
          en un plazo máximo de 24 horas hábiles.</p>
        </Section>

        <Section title="6. Cancelación">
          <p>El cliente puede cancelar su suscripción en cualquier momento con un aviso mínimo de
          15 días naturales. No se realizan reembolsos por períodos ya cobrados. La cancelación
          se solicita por correo electrónico a <a href="mailto:hola@agentia.software" style={{ color: '#22c55e' }}>hola@agentia.software</a>.</p>
        </Section>

        <Section title="7. Propiedad intelectual">
          <p>Agentia y todos sus componentes, incluyendo el software, modelos de IA, interfaces
          y documentación, son propiedad exclusiva de Agentia Software. Los datos de los clientes
          (leads, conversaciones) pertenecen al cliente contratante.</p>
        </Section>

        <Section title="8. Límite de responsabilidad">
          <p>Agentia no garantiza resultados específicos de ventas. En ningún caso la responsabilidad
          total de Agentia excederá el monto pagado por el cliente en los últimos 3 meses.
          No somos responsables por interrupciones de servicio de terceros (WhatsApp, Meta, Google).</p>
        </Section>

        <Section title="9. Privacidad de datos">
          <p>El tratamiento de datos personales se rige por nuestro{' '}
          <Link href="/legal/privacidad" style={{ color: '#22c55e' }}>Aviso de Privacidad</Link>,
          el cual cumple con la LFPDPPP (México), Ley 25.326 (Argentina) y Ley 19.628 (Chile).</p>
        </Section>

        <Section title="10. Jurisdicción y ley aplicable">
          <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos.
          Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales
          de la ciudad de Mérida, Yucatán, México, renunciando a cualquier otro fuero.</p>
        </Section>

        <div className="mt-10 pt-6 border-t" style={{ borderColor: '#111' }}>
          <p className="text-xs" style={{ color: '#444' }}>
            © {new Date().getFullYear()} Agentia Software · Mérida, Yucatán, México ·{' '}
            <a href="mailto:hola@agentia.software" style={{ color: '#555' }}>hola@agentia.software</a>
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
      <div className="text-sm leading-relaxed" style={{ color: '#888' }}>{children}</div>
    </section>
  );
}
