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

  // Proporcional = días restantes después de hoy / días del mes × mensualidad
  const proportionalAmount =
    Math.round(((daysInMonth - dayOfMonth) / daysInMonth) * plan.priceMonthly * 100) / 100;

  const totalToday =
    Math.round((plan.setupFee + proportionalAmount) * 100) / 100;

  const firstFullBillingIso = firstFullBilling.toISOString();

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

        {/* Dates & billing */}
        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
        >
          <p className="text-xs font-semibold tracking-widest" style={{ color: '#555' }}>
            FECHAS Y COBROS
          </p>

          {/* Cobro hoy: setupFee + proporcional */}
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: '#777' }}>COBRO HOY</p>

            <div className="flex items-center justify-between text-sm">
              <span style={{ color: '#aaa' }}>Implementación (pago único)</span>
              <span className="text-white font-medium">${plan.setupFee.toFixed(2)} USD</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span style={{ color: '#aaa' }}>
                Proporcional {fmtShort(today)}–{fmtShort(lastDayOfMonth)}
              </span>
              <span className="text-white font-medium">${proportionalAmount.toFixed(2)} USD</span>
            </div>

            <div
              className="flex items-center justify-between text-sm font-bold border-t pt-2"
              style={{ borderColor: '#333' }}
            >
              <span style={{ color: '#22c55e' }}>Total hoy</span>
              <span style={{ color: '#22c55e' }}>${totalToday.toFixed(2)} USD</span>
            </div>
          </div>

          {/* Suscripción mensual */}
          <div
            className="flex items-center justify-between pt-3 border-t"
            style={{ borderColor: '#222' }}
          >
            <div>
              <p className="text-xs" style={{ color: '#777' }}>Suscripción mensual desde</p>
              <p className="text-sm font-semibold text-white mt-0.5">{fmt(firstFullBilling)}</p>
            </div>
            <p className="text-sm font-bold shrink-0" style={{ color: '#22c55e' }}>
              ${plan.priceMonthly} USD/mes
            </p>
          </div>
        </div>

        {/* Interactive form (client component) */}
        <ContratoForm
          clientId={params.clientId}
          clientName={plan.clientName}
          planName={plan.planName}
          price={plan.price}
          setupFee={plan.setupFee}
          proportionalAmount={proportionalAmount}
          totalToday={totalToday}
          firstFullBillingIso={firstFullBillingIso}
        />

      </div>
    </main>
  );
}
