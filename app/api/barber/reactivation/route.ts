import { NextRequest, NextResponse } from 'next/server';
import { enqueueReactivationMessages } from '../../../../src/lib/reactivation';

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await req.json().catch(() => ({}));
    const clientId = typeof body.clientId === 'string' ? body.clientId.trim() : '';
    if (!clientId) {
      return NextResponse.json({ error: 'clientId requerido' }, { status: 400 });
    }
    const daysThreshold = typeof body.daysThreshold === 'number' ? body.daysThreshold : 20;
    const count = await enqueueReactivationMessages(clientId, daysThreshold);
    return NextResponse.json({ ok: true, enqueued: count });
  } catch (err) {
    console.error('[api/barber/reactivation] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
