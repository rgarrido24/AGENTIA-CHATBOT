'use client';

import { useMemo, useState } from 'react';
import {
  BIOVELA_MONTHLY_MXN,
  BIOVELA_RECURRING_START_LABEL,
  BIOVELA_SETUP_MXN,
  calcBiovelaProrateMx,
  formatMxDate,
  formatMxMoney,
} from '@/lib/biovela-contract-billing';

const TERMS = `TÉRMINOS Y CONDICIONES DE SERVICIO — AGENTIA × BIOVELA

1. DESCRIPCIÓN DEL SERVICIO
Agentia Software provee a La Rueda Veladoras (Biovela) un servicio de chatbot con inteligencia artificial para WhatsApp, panel de gestión de conversaciones y leads, catálogo integrado, flujo de citas para recolección en tienda y soporte técnico según el plan contratado.

2. FACTURACIÓN Y PAGO
El servicio incluye un pago único de implementación de $5,000 MXN y una suscripción mensual de $999 MXN. El primer período mensual se prorratea desde la fecha de firma hasta el 31 de julio de 2026. A partir del 1 de agosto de 2026, la suscripción de $999 MXN se cobra automáticamente cada mes mediante Stripe.

3. CANCELACIÓN
El cliente puede solicitar la cancelación enviando correo a soporte@agentia.io con al menos 15 días de anticipación al próximo cobro. No hay reembolsos por períodos parciales ya facturados.

4. CONFIDENCIALIDAD
Agentia no comparte información de Biovela ni de sus clientes finales con terceros sin consentimiento. Los datos se almacenan de forma segura.

5. LIMITACIÓN DE RESPONSABILIDAD
Agentia no será responsable por pérdidas comerciales derivadas de fallos en APIs de terceros (Meta/WhatsApp), errores del chatbot o decisiones comerciales basadas en respuestas de la IA.

Al firmar, el representante de Biovela declara haber leído y aceptado estos términos.`;

export type BiovelaStripeLinks = {
  setup: string;
  prorate: string;
  recurring: string;
};

function PaymentButton({
  href,
  children,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  if (!href || disabled) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-xl py-3 text-center text-xs font-bold opacity-40"
        style={{ background: '#2E2520', color: '#8A7660' }}
      >
        {children} (link no configurado)
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-xl py-3 text-center text-xs font-bold transition-opacity hover:opacity-90"
      style={{ background: '#E8962A', color: '#0E0B07' }}
    >
      {children}
    </a>
  );
}

export function BiovelaContratoForm({ stripeLinks }: { stripeLinks: BiovelaStripeLinks }) {
  const [signedName, setSignedName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signed, setSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<Date | null>(null);

  const prorateMx = useMemo(
    () => calcBiovelaProrateMx(signedAt ?? new Date()),
    [signedAt]
  );
  const totalTransferToday = BIOVELA_SETUP_MXN + prorateMx;
  const signDateLabel = formatMxDate(signedAt ?? new Date());

  const canSign = accepted && signedName.trim().length >= 3 && !loading && !signed;

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    if (!canSign) return;
    setLoading(true);
    setError('');
    const now = new Date();
    const prorateAtSign = calcBiovelaProrateMx(now);
    const totalAtSign = BIOVELA_SETUP_MXN + prorateAtSign;
    try {
      const res = await fetch('/api/contratar/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'biovela',
          signedName: signedName.trim(),
          planName: 'Plan Biovela',
          price: `${formatMxMoney(BIOVELA_MONTHLY_MXN)} / mes`,
          setupFee: BIOVELA_SETUP_MXN,
          totalToday: totalAtSign,
          prorateMx: prorateAtSign,
          renewalIso: new Date(2026, 7, 1).toISOString(),
          signOnly: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Error al registrar la firma. Contacta a soporte@agentia.io');
        return;
      }
      setSignedAt(now);
      setSigned(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSign} className="space-y-5">
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ background: '#1A1410', borderColor: '#2E2520' }}
        >
          <p className="px-5 pb-2 pt-4 text-xs font-semibold tracking-widest" style={{ color: '#8A7660' }}>
            TÉRMINOS Y CONDICIONES
          </p>
          <div className="max-h-56 overflow-y-auto px-5 pb-5">
            {TERMS.split('\n\n').map((block, i) => (
              <p key={i} className="mb-3 text-xs leading-relaxed" style={{ color: '#8A7660' }}>
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
            disabled={signed}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-amber-500"
          />
          <span className="text-sm" style={{ color: '#8A7660' }}>
            Acepto los términos y condiciones del servicio Agentia Software
          </span>
        </label>

        <div>
          <label
            htmlFor="signed-name"
            className="mb-2 block text-xs font-semibold tracking-widest"
            style={{ color: '#8A7660' }}
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
            disabled={signed}
            className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-60"
            style={{ background: '#241E18', borderColor: '#2E2520' }}
          />
        </div>

        {error && (
          <p className="text-xs font-medium" style={{ color: '#f87171' }}>
            {error}
          </p>
        )}

        {!signed && (
          <button
            type="submit"
            disabled={!canSign}
            className="w-full rounded-xl py-4 text-center text-xs font-bold leading-snug transition-opacity disabled:opacity-40"
            style={{ background: '#E8962A', color: '#0E0B07' }}
          >
            {loading ? 'Registrando firma…' : 'Firmar contrato'}
          </button>
        )}
      </form>

      {signed && signedAt && (
        <div
          className="space-y-5 rounded-2xl border p-5"
          style={{ background: '#1A1410', borderColor: '#2E2520' }}
        >
          <div>
            <p className="text-xs font-semibold tracking-widest" style={{ color: '#8A7660' }}>
              RESUMEN DE PAGOS AL FIRMAR
            </p>
            <p className="mt-1 text-xs" style={{ color: '#8A7660' }}>
              Firma registrada el {signDateLabel} · {signedName.trim()}
            </p>
          </div>

          {/* 1. Implementación */}
          <div className="space-y-2 rounded-xl border p-4" style={{ borderColor: '#2E2520' }}>
            <p className="text-sm font-semibold">1. Pago de implementación</p>
            <p className="text-lg font-semibold" style={{ color: '#E8962A' }}>
              {formatMxMoney(BIOVELA_SETUP_MXN)} (único)
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#8A7660' }}>
              Configuración completa: WhatsApp bot, panel CRM, tienda Tiendanube, imágenes, pasarela de
              pagos y Envia.com
            </p>
            <PaymentButton href={stripeLinks.setup}>
              Pagar implementación $5,000
            </PaymentButton>
          </div>

          {/* 2. Primer mes prorateado */}
          <div className="space-y-2 rounded-xl border p-4" style={{ borderColor: '#2E2520' }}>
            <p className="text-sm font-semibold">2. Primer mes prorateado</p>
            <p className="text-lg font-semibold" style={{ color: '#E8962A' }}>
              {formatMxMoney(prorateMx)}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#8A7660' }}>
              Servicio Agentia del {signDateLabel} al 31 de julio de 2026
            </p>
            <PaymentButton href={stripeLinks.prorate}>
              Pagar primer mes ${prorateMx.toLocaleString('es-MX')}
            </PaymentButton>
          </div>

          {/* 3. Recurrente */}
          <div className="space-y-2 rounded-xl border p-4" style={{ borderColor: '#2E2520' }}>
            <p className="text-sm font-semibold">3. Suscripción mensual</p>
            <p className="text-sm" style={{ color: '#8A7660' }}>
              A partir del {BIOVELA_RECURRING_START_LABEL}: {formatMxMoney(BIOVELA_MONTHLY_MXN)}/mes automático
            </p>
            <PaymentButton href={stripeLinks.recurring}>
              Activar pago mensual $999/mes
            </PaymentButton>
          </div>

          {/* Transferencia */}
          <div
            className="space-y-3 rounded-xl border p-4"
            style={{ borderColor: '#2E2520', background: '#241E18' }}
          >
            <p className="text-xs font-semibold tracking-widest" style={{ color: '#8A7660' }}>
              OPCIÓN TRANSFERENCIA
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt style={{ color: '#8A7660' }}>Implementación</dt>
                <dd className="font-medium">{formatMxMoney(BIOVELA_SETUP_MXN)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt style={{ color: '#8A7660' }}>Primer mes (prorateado)</dt>
                <dd className="font-medium">{formatMxMoney(prorateMx)}</dd>
              </div>
              <div
                className="flex justify-between gap-4 border-t pt-2 font-semibold"
                style={{ borderColor: '#2E2520' }}
              >
                <dt>Total a transferir hoy</dt>
                <dd style={{ color: '#E8962A' }}>{formatMxMoney(totalTransferToday)}</dd>
              </div>
            </dl>
            <p className="text-xs" style={{ color: '#8A7660' }}>
              Concepto: <span className="text-[#F2EDE4]">Agentia Biovela implementación + julio</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
