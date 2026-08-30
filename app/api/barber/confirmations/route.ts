import { NextRequest, NextResponse } from 'next/server';
import { enqueueConfirmationMessages } from '../../../../src/lib/noshow-confirmation';

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const count = await enqueueConfirmationMessages();
    return NextResponse.json({ ok: true, enqueued: count });
  } catch (err) {
    console.error('[api/barber/confirmations] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
