'use client';

import { useState } from 'react';

const TERMS = `TÉRMINOS Y CONDICIONES DE SERVICIO — AGENTIA × BIOVELA

1. DESCRIPCIÓN DEL SERVICIO
Agentia Software provee a La Rueda Veladoras (Biovela) un servicio de chatbot con inteligencia artificial para WhatsApp, panel de gestión de conversaciones y leads, catálogo integrado, flujo de citas para recolección en tienda y soporte técnico según el plan contratado.

2. FACTURACIÓN Y PAGO
El servicio se factura mensualmente por $999 MXN (novecientos noventa y nueve pesos mexicanos), de forma anticipada y recurrente mediante Stripe. El primer cobro se realiza al activar la suscripción y los siguientes el mismo día de cada mes. En caso de falta de pago, el servicio podrá suspenderse transcurridos 5 días hábiles del vencimiento.

3. CANCELACIÓN
El cliente puede solicitar la cancelación enviando correo a soporte@agentia.io con al menos 15 días de anticipación al próximo cobro. No hay reembolsos por períodos parciales ya facturados.

4. CONFIDENCIALIDAD
Agentia no comparte información de Biovela ni de sus clientes finales con terceros sin consentimiento. Los datos se almacenan de forma segura. El cliente puede solicitar exportación o eliminación de sus datos en cualquier momento.

5. LIMITACIÓN DE RESPONSABILIDAD
Agentia no será responsable por pérdidas comerciales derivadas de fallos en APIs de terceros (Meta/WhatsApp), errores del chatbot o decisiones comerciales basadas en respuestas de la IA. La responsabilidad máxima no excederá el importe del último mes facturado.

Al firmar, el representante de Biovela declara haber leído y aceptado estos términos.`;

export function BiovelaContratoForm() {
  const [signedName, setSignedName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          clientId: 'biovela',
          signedName: signedName.trim(),
          planName: 'Plan Biovela',
          price: '$999 MXN / mes',
          totalToday: 999,
          renewalIso: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { paymentLink?: string; error?: string };
      if (!res.ok || !data.paymentLink) {
        setError(data.error ?? 'Link de pago no configurado. Contacta a soporte@agentia.io');
        return;
      }
      window.location.href = data.paymentLink;
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
      >
        <p className="px-5 pb-2 pt-4 text-xs font-semibold tracking-widest" style={{ color: '#555' }}>
          TÉRMINOS Y CONDICIONES
        </p>
        <div className="max-h-56 overflow-y-auto px-5 pb-5">
          {TERMS.split('\n\n').map((block, i) => (
            <p key={i} className="mb-3 text-xs leading-relaxed" style={{ color: '#aaa' }}>
              {block}
            </p>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer select-none items-start gap-3">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-amber-500"
        />
        <span className="text-sm" style={{ color: '#aaa' }}>
          Acepto los términos y condiciones del servicio Agentia Software
        </span>
      </label>

      <div>
        <label
          htmlFor="signed-name"
          className="mb-2 block text-xs font-semibold tracking-widest"
          style={{ color: '#555' }}
        >
          NOMBRE COMPLETO (FIRMA)
        </label>
        <input
          id="signed-name"
          type="text"
          value={signedName}
          onChange={(e) => setSignedName(e.target.value)}
          placeholder="Nombre del representante de Biovela"
          autoComplete="name"
          className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          style={{ background: '#111', borderColor: '#2a2a2a' }}
        />
        <p className="mt-1.5 text-xs" style={{ color: '#444' }}>
          Firma digital · Plan Biovela · $999 MXN / mes
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
        className="w-full rounded-xl py-4 text-center text-xs font-bold leading-snug transition-opacity disabled:opacity-40"
        style={{ background: '#E8962A', color: '#0E0B07' }}
      >
        {loading
          ? 'Procesando…'
          : 'Contratar y pagar $999 MXN / mes con Stripe →'}
      </button>
    </form>
  );
}
