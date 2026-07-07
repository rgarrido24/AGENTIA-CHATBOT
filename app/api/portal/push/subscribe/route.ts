import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMongoDb } from '@/lib/mongodb';
import { getResellerAuth } from '@/lib/reseller-auth';
import { verifyClientCookie, CLIENT_COOKIE_NAME } from '@/lib/client-auth';
import { savePortalPushSubscription } from '@/lib/portal-push';

export const dynamic = 'force-dynamic';

async function isAuthorized(resellerId: string, clientSlug: string): Promise<boolean> {
  const reseller = await getResellerAuth(resellerId);
  if (reseller) return true;
  const cookieStore = await cookies();
  const clientCookie = cookieStore.get(CLIENT_COOKIE_NAME)?.value;
  return verifyClientCookie(clientCookie, resellerId, clientSlug);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const resellerId = typeof body?.resellerId === 'string' ? body.resellerId.trim() : '';
  const clientSlug = typeof body?.clientSlug === 'string' ? body.clientSlug.trim() : '';
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';
  const keys = body?.keys;

  if (!resellerId || !clientSlug) {
    return NextResponse.json({ error: 'Faltan resellerId o clientSlug' }, { status: 400 });
  }
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Suscripción push inválida' }, { status: 400 });
  }

  if (!(await isAuthorized(resellerId, clientSlug))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db = await getMongoDb();
  const clientDoc = await db.collection('leads').findOne({
    _collection_type: 'reseller_client',
    resellerId,
    clientSlug,
  });

  if (!clientDoc) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  if (clientDoc.pwa_enabled !== true) {
    return NextResponse.json({ error: 'PWA no habilitada para este cliente' }, { status: 403 });
  }

  await savePortalPushSubscription(
    resellerId,
    clientSlug,
    {
      endpoint,
      keys: { p256dh: String(keys.p256dh), auth: String(keys.auth) },
      expirationTime: body.expirationTime ?? null,
    },
    req.headers.get('user-agent') || undefined,
  );

  return NextResponse.json({ ok: true });
}
