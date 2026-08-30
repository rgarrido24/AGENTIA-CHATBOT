import { NextRequest, NextResponse } from 'next/server';
import { processBiovelaFollowups } from '@/lib/biovela-followup';

export const dynamic = 'force-dynamic';

function hasCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization');
  const q = req.nextUrl.searchParams.get('secret');
  return auth === `Bearer ${secret}` || q === secret;
}

/**
 * Cron horario: seguimiento automático Biovela (pregunton / interesado, 24–72h sin compra).
 * GET /api/cron/followup?secret=...
 */
export async function GET(req: NextRequest) {
  if (!hasCronSecret(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const result = await processBiovelaFollowups();
    return NextResponse.json({ ok: true, clientId: 'biovela', ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('[cron/followup]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
