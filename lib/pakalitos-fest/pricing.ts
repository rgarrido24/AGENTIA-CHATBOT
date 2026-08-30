import {
  LOYALTY_EVERY_HOURS,
  LOYALTY_REWARD_HOURS,
  PRICE_TIERS,
  RATE_1H_NINERA,
  RATE_1H_SOLO,
} from './types';

export function onlyDigits(phone: string) {
  return phone.replace(/\D/g, '');
}

export function formatPhone(digits: string) {
  const d = onlyDigits(digits);
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 12 && d.startsWith('52')) {
    return `+52 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  }
  return digits.trim();
}

export function elapsedMs(from: number, now = Date.now()) {
  return Math.max(0, now - from);
}

export function formatTimer(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function formatMinutesHuman(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/** Horas cobrables: redondeo hacia arriba, mínimo 1 si jugó algo */
export function billableHours(minutesPlayed: number) {
  if (minutesPlayed <= 0) return 1;
  return Math.max(1, Math.ceil(minutesPlayed / 60));
}

/**
 * Tarifa según lista:
 * 1h $100 / niñera $170 · 2h $180 / $300 · 3h $260 / $450
 * Más de 3h: paquete 3h + hora extra a tarifa 1h.
 */
export function quoteCash(minutesPlayed: number, conNinera: boolean) {
  const hours = billableHours(minutesPlayed);
  let amount = 0;

  if (hours <= 3) {
    const tier = PRICE_TIERS.find((t) => t.hours === hours)!;
    amount = conNinera ? tier.ninera : tier.solo;
  } else {
    const base = PRICE_TIERS[2]!;
    const extra = hours - 3;
    amount = (conNinera ? base.ninera : base.solo) + extra * (conNinera ? RATE_1H_NINERA : RATE_1H_SOLO);
  }

  return { hours, amount };
}

/** Horas a descontar de membresía (mínimo 0.25 h) */
export function hoursToDebit(minutesPlayed: number) {
  if (minutesPlayed <= 0) return 0.25;
  const h = Math.max(0.25, minutesPlayed / 60);
  return Math.round(h * 100) / 100;
}

export function loyaltyProgress(horasLealtad: number) {
  const inCycle = horasLealtad % LOYALTY_EVERY_HOURS;
  const remaining = Math.round((LOYALTY_EVERY_HOURS - inCycle) * 100) / 100 || LOYALTY_EVERY_HOURS;
  return { inCycle: Math.round(inCycle * 100) / 100, remaining, every: LOYALTY_EVERY_HOURS };
}

/** Cuántas horas premio se ganan al sumar `horasNuevas` a la lealtad actual */
export function loyaltyRewardHours(horasLealtadAntes: number, horasNuevas: number) {
  const before = Math.floor(horasLealtadAntes / LOYALTY_EVERY_HOURS);
  const after = Math.floor((horasLealtadAntes + horasNuevas) / LOYALTY_EVERY_HOURS);
  return Math.max(0, after - before) * LOYALTY_REWARD_HOURS;
}
