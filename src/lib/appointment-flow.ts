import { getMongoDb } from '../../lib/mongodb';
import { getAvailableSlots, createAppointment, getLastAppointmentBySender, cancelAppointment } from './appointments';
import { createGoogleCalendarEvent } from './google-calendar';

type OfferedSlot = { start: string; end: string };

export async function storeOfferedSlots(
  sessionId: string,
  slots: OfferedSlot[]
): Promise<void> {
  const db = await getMongoDb();
  await db.collection('offered_slots').updateOne(
    { sessionId },
    { $set: { sessionId, slots, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function getOfferedSlots(sessionId: string): Promise<OfferedSlot[]> {
  const db = await getMongoDb();
  const doc = await db.collection<{ slots: OfferedSlot[] }>('offered_slots').findOne({ sessionId });
  const slots = doc?.slots ?? [];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const docDate = (doc as { updatedAt?: Date })?.updatedAt;
  if (docDate && docDate < oneHourAgo) return [];
  return slots;
}

export function parseTimeFromMessage(message: string): string | null {
  const text = message.toLowerCase().trim();
  let h: number;
  let min = 0;
  const m1 = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (m1) {
    h = parseInt(m1[1], 10);
    min = parseInt(m1[2], 10);
    const ampm = (m1[3] || '').toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }
  const m2 = text.match(/(\d{1,2})\s*(am|pm)/i);
  if (m2) {
    h = parseInt(m2[1], 10);
    const ampm = (m2[2] || '').toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:00`;
  }
  const m3 = text.match(/(?:a\s*las?|las?|el\s*de\s*las?|confirmo)\s*(\d{1,2})(?::(\d{2}))?/i);
  if (m3) {
    h = parseInt(m3[1], 10);
    min = m3[2] ? parseInt(m3[2], 10) : 0;
    if (h >= 1 && h <= 7 && !/noche|madrugada/i.test(text)) h += 12;
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }
  const m4 = text.match(/(\d{1,2})/);
  if (m4) {
    h = parseInt(m4[1], 10);
    if (h >= 9 && h <= 18) return `${h.toString().padStart(2, '0')}:00`;
  }
  return null;
}

export function matchSlotToOffered(slots: OfferedSlot[], timeStr: string): OfferedSlot | null {
  for (const s of slots) {
    const start = new Date(s.start);
    const h = start.getHours();
    const m = start.getMinutes();
    const slotTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    if (slotTime === timeStr) return s;
  }
  return null;
}

export async function tryCancelFromMessage(
  message: string,
  senderId: string,
  pageId: string,
  clientId: string
): Promise<{ cancelled: boolean; reply?: string }> {
  if (!/cancelar|cancel|cancelo/i.test(message)) return { cancelled: false };
  const last = await getLastAppointmentBySender(senderId, pageId, clientId);
  if (!last) return { cancelled: false };
  const appointmentId = String((last as { _id?: unknown })._id);
  if (last.googleEventId) {
    try {
      const { deleteGoogleCalendarEvent } = await import('./google-calendar');
      await deleteGoogleCalendarEvent(clientId, last.googleEventId);
    } catch {
      // ignore
    }
  }
  await cancelAppointment(appointmentId);
  return {
    cancelled: true,
    reply: 'Tu cita ha sido cancelada. El horario quedó liberado. Si quieres agendar de nuevo, escríbeme.',
  };
}

export async function tryBookFromConfirmation(
  message: string,
  sessionId: string,
  senderId: string,
  senderName: string | undefined,
  pageId: string,
  clientId: string,
  platform: string
): Promise<{ booked: boolean; reply?: string }> {
  const offered = await getOfferedSlots(sessionId);
  if (offered.length === 0) return { booked: false };

  const confirmWords = /confirmo|sí|si|ok|dale|perfecto|ese|el de las|a las|las \d/i;
  if (!confirmWords.test(message)) return { booked: false };

  const timeStr = parseTimeFromMessage(message);
  if (!timeStr) return { booked: false };

  const slot = matchSlotToOffered(offered, timeStr);
  if (!slot) return { booked: false };

  try {
    let googleEventId: string | undefined;
    try {
      const event = await createGoogleCalendarEvent({
        clientId,
        title: `Cita con ${senderName || senderId}`,
        start: new Date(slot.start),
        end: new Date(slot.end),
        description: `Cliente: ${senderName || senderId} | ${platform}`,
      });
      googleEventId = event?.id;
    } catch {
      // continue without Google
    }

    await createAppointment({
      clientId,
      slotStart: new Date(slot.start),
      slotEnd: new Date(slot.end),
      senderId,
      senderName,
      platform,
      pageId,
      googleEventId,
    });

    const label = new Date(slot.start).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    return {
      booked: true,
      reply: `¡Listo! Tu cita quedó confirmada para las ${label}. Te enviaremos un recordatorio 2 horas antes. Si necesitas cancelar, escribe "cancelar".`,
    };
  } catch {
    return { booked: false };
  }
}

export async function getAvailabilityForPrompt(clientId: string, dateStr?: string): Promise<string> {
  const date = dateStr ? new Date(dateStr) : new Date();
  const slots = await getAvailableSlots(clientId, date);
  if (slots.length === 0) return 'No hay horarios disponibles para hoy.';
  const labels = slots.map((s) => s.start.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
  return `Horarios disponibles hoy: ${labels.join(', ')}. El cliente puede confirmar diciendo el horario (ej: "confirmo las 4" o "el de las 4pm").`;
}
