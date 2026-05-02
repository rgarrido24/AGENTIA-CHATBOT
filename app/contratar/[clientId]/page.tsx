import { notFound } from 'next/navigation';
import { ContratoForm } from './ContratoForm';

type PlanConfig = {
  clientName: string;
  planName: string;
  price: string;
  features: string[];
};

const PLANS: Record<string, PlanConfig> = {
  luciano: {
    clientName: 'Luciano',
    planName: 'Plan Profesional',
    price: '$20 USD / mes',
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

export default function ContratoPage({ params }: { params: { clientId: string } }) {
  const plan = PLANS[params.clientId];
  if (!plan) notFound();

  const today = new Date();
  const nextBilling = new Date(today);
  nextBilling.setMonth(nextBilling.getMonth() + 1);

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

        {/* Dates */}
        <div
          className="rounded-2xl border p-5 grid grid-cols-2 gap-4"
          style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
        >
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#555' }}>
              FECHA DE INICIO
            </p>
            <p className="text-sm text-white">{fmt(today)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#555' }}>
              PRIMER COBRO COMPLETO
            </p>
            <p className="text-sm text-white">{fmt(nextBilling)}</p>
          </div>
        </div>

        {/* Interactive form (client component) */}
        <ContratoForm
          clientId={params.clientId}
          clientName={plan.clientName}
          planName={plan.planName}
          price={plan.price}
        />

      </div>
    </main>
  );
}
