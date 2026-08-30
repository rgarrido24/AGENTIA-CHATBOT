export type IndustryId =
  | 'restaurant'
  | 'ecommerce'
  | 'services'
  | 'distribution'
  | 'agency'
  | 'other';

export type IndustryOption = {
  id: IndustryId;
  label: string;
};

export const INDUSTRIES: IndustryOption[] = [
  { id: 'restaurant', label: 'Restaurante / Café' },
  { id: 'ecommerce', label: 'Tienda / E-commerce' },
  { id: 'services', label: 'Servicios (salud, belleza, consultoría)' },
  { id: 'distribution', label: 'Distribución / Industria' },
  { id: 'agency', label: 'Agencia / Marketing' },
  { id: 'other', label: 'Telecomunicaciones' },
];

export type SliderDef = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: string;
  prefix?: string;
};

export type SimulatorResults = {
  monthlyLoss: number;
  automationScore: number;
  aiScore: number;
  opportunity: number;
  roi90: number;
  topAutomations: string[];
  risks: string[];
};

const AUTOMATIONS: Record<IndustryId, string[]> = {
  restaurant: [
    'Chatbot de reservas y menú en WhatsApp 24/7',
    'Recordatorios automáticos anti no-show',
    'CRM de clientes frecuentes con campañas de retorno',
  ],
  ecommerce: [
    'Recuperación de carritos abandonados por WhatsApp',
    'Sincronización Tiendanube + inventario + envíos',
    'Atención post-venta y tracking automatizado',
  ],
  services: [
    'Agenda inteligente con confirmación y recordatorios',
    'Calificación de leads antes de agendar cita',
    'Expediente digital y seguimiento por etapa',
  ],
  distribution: [
    'Cotizador IA con catálogo técnico integrado',
    'Alertas instantáneas de leads Meta a equipo de ventas',
    'Panel CRM con pipeline y asignación por zona',
  ],
  agency: [
    'Captura Meta + Zapier + notificación PWA a asesoras',
    'CRM individual por cuenta con métricas en tiempo real',
    'Automatización de briefs y seguimiento de campañas',
  ],
  other: [
    'Diagnóstico de cuellos de botella operativos',
    'Integración WhatsApp Business API + CRM',
    'Automatizaciones Zapier entre tus herramientas actuales',
  ],
};

const RISKS: Record<IndustryId, string[]> = {
  restaurant: [
    'Mesas vacías por reservas no confirmadas',
    'Clientes que escriben fuera de horario y no vuelven',
    'Equipo cocina/sala saturado en horas pico',
  ],
  ecommerce: [
    'Carritos abandonados sin recuperación',
    'Soporte manual que no escala en temporadas altas',
    'Errores de inventario entre canales',
  ],
  services: [
    'No-shows que dejan huecos en la agenda',
    'Leads fríos por respuesta tardía',
    'Información del paciente/cliente dispersa',
  ],
  distribution: [
    'Leads técnicos mal calificados que consumen al vendedor',
    'Cotizaciones lentas que pierden contra la competencia',
    'Datos en Excel sin visibilidad de pipeline',
  ],
  agency: [
    'Leads de campaña sin dueño claro',
    'Asesoras sin alertas en tiempo real',
    'Reportes manuales que retrasan decisiones',
  ],
  other: [
    'Costos operativos que crecen linealmente con ventas',
    'Dependencia de personas clave para tareas repetitivas',
    'Sin visibilidad de dónde se pierde el dinero',
  ],
};

export function getSlidersForIndustry(id: IndustryId): SliderDef[] {
  const map: Record<IndustryId, SliderDef[]> = {
    restaurant: [
      { id: 'msgs_day', label: 'Mensajes sin responder por día', min: 0, max: 200, step: 1, default: 28 },
      { id: 'ticket', label: 'Ticket promedio', min: 80, max: 2500, step: 10, default: 380, prefix: '$' },
      { id: 'manual_hours', label: 'Horas semanales en atención manual', min: 0, max: 40, step: 1, default: 14 },
    ],
    ecommerce: [
      { id: 'carts_week', label: 'Carritos abandonados por semana', min: 0, max: 500, step: 5, default: 45 },
      { id: 'aov', label: 'Valor promedio de orden', min: 100, max: 8000, step: 50, default: 890, prefix: '$' },
      { id: 'support_hours', label: 'Horas semanales en soporte manual', min: 0, max: 50, step: 1, default: 18 },
    ],
    services: [
      { id: 'leads_week', label: 'Leads nuevos por semana', min: 0, max: 150, step: 1, default: 22 },
      { id: 'service_price', label: 'Precio promedio del servicio', min: 200, max: 15000, step: 100, default: 1200, prefix: '$' },
      { id: 'no_shows', label: 'No-shows por mes', min: 0, max: 80, step: 1, default: 12 },
    ],
    distribution: [
      { id: 'leads_month', label: 'Leads entrantes por mes', min: 0, max: 400, step: 5, default: 65 },
      { id: 'deal_size', label: 'Ticket promedio de venta', min: 5000, max: 500000, step: 1000, default: 42000, prefix: '$' },
      { id: 'quote_hours', label: 'Horas semanales cotizando manual', min: 0, max: 45, step: 1, default: 16 },
    ],
    agency: [
      { id: 'leads_day', label: 'Leads de campaña por día', min: 0, max: 120, step: 1, default: 18 },
      { id: 'client_value', label: 'Valor mensual promedio por cliente', min: 3000, max: 120000, step: 500, default: 18000, prefix: '$' },
      { id: 'manual_reports', label: 'Horas semanales en reportes manuales', min: 0, max: 35, step: 1, default: 10 },
    ],
    other: [
      { id: 'tasks_day', label: 'Tareas repetitivas por día', min: 0, max: 100, step: 1, default: 25 },
      { id: 'hourly_cost', label: 'Costo hora equipo (MXN)', min: 80, max: 800, step: 10, default: 220, prefix: '$' },
      { id: 'manual_hours', label: 'Horas semanales en procesos manuales', min: 0, max: 50, step: 1, default: 20 },
    ],
  };
  return map[id];
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function computeResults(industry: IndustryId, values: Record<string, number>): SimulatorResults {
  const v = (key: string, fallback: number) => values[key] ?? fallback;

  let monthlyLoss = 0;
  let automationScore = 72;
  let aiScore = 68;

  switch (industry) {
    case 'restaurant': {
      const msgs = v('msgs_day', 28);
      const ticket = v('ticket', 380);
      const hours = v('manual_hours', 14);
      monthlyLoss = msgs * 0.11 * ticket * 30 + hours * 4.33 * 195;
      automationScore = clamp(100 - hours * 2.2 - msgs * 0.22, 18, 94);
      aiScore = clamp(45 + msgs * 0.28 + hours * 0.9, 25, 97);
      break;
    }
    case 'ecommerce': {
      const carts = v('carts_week', 45);
      const aov = v('aov', 890);
      const hours = v('support_hours', 18);
      monthlyLoss = carts * 0.18 * aov * 4.33 + hours * 4.33 * 210;
      automationScore = clamp(100 - hours * 2 - carts * 0.08, 20, 95);
      aiScore = clamp(50 + carts * 0.12 + hours * 0.7, 30, 98);
      break;
    }
    case 'services': {
      const leads = v('leads_week', 22);
      const price = v('service_price', 1200);
      const noShows = v('no_shows', 12);
      monthlyLoss = leads * 0.14 * price * 4.33 + noShows * price * 0.85;
      automationScore = clamp(100 - noShows * 1.4 - leads * 0.35, 22, 93);
      aiScore = clamp(48 + leads * 0.4 + noShows * 0.6, 28, 96);
      break;
    }
    case 'distribution': {
      const leads = v('leads_month', 65);
      const deal = v('deal_size', 42000);
      const hours = v('quote_hours', 16);
      monthlyLoss = leads * 0.09 * deal + hours * 4.33 * 280;
      automationScore = clamp(100 - hours * 2.5 - leads * 0.06, 24, 92);
      aiScore = clamp(52 + leads * 0.15 + hours * 1.1, 35, 98);
      break;
    }
    case 'agency': {
      const leads = v('leads_day', 18);
      const value = v('client_value', 18000);
      const hours = v('manual_reports', 10);
      monthlyLoss = leads * 0.08 * value * 30 + hours * 4.33 * 250;
      automationScore = clamp(100 - hours * 2.8 - leads * 0.35, 20, 91);
      aiScore = clamp(55 + leads * 0.32 + hours * 1.2, 32, 97);
      break;
    }
    default: {
      const tasks = v('tasks_day', 25);
      const cost = v('hourly_cost', 220);
      const hours = v('manual_hours', 20);
      monthlyLoss = tasks * 12 * cost * 4.33 + hours * 4.33 * cost;
      automationScore = clamp(100 - hours * 2.1 - tasks * 0.45, 15, 90);
      aiScore = clamp(42 + tasks * 0.5 + hours * 1.3, 25, 95);
    }
  }

  const opportunity = Math.round(monthlyLoss * 0.62);
  const investment = 38000 + monthlyLoss * 0.08;
  const roi90 = clamp(Math.round(((opportunity * 3) / investment) * 100), 35, 420);

  return {
    monthlyLoss: Math.round(monthlyLoss),
    automationScore: Math.round(automationScore),
    aiScore: Math.round(aiScore),
    opportunity,
    roi90,
    topAutomations: AUTOMATIONS[industry],
    risks: RISKS[industry],
  };
}

export function formatMxn(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount);
}
