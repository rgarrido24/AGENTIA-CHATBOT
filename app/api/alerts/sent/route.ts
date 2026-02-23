import { NextRequest } from 'next/server';
import { markAlertSent } from '@/src/lib/alerts';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids) ? body.ids : [body?.id].filter(Boolean);
    if (ids.length === 0) {
      return Response.json({ error: 'ids requerido (array)' }, { status: 400 });
    }

    const results = await Promise.all(ids.map((id: string) => markAlertSent(id)));
    return Response.json({ ok: true, marked: results.filter(Boolean).length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
