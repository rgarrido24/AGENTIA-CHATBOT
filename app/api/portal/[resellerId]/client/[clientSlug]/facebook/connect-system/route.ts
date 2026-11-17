import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';
import { encryptFbToken } from '@/lib/fb-token-crypto';
import {
  FB_OAUTH_SESSION_COOKIE,
  FB_OAUTH_SESSION_TTL_MS,
  getPublicOrigin,
  listUserPages,
  newOauthSessionId,
  saveOauthSession,
  startListDebug,
} from '@/lib/facebook-lead-connect';

export const dynamic = 'force-dynamic';

function clientesUrl(resellerId: string, code: string) {
  const url = new URL(`${getPublicOrigin()}/portal/${resellerId}/clientes`);
  url.searchParams.set('fb_error', code);
  return url;
}

/**
 * Conexión alterna SIN login de Facebook: lista las páginas del portafolio a las que da acceso el token
 * del Usuario del sistema (env FB_SYSTEM_USER_TOKEN, que no expira) y reutiliza el mismo selector.
 * ?add=1 agrega la página como EXTRA a un cliente ya conectado (2 páginas en un mismo panel).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { resellerId: string; clientSlug: string } },
) {
  const { resellerId, clientSlug } = params;
  const reseller = await verifyResellerCookie(req.cookies.get(COOKIE_NAME)?.value);
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.redirect(new URL(`${getPublicOrigin()}/portal/${resellerId}`));
  }

  const token = (process.env.FB_SYSTEM_USER_TOKEN ?? '').trim();
  if (!token) return NextResponse.redirect(clientesUrl(resellerId, 'config'));

  const db = await getMongoDb();
  const client = await db.collection('leads').findOne({ _collection_type: 'reseller_client', resellerId, clientSlug });
  if (!client) return NextResponse.redirect(clientesUrl(resellerId, 'generic'));

  if (!client.fb_connection) {
    await db.collection('leads').updateOne(
      { _collection_type: 'reseller_client', resellerId, clientSlug },
      { $set: { 'fb_connection.status': 'pending', updatedAt: new Date() } },
    );
  }

  const addPage = req.nextUrl.searchParams.get('add') === '1' && client.fb_connection?.status === 'connected';

  try {
    const debug = startListDebug();
    debug.push('origen: usuario del sistema (FB_SYSTEM_USER_TOKEN)');
    const pages = await listUserPages(token);
    if (pages.length === 0) {
      console.error('[fb-system] sin páginas con el token del usuario del sistema');
      return NextResponse.redirect(clientesUrl(resellerId, 'no_pages'));
    }
    const sessionId = newOauthSessionId();
    await saveOauthSession({
      sessionId,
      resellerId,
      clientSlug,
      addPage,
      debug: debug.slice(0, 60),
      pages: pages.map((p) => ({ id: p.id, name: p.name, access_token_enc: encryptFbToken(p.access_token) })),
      expiresAt: new Date(Date.now() + FB_OAUTH_SESSION_TTL_MS),
      createdAt: new Date(),
    });
    const sel = new URL(`${getPublicOrigin()}/portal/${resellerId}/facebook/conectar`);
    sel.searchParams.set('clientSlug', clientSlug);
    const res = NextResponse.redirect(sel);
    res.cookies.set(FB_OAUTH_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: Math.floor(FB_OAUTH_SESSION_TTL_MS / 1000),
    });
    return res;
  } catch (err) {
    console.error('[fb-system]', (err as Error).message);
    return NextResponse.redirect(clientesUrl(resellerId, 'oauth'));
  }
}
