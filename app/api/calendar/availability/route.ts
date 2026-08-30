import { NextRequest } from 'next/server';
import { getAvailableSlots, parseDate } from '@/src/lib/appointments';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const dateStr = searchParams.get('date');

    if (!clientId?.trim()) {
      return Response.json({ error: 'clientId requerido' }, { status: 400 });
    }
    if (!dateStr) {
      return Response.json({ error: 'date requerido (YYYY-MM-DD)' }, { status: 400 });
    }

    const date = parseDate(dateStr);
    const slots = await getAvailableSlots(clientId.trim(), date);

    return Response.json({
      clientId: clientId.trim(),
      date: dateStr,
      slots: slots.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        label: formatSlotLabel(s.start),
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 400 });
  }
}

function formatSlotLabel(d: Date): string {
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}
