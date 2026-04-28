import Stripe from 'stripe';

// Lazy singleton — defer construction to request time so the build never needs
// STRIPE_SECRET_KEY. The key is validated on first actual API call.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _stripeInstance: any;
function getInstance() {
  if (!_stripeInstance) {
    _stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return _stripeInstance;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe: any = new Proxy({} as object, {
  get(_, prop) {
    const inst = getInstance();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    const v = inst[prop];
    return typeof v === 'function' ? v.bind(inst) : v;
  },
});

export type PlanKey = 'starter' | 'profesional' | 'premium';
export type Moneda = 'mxn' | 'usd';

export const PLAN_DATA: Record<PlanKey, {
  nombre: string;
  precioMXN: number;
  precioUSD: number;
  activacionMXN: number;
  activacionUSD: number;
  badge: string | null;
  mensajes: string;
  registros: string;
  features: string[];
}> = {
  starter: {
    nombre: 'Starter',
    precioMXN: 399,
    precioUSD: 25,
    activacionMXN: 500,
    activacionUSD: 30,
    badge: null,
    mensajes: '300 msgs WhatsApp/mes',
    registros: '30 registros',
    features: [
      'Chatbot IA 24/7 vía WhatsApp',
      'Captura automática de leads',
      'Respuestas personalizadas al giro',
      'Panel de administración',
      'Reportes básicos',
      'Soporte por email',
    ],
  },
  profesional: {
    nombre: 'Profesional',
    precioMXN: 599,
    precioUSD: 35,
    activacionMXN: 500,
    activacionUSD: 30,
    badge: '⭐ MÁS POPULAR',
    mensajes: '1,500 msgs WhatsApp/mes',
    registros: 'Ilimitados',
    features: [
      'Todo lo del plan Starter',
      'CRM integrado con pipeline',
      'Seguimiento automático de leads',
      'Campañas de reactivación',
      'Integración con FB/IG Ads',
      'Analítica avanzada',
      'Soporte prioritario',
    ],
  },
  premium: {
    nombre: 'Premium',
    precioMXN: 899,
    precioUSD: 55,
    activacionMXN: 500,
    activacionUSD: 30,
    badge: null,
    mensajes: 'Mensajes ilimitados',
    registros: 'Ilimitados',
    features: [
      'Todo lo del plan Profesional',
      'Múltiples agentes IA',
      'Agenda y reservas automáticas',
      'Integraciones personalizadas',
      'Onboarding dedicado',
      'Manager de cuenta asignado',
      'SLA de respuesta 4h',
    ],
  },
};
