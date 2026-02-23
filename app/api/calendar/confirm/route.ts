import { NextRequest } from 'next/server';
import { createAppointment } from '@/src/lib/appointments';
import { createGoogleCalendarEvent } from '@/src/lib/google-calendar';

/**
 * Confirmar cita por link (para mensajes con botón o link).
 * GET /api/calendar/confirm?clientId=izzi&slotStart=...&slotEnd=...&senderId=...&senderName=...&platform=whatsapp&pageId=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const slotStartStr = searchParams.get('slotStart');
    const slotEndStr = searchParams.get('slotEnd');
    const senderId = searchParams.get('senderId');
    const senderName = searchParams.get('senderName');
    const platform = searchParams.get('platform') ?? 'whatsapp';
    const pageId = searchParams.get('pageId');

    if (!clientId?.trim() || !slotStartStr || !slotEndStr || !senderId?.trim() || !pageId?.trim()) {
      return Response.json(
        { error: 'Faltan parámetros: clientId, slotStart, slotEnd, senderId, pageId' },
        { status: 400 }
      );
    }

    const slotStart = new Date(slotStartStr);
    const slotEnd = new Date(slotEndStr);
    if (isNaN(slotStart.getTime()) || isNaN(slotEnd.getTime())) {
      return Response.json({ error: 'Fechas inválidas' }, { status: 400 });
    }

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
    } catch {
      // continue without Google
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

    return new Response(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cita confirmada</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>✅ Cita confirmada</h1><p>Tu cita quedó agendada. Te enviaremos un recordatorio 2 horas antes.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 400 });
  }
}
