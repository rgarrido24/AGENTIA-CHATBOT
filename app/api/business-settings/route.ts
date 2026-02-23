import { NextRequest } from 'next/server';
import { getBusinessSettings, saveBusinessSettings, type BusinessSchedule } from '@/src/lib/business-settings';

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get('clientId');
    if (!clientId?.trim()) {
      return Response.json({ error: 'clientId requerido' }, { status: 400 });
    }
    const settings = await getBusinessSettings(clientId.trim());
    return Response.json(settings);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const clientId = body?.clientId;
    if (!clientId?.trim()) {
      return Response.json({ error: 'clientId requerido' }, { status: 400 });
    }
    const settings = await saveBusinessSettings({
      clientId: clientId.trim(),
      schedule: body.schedule as BusinessSchedule | undefined,
      slotDurationMinutes: body.slotDurationMinutes,
      breakBetweenMinutes: body.breakBetweenMinutes,
    });
    return Response.json(settings);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
