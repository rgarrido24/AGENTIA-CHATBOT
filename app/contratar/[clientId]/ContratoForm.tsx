'use client';

import { useEffect, useState } from 'react';

const TERMS = `TÉRMINOS Y CONDICIONES DE SERVICIO — AGENTIA

1. DESCRIPCIÓN DEL SERVICIO
Agentia provee un servicio de chatbot con inteligencia artificial (IA) para la gestión automatizada de conversaciones vía WhatsApp y otras plataformas digitales. El servicio incluye acceso al panel de control, configuración del agente IA, soporte técnico básico y actualizaciones de la plataforma incluidas en el plan contratado.

2. FACTURACIÓN Y PAGO
El servicio se factura mensualmente de forma anticipada. El primer cobro se realiza al momento de la contratación y los siguientes el mismo día de cada mes. En caso de falta de pago, el servicio será suspendido automáticamente transcurridos 5 días hábiles del vencimiento sin que medie notificación previa adicional.

3. CANCELACIÓN
El cliente puede solicitar la cancelación del servicio en cualquier momento enviando un correo electrónico a soporte@agentia.io con al menos 15 días de anticipación a la fecha del próximo cobro. No se realizan reembolsos por períodos parciales ya facturados. Al cancelar, el acceso al servicio y los datos almacenados estarán disponibles hasta el fin del período pago.

4. DISPONIBILIDAD DEL SERVICIO
Agentia garantiza una disponibilidad del 99% mensual del servicio. El mantenimiento programado será notificado con al menos 24 horas de anticipación. Agentia no asume responsabilidad por interrupciones causadas por terceros, incluyendo Meta, WhatsApp Business, Google u otros proveedores de infraestructura.

5. USO ACEPTABLE
El cliente es el único responsable del contenido de las conversaciones gestionadas a través de su chatbot. Queda expresamente prohibido el uso del servicio para actividades ilegales, envío masivo de mensajes no solicitados (spam), suplantación de identidad, o cualquier práctica que viole los Términos de Uso de WhatsApp Business o la legislación vigente.

Uso de Marca: El Cliente autoriza a Agentia a utilizar su nombre comercial y/o logo únicamente como referencia de portafolio de clientes, salvo instrucción en contrario por escrito.

6. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS
Agentia no comparte información de los clientes ni de sus usuarios finales con terceros sin consentimiento explícito. Los datos de conversaciones se almacenan de forma segura en servidores cifrados. El cliente puede solicitar la exportación o eliminación total de sus datos en cualquier momento mediante solicitud formal a soporte@agentia.io.

7. PROPIEDAD INTELECTUAL
La plataforma Agentia, su código fuente, diseño y marca son propiedad exclusiva de Agentia. El cliente conserva la propiedad de sus datos, conversaciones y materiales propios ingresados a la plataforma. Ninguna parte de este contrato transfiere derechos de propiedad intelectual entre las partes.

8. LIMITACIÓN DE RESPONSABILIDAD
Agentia no será responsable por pérdidas comerciales, lucro cesante o daños indirectos derivados de fallos técnicos, cambios en las APIs de terceros, errores en las respuestas del chatbot, o decisiones comerciales tomadas en base a información generada por la IA. La responsabilidad máxima de Agentia en cualquier caso no excederá el importe del último mes facturado.

9. MODIFICACIONES AL SERVICIO Y A ESTOS TÉRMINOS
Agentia se reserva el derecho de modificar estos términos con 30 días de anticipación mediante notificación al correo del cliente. El uso continuado del servicio luego del vencimiento del plazo de notificación implica la aceptación tácita de los nuevos términos.

10. AVISO DE PRIVACIDAD
Los datos personales recabados son tratados conforme a lo establecido en la Ley 19.628 sobre Protección de la Vida Privada (Chile) y la Ley Federal de Protección de Datos Personales en Posesión de los Particulares — LFPDPPP (México). La información será utilizada exclusivamente para la prestación del servicio contratado y no será cedida a terceros sin consentimiento expreso del titular. El cliente podrá ejercer sus derechos de acceso, rectificación, cancelación y oposición (ARCO) mediante solicitud formal a soporte@agentia.io.

11. SOPORTE Y MODIFICACIONES
El soporte técnico está disponible de lunes a viernes de 9:00 a 19:00 hrs (GMT-6). El tiempo de respuesta es de máximo 6 horas para consultas generales y 2 horas para urgencias críticas. El plan incluye hasta 2 modificaciones sin código por mes (ajustes de texto, respuestas del bot, configuración básica) y 1 modificación con código por mes (nuevas funcionalidades menores). Los cambios mayores, nuevas integraciones o desarrollos a medida tendrán un costo adicional de $30 USD por tarea, a cotizar previamente con el cliente.

Al firmar este contrato, el cliente declara haber leído, comprendido y aceptado la totalidad de los presentes términos y condiciones.`;

type Props = {
  clientId: string;
  clientName: string;
  planName: string;
  price: string;
  setupFee?: number;
  totalToday?: number;
  renewalIso?: string;
};

export function ContratoForm({
  clientId,
  clientName,
  planName,
  price,
  setupFee,
  totalToday,
  renewalIso,
}: Props) {
  const [signedName, setSignedName] = useState('');
  const [accepted, setAccepted]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Anti-debugging guard (production only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const interval = setInterval(() => {
        const start = performance.now();
        // eslint-disable-next-line no-debugger
        debugger;
        if (performance.now() - start > 100) {
          document.body.innerHTML = '';
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, []);

  const canSubmit = accepted && signedName.trim().length >= 3 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contratar/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          signedName: signedName.trim(),
          setupFee,
          totalToday,
          renewalIso,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { paymentLink?: string; error?: string };
      if (!res.ok || !data.paymentLink) {
        setError(data.error ?? 'Error al procesar. Intentá de nuevo.');
        return;
      }
      window.location.href = data.paymentLink;
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* T&C scroll box */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
      >
        <p
          className="px-5 pt-4 pb-2 text-xs font-semibold tracking-widest"
          style={{ color: '#555' }}
        >
          TÉRMINOS Y CONDICIONES
        </p>
        <div
          className="px-5 pb-5 overflow-y-auto"
          style={{ maxHeight: '14rem' }}
        >
          {TERMS.split('\n\n').map((block, i) => (
            <p
              key={i}
              className="text-xs mb-3 leading-relaxed"
              style={{ color: block.match(/^\d+\./) ? '#ccc' : '#777' }}
            >
              {block}
            </p>
          ))}
        </div>
      </div>

      {/* Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-green-500"
        />
        <span className="text-sm" style={{ color: '#aaa' }}>
          Acepto los términos y condiciones del servicio Agentia
        </span>
      </label>

      {/* Name field */}
      <div>
        <label
          htmlFor="signed-name"
          className="block text-xs font-semibold mb-2 tracking-widest"
          style={{ color: '#555' }}
        >
          NOMBRE COMPLETO (FIRMA)
        </label>
        <input
          id="signed-name"
          type="text"
          value={signedName}
          onChange={(e) => setSignedName(e.target.value)}
          placeholder="Ingresá tu nombre completo"
          autoComplete="name"
          className="w-full rounded-xl border px-4 py-3 text-sm text-white placeholder-white/30 bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500/40"
          style={{ background: '#111', borderColor: '#2a2a2a' }}
        />
        <p className="text-xs mt-1.5" style={{ color: '#444' }}>
          Tu firma digital como {clientName} · {planName} · {price}
        </p>
      </div>

      {error && (
        <p className="text-xs font-medium" style={{ color: '#f87171' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl py-4 text-xs font-bold leading-snug text-center transition-opacity disabled:opacity-40"
        style={{ background: '#22c55e', color: '#000' }}
      >
        {loading
          ? 'Procesando…'
          : 'Al hacer clic en Contratar y realizar el pago, acepto los Términos, Condiciones y Aviso de Privacidad aquí expuestos'}
      </button>

    </form>
  );
}
