import { getMongoDb } from '../../lib/mongodb';

export type AppointmentStatus = 'confirmed' | 'cancelled';

export type Appointment = {
  _id?: unknown;
  clientId: string;
  slotStart: Date;
  slotEnd: Date;
  status: AppointmentStatus;
  senderId: string;
  senderName?: string;
  platform: string;
  pageId: string;
  googleEventId?: string;
  reminderQueuedAt?: Date;
  reminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export function parseDate(dateStr: string): Date {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new Error('Fecha inválida');
  return d;
}

export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getSlotsForDate(
  clientId: string,
  date: Date
): Promise<{ start: Date; end: Date }[]> {
  const { getBusinessSettings, getSlotsFromSchedule } = await import('./business-settings');
  const settings = await getBusinessSettings(clientId);
  return getSlotsFromSchedule(date, settings);
}

export async function getBookedSlots(
  clientId: string,
  date: Date
): Promise<{ start: Date; end: Date }[]> {
  const db = await getMongoDb();
  const dateStr = toDateKey(date);
  const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
  const endOfDay = new Date(dateStr + 'T23:59:59.999Z');
  const docs = await db
    .collection<Appointment>('appointments')
    .find({
      clientId: clientId.trim().toLowerCase(),
      status: 'confirmed',
      slotStart: { $lt: endOfDay },
      slotEnd: { $gt: startOfDay },
    })
    .toArray();
  return docs.map((d) => ({ start: d.slotStart, end: d.slotEnd }));
}

export async function getAvailableSlots(
  clientId: string,
  date: Date
): Promise<{ start: Date; end: Date }[]> {
  const allSlots = await getSlotsForDate(clientId, date);
  const booked = await getBookedSlots(clientId, date);
  return allSlots.filter((s) => {
    const overlaps = booked.some(
      (b) => s.start.getTime() < b.end.getTime() && s.end.getTime() > b.start.getTime()
    );
    return !overlaps;
  });
}

export async function isSlotAvailable(
  clientId: string,
  slotStart: Date,
  slotEnd: Date
): Promise<boolean> {
  const db = await getMongoDb();
  const count = await db.collection<Appointment>('appointments').countDocuments({
    clientId: clientId.trim().toLowerCase(),
    status: 'confirmed',
    slotStart: { $lt: slotEnd },
    slotEnd: { $gt: slotStart },
  });
  return count === 0;
}

export async function createAppointment(params: {
  clientId: string;
  slotStart: Date;
  slotEnd: Date;
  senderId: string;
  senderName?: string;
  platform: string;
  pageId: string;
  googleEventId?: string;
}): Promise<Appointment> {
  const clientId = params.clientId.trim().toLowerCase();
  const available = await isSlotAvailable(clientId, params.slotStart, params.slotEnd);
  if (!available) {
    throw new Error('El horario ya no está disponible');
  }
  const db = await getMongoDb();
  const now = new Date();
  const doc: Appointment = {
    clientId,
    slotStart: params.slotStart,
    slotEnd: params.slotEnd,
    status: 'confirmed',
    senderId: params.senderId,
    senderName: params.senderName,
    platform: params.platform,
    pageId: params.pageId,
    googleEventId: params.googleEventId,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('appointments').insertOne(doc as Record<string, unknown>);
  return doc;
}

export async function cancelAppointment(
  appointmentId: string,
  clientId?: string
): Promise<boolean> {
  const { ObjectId } = await import('mongodb');
  let oid: import('mongodb').ObjectId;
  try {
    oid = new ObjectId(appointmentId);
  } catch {
    return false;
  }
  const db = await getMongoDb();
  const filter: Record<string, unknown> = { _id: oid, status: 'confirmed' };
  if (clientId) filter.clientId = clientId.trim().toLowerCase();
  const result = await db.collection<Appointment>('appointments').updateOne(
    filter,
    { $set: { status: 'cancelled', updatedAt: new Date() } }
  );
  return (result.modifiedCount ?? 0) > 0;
}

export async function getAppointmentById(appointmentId: string): Promise<Appointment | null> {
  const { ObjectId } = await import('mongodb');
  try {
    const oid = new ObjectId(appointmentId);
    const db = await getMongoDb();
    return await db.collection<Appointment>('appointments').findOne({ _id: oid });
  } catch {
    return null;
  }
}

export async function getLastAppointmentBySender(
  senderId: string,
  pageId: string,
  clientId: string
): Promise<Appointment | null> {
  const db = await getMongoDb();
  return db
    .collection<Appointment>('appointments')
    .findOne(
      { senderId, pageId, clientId: clientId.trim().toLowerCase(), status: 'confirmed' },
      { sort: { createdAt: -1 } }
    );
}

export async function getAppointmentsForReminder(
  withinMinutes: number,
  windowMinutes: number
): Promise<Appointment[]> {
  const db = await getMongoDb();
  const now = new Date();
  const from = new Date(now.getTime() + withinMinutes * 60 * 1000);
  const to = new Date(from.getTime() + windowMinutes * 60 * 1000);
  return db
    .collection<Appointment>('appointments')
    .find({
      status: 'confirmed',
      reminderQueuedAt: { $exists: false },
      slotStart: { $gte: from, $lt: to },
    })
    .toArray();
}
