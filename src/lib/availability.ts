export type SlotRange = { start: string; end: string };

const DAY_START = 9 * 60; // 9:00 en minutos del día
const DAY_END = 20 * 60;   // 20:00
const SLOT_STEP = 15;      // minutos entre slots a probar

function overlaps(a: SlotRange, b: SlotRange): boolean {
  const aStart = new Date(a.start).getTime();
  const aEnd = new Date(a.end).getTime();
  const bStart = new Date(b.start).getTime();
  const bEnd = new Date(b.end).getTime();
  return aStart < bEnd && bStart < aEnd;
}

export function countOverlapping(
  events: SlotRange[],
  start: string,
  end: string
): number {
  let count = 0;
  for (const ev of events) {
    if (overlaps(ev, { start, end })) count++;
  }
  return count;
}

export function isSlotAvailable(
  events: SlotRange[],
  start: string,
  end: string,
  capacidadSimultanea: number
): boolean {
  return countOverlapping(events, start, end) < capacidadSimultanea;
}

function addMinutes(iso: string, minutes: number): string {
  const d = new Date(iso);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString();
}

/**
 * Propone dos horarios adyacentes al solicitado: 1 h antes y 1 h después (ej. 3pm → 2pm y 4pm).
 * Si alguno choca con eventos existentes, intenta rellenar con slots libres cercanos.
 */
export function proposeAdjacentAlternatives(
  requestedStartIso: string,
  durationMinutes: number,
  events: SlotRange[],
  capacidadSimultanea: number
): { start: string; end: string }[] {
  const addM = (iso: string, m: number) => {
    const d = new Date(iso);
    d.setUTCMinutes(d.getUTCMinutes() + m);
    return d.toISOString();
  };
  const candidates = [addM(requestedStartIso, -60), addM(requestedStartIso, 60)];
  const out: { start: string; end: string }[] = [];
  const seen = new Set<string>();
  for (const startIso of candidates) {
    const endIso = addM(startIso, durationMinutes);
    const minOfDay = minutesOfDayMexico(startIso);
    if (minOfDay < DAY_START || minOfDay + durationMinutes > DAY_END) continue;
    if (!isSlotAvailable(events, startIso, endIso, capacidadSimultanea)) continue;
    if (seen.has(startIso)) continue;
    seen.add(startIso);
    out.push({ start: startIso, end: endIso });
  }
  let probe = new Date(requestedStartIso);
  for (let k = 0; k < 80 && out.length < 2; k++) {
    const startIso = probe.toISOString();
    const endIso = addM(startIso, durationMinutes);
    const minOfDay = minutesOfDayMexico(startIso);
    if (minOfDay >= DAY_START && minOfDay + durationMinutes <= DAY_END) {
      if (isSlotAvailable(events, startIso, endIso, capacidadSimultanea) && !seen.has(startIso)) {
        seen.add(startIso);
        out.push({ start: startIso, end: endIso });
      }
    }
    probe = new Date(probe.getTime() + SLOT_STEP * 60 * 1000);
  }
  return out.slice(0, 2);
}

function minutesOfDayMexico(iso: string): number {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    timeZone: 'America/Mexico_City',
  }).formatToParts(d);
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const min = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  return h * 60 + min;
}

export function getNextAvailableSlots(
  events: SlotRange[],
  fromIso: string,
  capacidadSimultanea: number,
  durationMinutes: number,
  maxSlots = 2
): string[] {
  const result: string[] = [];
  let from = new Date(fromIso);
  if (from.getUTCHours() * 60 + from.getUTCMinutes() < DAY_START) {
    from.setUTCHours(9, 0, 0, 0);
  }
  let checked = 0;
  const maxChecks = 200;
  while (result.length < maxSlots && checked < maxChecks) {
    const startIso = from.toISOString();
    const endIso = addMinutes(startIso, durationMinutes);
    const minOfDay = from.getUTCHours() * 60 + from.getUTCMinutes();
    if (minOfDay >= DAY_START && minOfDay + durationMinutes <= DAY_END) {
      if (isSlotAvailable(events, startIso, endIso, capacidadSimultanea)) {
        result.push(startIso);
      }
    }
    from = new Date(from.getTime() + SLOT_STEP * 60 * 1000);
    if (from.getUTCHours() * 60 + from.getUTCMinutes() >= DAY_END) {
      from.setUTCDate(from.getUTCDate() + 1);
      from.setUTCHours(9, 0, 0, 0);
    }
    checked++;
  }
  return result.slice(0, maxSlots);
}
