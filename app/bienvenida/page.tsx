import Image from 'next/image';
import Link from 'next/link';
import { stripe, PLAN_DATA, type PlanKey } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

import { AGENTIA_WHATSAPP_URL } from '@/lib/agentia-contact';

const SUPPORT_WA = AGENTIA_WHATSAPP_URL;

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

type SessionInfo = {
  planLabel: string;
  amountLabel: string;
  nombre: string;
  negocio: string;
  email: string;
  monedaLabel: string;
};

async function loadSessionInfo(sessionId: string | undefined): Promise<SessionInfo | null> {
  if (!sessionId || !process.env.STRIPE_SECRET_KEY) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });
    const md = session.metadata ?? {};
    const planKey = typeof md.plan === 'string' ? (md.plan as PlanKey) : null;
    const planLabel =
      planKey && planKey in PLAN_DATA ? PLAN_DATA[planKey].nombre : (md.plan ?? 'Plan Agentia');

    let amountLabel = '';
    if (session.amount_total != null && session.currency) {
      amountLabel = formatMoney(session.amount_total, session.currency);
    }

    const monedaLabel =
      md.moneda === 'usd' ? 'USD' : md.moneda === 'mxn' ? 'MXN' : String(md.moneda ?? '');

    return {
      planLabel,
      amountLabel,
      nombre: String(md.nombre ?? '').trim(),
      negocio: String(md.negocio ?? '').trim(),
      email: String(md.email ?? '').trim(),
      monedaLabel,
    };
  } catch {
    return null;
  }
}

export default async function BienvenidaPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id?.trim();
  const info = await loadSessionInfo(sessionId);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(180deg, #050805 0%, #000 45%, #061a0d 100%)',
      }}
    >
      <div className="w-full max-w-lg text-center space-y-8">
        <div className="flex justify-center">
          <Image
            src="/logo-agentia-2026.png"
            alt="Agentia"
            width={80}
            height={80}
            className="rounded-2xl shadow-lg shadow-green-500/10"
            priority
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ¡Bienvenido a Agentia! 🎉
          </h1>
          <p className="text-base sm:text-lg font-medium" style={{ color: '#86efac' }}>
            Tu suscripción está activa
          </p>
        </div>

        <div
          className="rounded-2xl border p-6 text-left space-y-4 shadow-xl"
          style={{
            background: 'linear-gradient(145deg, #0d1a0f 0%, #0a0a0a 100%)',
            borderColor: 'rgba(34, 197, 94, 0.35)',
          }}
        >
          <p className="text-xs font-semibold tracking-widest" style={{ color: '#22c55e' }}>
            TU PLAN
          </p>
          {info ? (
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between gap-4">
                <span style={{ color: '#888' }}>Plan</span>
                <span className="font-bold text-white text-right">{info.planLabel}</span>
              </li>
              {info.amountLabel ? (
                <li className="flex justify-between gap-4">
                  <span style={{ color: '#888' }}>Pago confirmado</span>
                  <span className="font-bold" style={{ color: '#4ade80' }}>
                    {info.amountLabel}
                  </span>
                </li>
              ) : null}
              {info.monedaLabel ? (
                <li className="flex justify-between gap-4">
                  <span style={{ color: '#888' }}>Moneda</span>
                  <span className="text-white">{info.monedaLabel}</span>
                </li>
              ) : null}
              {info.nombre ? (
                <li className="flex justify-between gap-4">
                  <span style={{ color: '#888' }}>Titular</span>
                  <span className="text-white text-right">{info.nombre}</span>
                </li>
              ) : null}
              {info.negocio ? (
                <li className="flex justify-between gap-4">
                  <span style={{ color: '#888' }}>Negocio</span>
                  <span className="text-white text-right">{info.negocio}</span>
                </li>
              ) : null}
              {info.email ? (
                <li className="flex justify-between gap-4">
                  <span style={{ color: '#888' }}>Correo</span>
                  <span className="text-white text-right break-all">{info.email}</span>
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: '#aaa' }}>
              {sessionId
                ? 'No pudimos cargar el detalle de tu pago. Si ya completaste el checkout, tu suscripción quedó registrada: escríbenos por WhatsApp y te confirmamos al instante.'
                : 'Gracias por unirte a Agentia. Si acabas de pagar, guarda tu comprobante y contáctanos por WhatsApp para coordinar el alta.'}
            </p>
          )}
        </div>

        <div
          className="rounded-2xl border p-6 text-left space-y-4"
          style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
        >
          <p className="text-xs font-semibold tracking-widest" style={{ color: '#555' }}>
            PRÓXIMOS PASOS
          </p>
          <ol className="space-y-3 text-sm text-white list-decimal list-inside marker:font-bold marker:text-green-400">
            <li className="pl-1" style={{ color: '#d4d4d4' }}>
              Te contactaremos en menos de 24 horas
            </li>
            <li className="pl-1" style={{ color: '#d4d4d4' }}>
              Configuraremos tu sistema juntos
            </li>
            <li className="pl-1" style={{ color: '#d4d4d4' }}>
              Tu negocio estará automatizado en 7 días
            </li>
          </ol>
        </div>

        <a
          href={SUPPORT_WA}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 rounded-xl text-sm font-bold text-center transition-opacity hover:opacity-90 shadow-lg shadow-green-900/30"
          style={{ background: '#22c55e', color: '#000' }}
        >
          Hablar con soporte
        </a>

        <Link
          href="https://agentia.software"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: '#666' }}
        >
          Ir a agentia.software →
        </Link>
      </div>
    </div>
  );
}
