import { notFound } from 'next/navigation';
import { ContratoForm } from './ContratoForm';

type PlanConfig = {
  clientName: string;
  planName: string;
  price: string;
  priceMonthly?: number;
  features: string[];
};

const PLANS: Record<string, PlanConfig> = {
  luciano: {
    clientName: 'Luciano',
    planName: 'Plan Profesional',
    price: '$20 USD / mes',
    priceMonthly: 20,
    features: [
      'Chatbot IA para WhatsApp',
      'Gestión de leads y conversaciones',
      'Panel de control completo',
      'Reportes y métricas en tiempo real',
      'Soporte técnico incluido',
    ],
  },
  decohouse: {
    clientName: 'Deco House',
    planName: 'Plan acordado',
    price: 'Precio acordado',
    features: [
      'Chatbot IA para WhatsApp (Elisa)',
      'Asistente de cotizaciones automático',
      'Gestión de leads y conversaciones',
      'Panel de control completo',
      'Soporte técnico incluido',
    ],
  },
};

function fmt(d: Date) {
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtShort(d: Date) {
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

export default function ContratoPage({ params }: { params: { clientId: string } }) {
  const plan = PLANS[params.clientId];
  if (!plan) notFound();

  const today          = new Date();
  const dayOfMonth     = today.getDate();
  const daysInMonth    = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const firstFullBilling = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const proportionalAmount =
    plan.priceMonthly != null
      ? Math.round((dayOfMonth / daysInMonth) * plan.priceMonthly * 100) / 100
      : null;

  const firstFullBillingIso = firstFullBilling.toISOString();

  return (
    <main
      className="min-h-screen flex items-start justify-center px-4 py-12"
      style={{ background: '#000' }}
    >
      <div className="w-full max-w-xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold tracking-widest" style={{ color: '#CCFF00' }}>
            AGENTIA
          </p>
          <h1 className="text-2xl font-extrabold text-white">Contrato de servicio</h1>
          <p className="text-sm" style={{ color: '#666' }}>
            Revisá los términos y firmá para proceder al pago
          </p>
        </div>

        {/* Plan summary */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
        >
          <div>
            <p
              className="text-xs font-semibold tracking-widest mb-2"
              style={{ color: '#555' }}
            >
              PLAN CONTRATADO
            </p>
            <p className="text-xl font-bold text-white">{plan.planName}</p>
            <p className="text-2xl font-extrabold mt-1" style={{ color: '#CCFF00' }}>
              {plan.price}
            </p>
          </div>
          <ul className="space-y-1.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm" style={{ color: '#aaa' }}>
                <span style={{ color: '#CCFF00' }}>✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Dates & billing */}
        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
        >
          <p className="text-xs font-semibold tracking-widest" style={{ color: '#555' }}>
            FECHAS Y COBROS
          </p>

          {proportionalAmount != null ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs" style={{ color: '#777' }}>Cobro hoy (proporcional)</p>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                    {fmtShort(today)} al {fmtShort(lastDayOfMonth)}
                  </p>
                </div>
                <p className="text-sm font-bold text-white shrink-0">
                  ${proportionalAmount.toFixed(2)} USD
                </p>
              </div>
              <div className="border-t pt-3 flex items-start justify-between gap-3" style={{ borderColor: '#222' }}>
                <div>
                  <p className="text-xs" style={{ color: '#777' }}>Suscripción mensual desde</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{fmt(firstFullBilling)}</p>
                </div>
                <p className="text-sm font-bold shrink-0" style={{ color: '#CCFF00' }}>
                  ${plan.priceMonthly} USD/mes
                </p>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs mb-1" style={{ color: '#555' }}>FECHA DE INICIO</p>
                <p className="text-sm text-white">{fmt(today)}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#555' }}>PRIMER COBRO COMPLETO</p>
                <p className="text-sm text-white">{fmt(firstFullBilling)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Interactive form (client component) */}
        <ContratoForm
          clientId={params.clientId}
          clientName={plan.clientName}
          planName={plan.planName}
          price={plan.price}
          proportionalAmount={proportionalAmount ?? undefined}
          firstFullBillingIso={firstFullBillingIso}
        />

      </div>
    </main>
  );
}
