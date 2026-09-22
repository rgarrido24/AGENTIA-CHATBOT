import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifyResellerCookie } from '@/lib/reseller-auth';
import { decryptFbToken } from '@/lib/fb-token-crypto';
import {
  completeFacebookPageConnection,
  deleteOauthSession,
  FB_CONNECT_REVEAL_COOKIE,
  FB_OAUTH_SESSION_COOKIE,
  FB_REVEAL_TTL_MS,
  getPublicOrigin,
  loadOauthSession,
  signReveal,
} from '@/lib/facebook-lead-connect';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { resellerId: string; clientSlug: string } },
) {
  const { resellerId, clientSlug } = params;
  const reseller = await verifyResellerCookie(req.cookies.get(COOKIE_NAME)?.value);
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const pageId = String((body as { pageId?: unknown }).pageId ?? '').trim();
  if (!pageId) {
    return NextResponse.json({ error: 'Elegí una página de Facebook.' }, { status: 400 });
  }

  const sessionId = req.cookies.get(FB_OAUTH_SESSION_COOKIE)?.value || '';
  const session = await loadOauthSession(sessionId);
  if (!session || session.resellerId !== resellerId || session.clientSlug !== clientSlug) {
    return NextResponse.json(
      { error: 'La sesión de Facebook venció. Tocá de nuevo Conectar Facebook.', code: 'expired' },
      { status: 410 },
    );
  }

  const chosen = session.pages.find((p) => p.id === pageId);
  if (!chosen) {
    return NextResponse.json({ error: 'Esa página no está en la cuenta autorizada.' }, { status: 400 });
  }

  let pageToken: string;
  try {
    pageToken = decryptFbToken(chosen.access_token_enc);
  } catch {
    return NextResponse.json(
      { error: 'No se pudo leer el token de la página. Volvé a conectar Facebook.', code: 'oauth' },
      { status: 500 },
    );
  }

  const result = await completeFacebookPageConnection({
    resellerId,
    clientSlug,
    page: { id: chosen.id, name: chosen.name, access_token: pageToken },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message, code: result.code }, { status: 400 });
  }

  await deleteOauthSession(session.sessionId);

  const redirectTo = `${getPublicOrigin()}/portal/${resellerId}/clientes?fb=connected`;
  const res = NextResponse.json({ ok: true, redirect: redirectTo });
  res.cookies.set(FB_OAUTH_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  if (result.reveal) {
    res.cookies.set(FB_CONNECT_REVEAL_COOKIE, signReveal(result.reveal), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: Math.floor(FB_REVEAL_TTL_MS / 1000),
    });
  }
  return res;
}
