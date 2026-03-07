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
