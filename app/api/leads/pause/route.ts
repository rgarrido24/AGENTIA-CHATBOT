import { NextRequest } from 'next/server';
import { setBotPaused } from '@/src/lib/leads';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
    const paused = body?.paused === true;

    if (!leadId) {
      return Response.json({ error: 'leadId requerido' }, { status: 400 });
    }

    const ok = await setBotPaused(leadId, paused);
    return Response.json({ ok, paused });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
