import { NextRequest } from 'next/server';
import { createAppointment, parseDate } from '@/src/lib/appointments';
import { createGoogleCalendarEvent } from '@/src/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const clientId = body?.clientId;
    const slotStartStr = body?.slotStart;
    const slotEndStr = body?.slotEnd;
    const senderId = body?.senderId;
    const senderName = body?.senderName;
    const platform = body?.platform ?? 'whatsapp';
    const pageId = body?.pageId;

    if (!clientId?.trim()) {
      return Response.json({ error: 'clientId requerido' }, { status: 400 });
    }
    if (!slotStartStr || !slotEndStr) {
      return Response.json({ error: 'slotStart y slotEnd requeridos (ISO 8601)' }, { status: 400 });
    }
    if (!senderId?.trim()) {
      return Response.json({ error: 'senderId requerido' }, { status: 400 });
    }
    if (!pageId?.trim()) {
      return Response.json({ error: 'pageId requerido' }, { status: 400 });
    }

    const slotStart = parseDate(slotStartStr);
    const slotEnd = parseDate(slotEndStr);

    let googleEventId: string | undefined;
    try {
      const event = await createGoogleCalendarEvent({
        clientId: clientId.trim(),
        title: `Cita con ${senderName || senderId}`,
        start: slotStart,
        end: slotEnd,
        description: `Cliente: ${senderName || senderId} | ${platform}`,
      });
      googleEventId = event?.id;
    } catch (gcErr) {
      console.warn('[calendar] Google Calendar no configurado, guardando solo en MongoDB:', gcErr);
    }

    const appointment = await createAppointment({
      clientId: clientId.trim(),
      slotStart,
      slotEnd,
      senderId: senderId.trim(),
      senderName: senderName?.trim() || undefined,
      platform: String(platform),
      pageId: pageId.trim(),
      googleEventId,
    });

    return Response.json({
      ok: true,
      appointment: {
        id: (appointment as { _id?: unknown })._id,
        slotStart: appointment.slotStart.toISOString(),
        slotEnd: appointment.slotEnd.toISOString(),
        status: appointment.status,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 400 });
  }
}
