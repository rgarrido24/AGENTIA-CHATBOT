import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMongoDb } from '@/lib/mongodb';
import { getResellerAuth } from '@/lib/reseller-auth';
import { verifyClientCookie, CLIENT_COOKIE_NAME } from '@/lib/client-auth';
import { savePortalPushSubscription } from '@/lib/portal-push';

export const dynamic = 'force-dynamic';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function isAuthorized(resellerId: string, clientSlug: string): Promise<boolean> {
  const reseller = await getResellerAuth(resellerId);
  if (reseller) return true;
  const cookieStore = await cookies();
  const clientCookie = cookieStore.get(CLIENT_COOKIE_NAME)?.value;
  if (await verifyClientCookie(clientCookie, resellerId, clientSlug)) return true;
  // Match case-insensitive por si el cookie se creó con otro casing
  return verifyClientCookie(
    clientCookie,
    resellerId.trim().toLowerCase(),
    clientSlug.trim().toLowerCase(),
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const resellerIdRaw = typeof body?.resellerId === 'string' ? body.resellerId.trim() : '';
  const clientSlugRaw = typeof body?.clientSlug === 'string' ? body.clientSlug.trim() : '';
  const resellerId = resellerIdRaw.toLowerCase();
  const clientSlug = clientSlugRaw.toLowerCase();
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';
  const keys = body?.keys;

  console.error('[PWA PUSH] subscribe POST', { resellerId, clientSlug, hasEndpoint: Boolean(endpoint) });

  if (!resellerId || !clientSlug) {
    return NextResponse.json({ error: 'Faltan resellerId o clientSlug' }, { status: 400 });
  }
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Suscripción push inválida' }, { status: 400 });
  }

  if (!(await isAuthorized(resellerIdRaw, clientSlugRaw))) {
    console.error('[PWA PUSH] subscribe 401 — inicia sesión primero', { resellerId, clientSlug });
    return NextResponse.json({ error: 'No autorizado — inicia sesión en el panel' }, { status: 401 });
  }

  const db = await getMongoDb();
  const clientDoc = await db.collection('leads').findOne({
    _collection_type: 'reseller_client',
    resellerId: { $regex: `^${escapeRegex(resellerId)}$`, $options: 'i' },
    clientSlug: { $regex: `^${escapeRegex(clientSlug)}$`, $options: 'i' },
  });

  if (!clientDoc) {
    console.error('[PWA PUSH] subscribe 404 cliente no encontrado', { resellerId, clientSlug });
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  if (clientDoc.pwa_enabled === false) {
    console.error('[PWA PUSH] subscribe 403 pwa_disabled', { resellerId, clientSlug });
    return NextResponse.json({ error: 'PWA no habilitada para este cliente' }, { status: 403 });
  }

  const savedResellerId = String(clientDoc.resellerId || resellerId).toLowerCase();
  const savedClientSlug = String(clientDoc.clientSlug || clientSlug).toLowerCase();

  await savePortalPushSubscription(
    savedResellerId,
    savedClientSlug,
    {
      endpoint,
      keys: { p256dh: String(keys.p256dh), auth: String(keys.auth) },
      expirationTime: body.expirationTime ?? null,
    },
    req.headers.get('user-agent') || undefined,
  );

  const count = await db.collection('portal_push_subscriptions').countDocuments({
    resellerId: { $regex: `^${escapeRegex(savedResellerId)}$`, $options: 'i' },
    clientSlug: { $regex: `^${escapeRegex(savedClientSlug)}$`, $options: 'i' },
  });

  console.error('[PWA PUSH] subscribe OK', {
    resellerId: savedResellerId,
    clientSlug: savedClientSlug,
    suscripciones: count,
  });
  return NextResponse.json({ ok: true, count });
}

export async function GET(req: NextRequest) {
  const resellerId = (req.nextUrl.searchParams.get('resellerId') || '').trim().toLowerCase();
  const clientSlug = (req.nextUrl.searchParams.get('clientSlug') || '').trim().toLowerCase();
  if (!resellerId || !clientSlug) {
    return NextResponse.json({ error: 'Faltan params' }, { status: 400 });
  }
  if (!(await isAuthorized(resellerId, clientSlug))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const db = await getMongoDb();
  const count = await db.collection('portal_push_subscriptions').countDocuments({
    resellerId: { $regex: `^${escapeRegex(resellerId)}$`, $options: 'i' },
    clientSlug: { $regex: `^${escapeRegex(clientSlug)}$`, $options: 'i' },
  });
  return NextResponse.json({ ok: true, count });
}
