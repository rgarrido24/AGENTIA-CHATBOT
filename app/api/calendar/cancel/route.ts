import { NextRequest } from 'next/server';
import { cancelAppointment, getAppointmentById } from '@/src/lib/appointments';
import { deleteGoogleCalendarEvent } from '@/src/lib/google-calendar';

async function doCancel(appointmentId: string): Promise<boolean> {
  const existing = await getAppointmentById(String(appointmentId));
  if (!existing) return false;
  if (existing.status === 'cancelled') return true;
  if (existing.googleEventId) {
    try {
      await deleteGoogleCalendarEvent(existing.clientId, existing.googleEventId);
    } catch (gcErr) {
      console.warn('[calendar] Error al borrar evento de Google:', gcErr);
    }
  }
  await cancelAppointment(String(appointmentId));
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const appointmentId = body?.appointmentId ?? body?.id;
    if (!appointmentId) {
      return Response.json({ error: 'appointmentId requerido' }, { status: 400 });
    }
    const result = await doCancel(String(appointmentId));
    if (!result) return Response.json({ error: 'Cita no encontrada' }, { status: 404 });
    return Response.json({ ok: true, message: 'Cita cancelada correctamente' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');
    if (!appointmentId) {
      return Response.json({ error: 'id requerido' }, { status: 400 });
    }
    const result = await doCancel(appointmentId);
    if (!result) return Response.json({ error: 'Cita no encontrada' }, { status: 404 });
    return new Response(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cita cancelada</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>✅ Cita cancelada</h1><p>El horario quedó liberado.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
