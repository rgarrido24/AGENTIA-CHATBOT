import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifyResellerCookie } from '@/lib/reseller-auth';
import { encryptFbToken } from '@/lib/fb-token-crypto';
import {
  completeFacebookPageConnection,
  exchangeCodeForUserToken,
  exchangeForLongLivedUserToken,
  FB_CONNECT_REVEAL_COOKIE,
  FB_OAUTH_SESSION_COOKIE,
  FB_OAUTH_SESSION_TTL_MS,
  FB_REVEAL_TTL_MS,
  getPublicOrigin,
  listUserPages,
  newOauthSessionId,
  saveOauthSession,
  signReveal,
  verifyOauthState,
} from '@/lib/facebook-lead-connect';

export const dynamic = 'force-dynamic';

function cookieSecure(): boolean {
  return process.env.NODE_ENV === 'production';
}

function clientesUrl(resellerId: string, extra?: Record<string, string>) {
  const url = new URL(`${getPublicOrigin()}/portal/${resellerId}/clientes`);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
  }
  return url;
}

function selectorUrl(resellerId: string, clientSlug: string) {
  const url = new URL(`${getPublicOrigin()}/portal/${resellerId}/facebook/conectar`);
  url.searchParams.set('clientSlug', clientSlug);
  return url;
}

function mapOauthError(error: string | null, reason: string | null): 'cancelled' | 'oauth' {
  if (error === 'access_denied' || reason === 'user_denied') return 'cancelled';
  return 'oauth';
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const error = searchParams.get('error');
  const reason = searchParams.get('error_reason');
  const state = searchParams.get('state') || '';
  const code = searchParams.get('code');

  const parsed = verifyOauthState(state);
  const reseller = await verifyResellerCookie(req.cookies.get(COOKIE_NAME)?.value);

  if (error) {
    const codeErr = mapOauthError(error, reason);
    const resellerId = parsed?.resellerId || reseller?.resellerId;
    if (!resellerId) {
      return NextResponse.redirect(new URL(`${getPublicOrigin()}/portal/luciano`));
    }
    return NextResponse.redirect(clientesUrl(resellerId, { fb_error: codeErr }));
  }

  if (!parsed) {
    const fallback = reseller?.resellerId || 'luciano';
    return NextResponse.redirect(clientesUrl(fallback, { fb_error: 'expired' }));
  }

  const { resellerId, clientSlug } = parsed;
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.redirect(new URL(`${getPublicOrigin()}/portal/${resellerId}`));
  }

  if (!code) {
    return NextResponse.redirect(clientesUrl(resellerId, { fb_error: 'oauth' }));
  }

  try {
    const shortToken = await exchangeCodeForUserToken(code);
    const userToken = await exchangeForLongLivedUserToken(shortToken);
    const pages = await listUserPages(userToken);
    if (pages.length === 0) {
      return NextResponse.redirect(clientesUrl(resellerId, { fb_error: 'no_pages' }));
    }

    if (pages.length === 1) {
      const result = await completeFacebookPageConnection({
        resellerId,
        clientSlug,
        page: pages[0],
      });
      if (!result.ok) {
        return NextResponse.redirect(clientesUrl(resellerId, { fb_error: result.code }));
      }
      const res = NextResponse.redirect(clientesUrl(resellerId, { fb: 'connected' }));
      if (result.reveal) {
        res.cookies.set(FB_CONNECT_REVEAL_COOKIE, signReveal(result.reveal), {
          httpOnly: true,
          sameSite: 'lax',
          secure: cookieSecure(),
          path: '/',
          maxAge: Math.floor(FB_REVEAL_TTL_MS / 1000),
        });
      }
      return res;
    }

    const sessionId = newOauthSessionId();
    await saveOauthSession({
      sessionId,
      resellerId,
      clientSlug,
      pages: pages.map((p) => ({
        id: p.id,
        name: p.name,
        access_token_enc: encryptFbToken(p.access_token),
      })),
      expiresAt: new Date(Date.now() + FB_OAUTH_SESSION_TTL_MS),
      createdAt: new Date(),
    });

    const res = NextResponse.redirect(selectorUrl(resellerId, clientSlug));
    res.cookies.set(FB_OAUTH_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: cookieSecure(),
      path: '/',
      maxAge: Math.floor(FB_OAUTH_SESSION_TTL_MS / 1000),
    });
    return res;
  } catch (err) {
    console.error('[fb-oauth/callback]', (err as Error).message);
    return NextResponse.redirect(clientesUrl(resellerId, { fb_error: 'oauth' }));
  }
}
