import { NextRequest } from 'next/server';
import { getBotGlobalPaused, setBotGlobalPaused } from '@/src/lib/bot-settings';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId')?.trim() || 'izzi';
    const paused = await getBotGlobalPaused(clientId);
    return Response.json({ paused });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
    const paused = body?.paused === true;

    if (!clientId) {
      return Response.json({ error: 'clientId requerido' }, { status: 400 });
    }

    const ok = await setBotGlobalPaused(clientId, paused);
    return Response.json({ ok, paused });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
