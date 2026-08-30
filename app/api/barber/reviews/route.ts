import { NextRequest, NextResponse } from 'next/server';
import { enqueueReviewRequests } from '../../../../src/lib/review-requests';

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
    const reviewUrl =
      typeof body.reviewUrl === 'string'
        ? body.reviewUrl.trim()
        : (process.env.GOOGLE_MAPS_REVIEW_URL ?? 'https://g.page/r/review');
    const count = await enqueueReviewRequests(clientId, reviewUrl);
    return NextResponse.json({ ok: true, enqueued: count });
  } catch (err) {
    console.error('[api/barber/reviews] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
