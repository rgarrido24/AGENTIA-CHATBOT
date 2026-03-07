import { getMongoDb } from '../../lib/mongodb';

export type TimeRange = { start: string; end: string };

export type DaySchedule = {
  enabled: boolean;
  ranges: TimeRange[];
};

export type BusinessSchedule = {
  dom: DaySchedule;
  lun: DaySchedule;
  mar: DaySchedule;
  mie: DaySchedule;
  jue: DaySchedule;
  vie: DaySchedule;
  sab: DaySchedule;
};

export type BusinessSettings = {
  clientId: string;
  schedule: BusinessSchedule;
  slotDurationMinutes: number;
  breakBetweenMinutes: number;
  updatedAt?: Date;
};

const DAY_KEYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const;

const defaultDaySchedule: DaySchedule = {
  enabled: false,
  ranges: [{ start: '09:00', end: '18:00' }],
};

const defaultSchedule: BusinessSchedule = {
  dom: { ...defaultDaySchedule },
  lun: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
  mar: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
  mie: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
  jue: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
  vie: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
  sab: { enabled: false, ranges: [{ start: '09:00', end: '14:00' }] },
};

export const DEFAULT_SETTINGS: Omit<BusinessSettings, 'clientId'> = {
  schedule: defaultSchedule,
  slotDurationMinutes: 60,
  breakBetweenMinutes: 10,
};

export function getDayKey(date: Date): (typeof DAY_KEYS)[number] {
  const day = date.getDay();
  return DAY_KEYS[day];
}

export async function getBusinessSettings(clientId: string): Promise<BusinessSettings> {
  const normalized = clientId.trim().toLowerCase();
  const db = await getMongoDb();
  const doc = await db.collection<BusinessSettings>('business_settings').findOne({ clientId: normalized });
  if (!doc) {
    return { clientId: normalized, ...DEFAULT_SETTINGS };
  }
  return {
    clientId: doc.clientId,
    schedule: doc.schedule ?? defaultSchedule,
    slotDurationMinutes: doc.slotDurationMinutes ?? 60,
    breakBetweenMinutes: doc.breakBetweenMinutes ?? 10,
    updatedAt: doc.updatedAt,
  };
}

export async function saveBusinessSettings(params: {
  clientId: string;
  schedule?: BusinessSchedule;
  slotDurationMinutes?: number;
  breakBetweenMinutes?: number;
}): Promise<BusinessSettings> {
  const clientId = params.clientId.trim().toLowerCase();
  const db = await getMongoDb();
  const now = new Date();
  const update: Partial<BusinessSettings> = {
    updatedAt: now,
  };
  if (params.schedule) update.schedule = params.schedule;
  if (params.slotDurationMinutes != null) update.slotDurationMinutes = params.slotDurationMinutes;
  if (params.breakBetweenMinutes != null) update.breakBetweenMinutes = params.breakBetweenMinutes;

  await db.collection<BusinessSettings>('business_settings').updateOne(
    { clientId },
    { $set: update },
    { upsert: true }
  );
  return getBusinessSettings(clientId);
}

function parseTime(t: string): { h: number; m: number } {
  const [ha, ma] = t.split(':').map(Number);
  return { h: ha ?? 0, m: ma ?? 0 };
}

export function getSlotsFromSchedule(
  date: Date,
  settings: BusinessSettings
): { start: Date; end: Date }[] {
  const dayKey = getDayKey(date);
  const daySchedule = settings.schedule[dayKey];
  if (!daySchedule?.enabled || !daySchedule.ranges?.length) return [];

  const slots: { start: Date; end: Date }[] = [];
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  for (const range of daySchedule.ranges) {
    const { h: startH, m: startM } = parseTime(range.start);
    const { h: endH, m: endM } = parseTime(range.end);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const slotDuration = settings.slotDurationMinutes;
    const breakBetween = settings.breakBetweenMinutes;
    const step = slotDuration + breakBetween;

    for (let mins = startMinutes; mins + slotDuration <= endMinutes; mins += step) {
      const start = new Date(d);
      start.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + slotDuration);
      slots.push({ start, end });
    }
  }
  return slots;
}
