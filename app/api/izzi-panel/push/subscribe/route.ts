import { NextRequest, NextResponse } from 'next/server';
import { isIzziPanelAuthenticated } from '@/lib/izzi-panel-auth';
import { savePanelPushSubscription } from '@/lib/panel-push';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isIzziPanelAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';
  const keys = body?.keys;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Suscripción push inválida' }, { status: 400 });
  }

  await savePanelPushSubscription(
    'izzi',
    {
      endpoint,
      keys: { p256dh: String(keys.p256dh), auth: String(keys.auth) },
      expirationTime: body.expirationTime ?? null,
    },
    req.headers.get('user-agent') || undefined
  );

  return NextResponse.json({ ok: true });
}
