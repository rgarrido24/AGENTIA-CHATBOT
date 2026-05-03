import { notFound } from 'next/navigation';
import { ContratoForm } from './ContratoForm';

type PlanConfig = {
  clientName: string;
  planName: string;
  price: string;
  priceMonthly: number;
  setupFee: number;
  features: string[];
};

const PLANS: Record<string, PlanConfig> = {
  luciano: {
    clientName: 'Luciano',
    planName: 'Plan Profesional',
    price: '$20 USD / mes',
    priceMonthly: 20,
    setupFee: 20,
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
    price: '$30 USD / mes',
    priceMonthly: 30,
    setupFee: 30,
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
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ContratoPage({ params }: { params: { clientId: string } }) {
  const plan = PLANS[params.clientId];
  if (!plan) notFound();

  const today       = new Date();
  const renewal     = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const totalToday  = plan.setupFee + plan.priceMonthly;

  return (
    <main
      className="min-h-screen flex items-start justify-center px-4 py-12"
      style={{ background: '#000' }}
    >
      <div className="w-full max-w-xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-agentia-2026.png"
            alt="Agentia"
            className="h-12 w-12 rounded-2xl mx-auto object-contain"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-white">Contrato de servicio</h1>
            <p className="text-sm mt-1" style={{ color: '#666' }}>
              Revisá los términos y firmá para proceder al pago
            </p>
          </div>
        </div>

        {/* Plan summary */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
        >
          <div>
            <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: '#555' }}>
              PLAN CONTRATADO
            </p>
            <p className="text-xl font-bold text-white">{plan.planName}</p>
            <p className="text-2xl font-extrabold mt-1" style={{ color: '#22c55e' }}>
              {plan.price}
            </p>
          </div>
          <ul className="space-y-1.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm" style={{ color: '#aaa' }}>
                <span style={{ color: '#22c55e' }}>✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Billing summary */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
        >
          <p className="text-xs font-semibold tracking-widest" style={{ color: '#555' }}>
            RESUMEN DE COBROS
          </p>

          {/* Total hoy */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Cobro hoy</span>
              <span className="text-lg font-extrabold" style={{ color: '#22c55e' }}>
                ${totalToday} USD
              </span>
            </div>
            <p className="text-xs" style={{ color: '#555' }}>
              (${plan.setupFee} implementación + ${plan.priceMonthly} primer mes)
            </p>
          </div>

          <div className="border-t" style={{ borderColor: '#222' }} />

          {/* Renovación */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold" style={{ color: '#555' }}>RENOVACIÓN AUTOMÁTICA</p>
              <p className="text-sm text-white mt-0.5">{fmt(renewal)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold" style={{ color: '#555' }}>SUSCRIPCIÓN MENSUAL</p>
              <p className="text-sm font-bold text-white mt-0.5">${plan.priceMonthly} USD/mes</p>
            </div>
          </div>
        </div>

        {/* Interactive form */}
        <ContratoForm
          clientId={params.clientId}
          clientName={plan.clientName}
          planName={plan.planName}
          price={plan.price}
          setupFee={plan.setupFee}
          totalToday={totalToday}
          renewalIso={renewal.toISOString()}
        />

      </div>
    </main>
  );
}
