import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import { savePanelPushSubscription } from '@/lib/panel-push';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';
  const keys = body?.keys;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Suscripción push inválida' }, { status: 400 });
  }

  console.error('[cwf-panel/push/subscribe] Guardando suscripción push', {
    endpoint: endpoint.slice(0, 48) + '…',
    hasP256dh: Boolean(keys.p256dh),
    hasAuth: Boolean(keys.auth),
    userAgent: req.headers.get('user-agent')?.slice(0, 80) ?? null,
  });

  await savePanelPushSubscription(
    'cwf',
    {
      endpoint,
      keys: { p256dh: String(keys.p256dh), auth: String(keys.auth) },
      expirationTime: body.expirationTime ?? null,
    },
    req.headers.get('user-agent') || undefined,
  );

  console.error('[cwf-panel/push/subscribe] Suscripción guardada en MongoDB (panel_push_subscriptions)');

  return NextResponse.json({ ok: true });
}
