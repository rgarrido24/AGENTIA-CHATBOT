export const LOYALTY_RESTAURANT_ID = 'masa-madre';

export const POINTS_PER_10_MXN = 1;
export const MXN_PER_POINT_UNIT = 10;

export const REDEMPTION_OPTIONS = [
  { id: 'descuento-50', puntos: 100, label: '$50 MXN de descuento', emoji: '💰' },
  { id: 'cafe-gratis', puntos: 200, label: 'Café gratis', emoji: '☕' },
  { id: 'desayuno-gratis', puntos: 500, label: 'Desayuno gratis', emoji: '🥐' },
] as const;

export type RedemptionId = (typeof REDEMPTION_OPTIONS)[number]['id'];

export type LoyaltyVisit = {
  fecha: string;
  monto: number;
  puntos: number;
  tipo: 'consumo' | 'canje';
  nota?: string;
};

export type LoyaltyCustomer = {
  id: string;
  nombre: string;
  telefono: string;
  puntos: number;
  visitas: LoyaltyVisit[];
  ultimo_consumo: string | null;
  restaurante_id: string;
};

export const COLORS = {
  cream: '#faf7f2',
  dark: '#2C1810',
  gold: '#C9A84C',
};

export function puntosPorMonto(monto: number): number {
  return Math.floor(monto / MXN_PER_POINT_UNIT);
}

export function nextReward(puntos: number) {
  return REDEMPTION_OPTIONS.find((r) => puntos < r.puntos) ?? REDEMPTION_OPTIONS[REDEMPTION_OPTIONS.length - 1]!;
}

export function progressToNextReward(puntos: number) {
  const target = nextReward(puntos);
  const prev =
    [...REDEMPTION_OPTIONS].reverse().find((r) => puntos >= r.puntos)?.puntos ?? 0;
  const range = target.puntos - prev;
  const current = puntos - prev;
  return {
    target,
    percent: range > 0 ? Math.min(100, Math.round((current / range) * 100)) : 100,
    remaining: Math.max(0, target.puntos - puntos),
  };
}

export function formatWhatsAppBalance(customer: LoyaltyCustomer): string {
  const { target, remaining } = progressToNextReward(customer.puntos);
  return [
    `🥐 *Masa Madre — Tus puntos*`,
    ``,
    `Hola ${customer.nombre.split(' ')[0]}!`,
    `Saldo actual: *${customer.puntos} puntos*`,
    ``,
    `Próximo premio: ${target.emoji} ${target.label}`,
    `Te faltan *${remaining} puntos*`,
    ``,
    `Escribe *CANJEAR* para ver opciones`,
    `Escribe *HISTORIAL* para ver visitas`,
  ].join('\n');
}

export function formatWhatsAppRedeem(customer: LoyaltyCustomer): string {
  const lines = [
    `🎁 *Opciones de canje — Masa Madre*`,
    ``,
    `Tienes *${customer.puntos} puntos* disponibles:`,
    ``,
  ];
  for (const opt of REDEMPTION_OPTIONS) {
    const ok = customer.puntos >= opt.puntos;
    lines.push(`${ok ? '✅' : '🔒'} ${opt.emoji} *${opt.label}* — ${opt.puntos} pts`);
  }
  lines.push('', 'Acércate al mostrador para canjear tu premio 🙌');
  return lines.join('\n');
}

export function formatWhatsAppHistory(customer: LoyaltyCustomer): string {
  const recent = customer.visitas.slice(0, 5);
  const lines = [`📋 *Últimas visitas — Masa Madre*`, ``];
  if (recent.length === 0) {
    lines.push('Aún no tienes visitas registradas.');
  } else {
    for (const v of recent) {
      const d = new Date(v.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
      if (v.tipo === 'canje') {
        lines.push(`• ${d} — Canje: ${v.nota ?? 'premio'} (-${v.puntos} pts)`);
      } else {
        lines.push(`• ${d} — Consumo $${v.monto} (+${v.puntos} pts)`);
      }
    }
  }
  return lines.join('\n');
}

export function formatWhatsAppEarned(nombre: string, earned: number, total: number): string {
  return [
    `🎉 ¡Ganaste ${earned} puntos!`,
    `Total acumulado: ${total} puntos`,
    `Masa Madre te espera pronto 🥐`,
  ].join('\n');
}

export function formatWhatsAppRegister(nombre: string): string {
  return [
    `¡Bienvenido/a a Masa Madre, ${nombre.split(' ')[0]}! 🥐`,
    `Te registramos en nuestro programa de lealtad.`,
    `Cada $10 MXN = 1 punto.`,
    ``,
    `Saldo actual: *0 puntos*`,
    `Escribe *PUNTOS* cuando quieras consultar tu saldo.`,
  ].join('\n');
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const DEMO_CUSTOMERS: LoyaltyCustomer[] = [
  {
    id: 'mm-001',
    nombre: 'María López',
    telefono: '9991234567',
    puntos: 156,
    ultimo_consumo: daysAgo(2),
    restaurante_id: LOYALTY_RESTAURANT_ID,
    visitas: [
      { fecha: daysAgo(2), monto: 230, puntos: 23, tipo: 'consumo' },
      { fecha: daysAgo(9), monto: 189, puntos: 18, tipo: 'consumo' },
      { fecha: daysAgo(16), monto: 310, puntos: 31, tipo: 'consumo' },
      { fecha: daysAgo(24), monto: 219, puntos: 21, tipo: 'consumo' },
    ],
  },
  {
    id: 'mm-002',
    nombre: 'Carlos Ruiz',
    telefono: '9992345678',
    puntos: 487,
    ultimo_consumo: daysAgo(1),
    restaurante_id: LOYALTY_RESTAURANT_ID,
    visitas: [
      { fecha: daysAgo(1), monto: 450, puntos: 45, tipo: 'consumo' },
      { fecha: daysAgo(5), monto: 380, puntos: 38, tipo: 'consumo' },
      { fecha: daysAgo(12), monto: 520, puntos: 52, tipo: 'consumo' },
      { fecha: daysAgo(20), monto: 200, puntos: 20, tipo: 'canje', nota: 'Café gratis' },
    ],
  },
  {
    id: 'mm-003',
    nombre: 'Ana Martínez',
    telefono: '9993456789',
    puntos: 89,
    ultimo_consumo: daysAgo(4),
    restaurante_id: LOYALTY_RESTAURANT_ID,
    visitas: [
      { fecha: daysAgo(4), monto: 127, puntos: 12, tipo: 'consumo' },
      { fecha: daysAgo(11), monto: 219, puntos: 21, tipo: 'consumo' },
      { fecha: daysAgo(18), monto: 189, puntos: 18, tipo: 'consumo' },
    ],
  },
  {
    id: 'mm-004',
    nombre: 'Roberto Sánchez',
    telefono: '9994567890',
    puntos: 23,
    ultimo_consumo: daysAgo(3),
    restaurante_id: LOYALTY_RESTAURANT_ID,
    visitas: [{ fecha: daysAgo(3), monto: 230, puntos: 23, tipo: 'consumo' }],
  },
  {
    id: 'mm-005',
    nombre: 'Sofía Hernández',
    telefono: '9995678901',
    puntos: 312,
    ultimo_consumo: daysAgo(6),
    restaurante_id: LOYALTY_RESTAURANT_ID,
    visitas: [
      { fecha: daysAgo(6), monto: 289, puntos: 28, tipo: 'consumo' },
      { fecha: daysAgo(14), monto: 197, puntos: 19, tipo: 'consumo' },
      { fecha: daysAgo(22), monto: 100, puntos: 100, tipo: 'canje', nota: '$50 descuento' },
      { fecha: daysAgo(30), monto: 410, puntos: 41, tipo: 'consumo' },
    ],
  },
];

export const DEMO_STORAGE_KEY = 'masa-madre-loyalty-demo';

export function computeStats(customers: LoyaltyCustomer[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let puntosEmitidos = 0;
  let canjesMes = 0;
  let activos = 0;

  for (const c of customers) {
    if (c.ultimo_consumo && new Date(c.ultimo_consumo) >= thirtyDaysAgo) activos++;
    for (const v of c.visitas) {
      const fecha = new Date(v.fecha);
      if (fecha >= monthStart) {
        if (v.tipo === 'consumo') puntosEmitidos += v.puntos;
        else canjesMes++;
      }
    }
  }

  return {
    clientesActivos: activos,
    puntosEmitidos,
    canjesMes,
    totalClientes: customers.length,
  };
}

export function handleWhatsAppCommand(
  text: string,
  customer: LoyaltyCustomer | undefined,
  phone: string,
): { reply: string; customer?: LoyaltyCustomer; isNew?: boolean } {
  const cmd = text.trim().toUpperCase();

  if (cmd === 'PUNTOS') {
    if (!customer) {
      const nuevo: LoyaltyCustomer = {
        id: `mm-${Date.now()}`,
        nombre: `Cliente ${phone.slice(-4)}`,
        telefono: phone,
        puntos: 0,
        visitas: [],
        ultimo_consumo: null,
        restaurante_id: LOYALTY_RESTAURANT_ID,
      };
      return { reply: formatWhatsAppRegister(nuevo.nombre), customer: nuevo, isNew: true };
    }
    return { reply: formatWhatsAppBalance(customer) };
  }

  if (cmd === 'CANJEAR') {
    if (!customer) {
      return { reply: 'Primero escribe *PUNTOS* para registrarte en el programa 🥐' };
    }
    return { reply: formatWhatsAppRedeem(customer) };
  }

  if (cmd === 'HISTORIAL') {
    if (!customer) {
      return { reply: 'Aún no tienes historial. Escribe *PUNTOS* para registrarte.' };
    }
    return { reply: formatWhatsAppHistory(customer) };
  }

  return {
    reply: 'Comandos disponibles:\n• *PUNTOS* — ver saldo\n• *CANJEAR* — ver premios\n• *HISTORIAL* — últimas visitas',
  };
}
