import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeAuthorizationCode,
  getAppBaseUrl,
  saveTiendanubeToken,
} from '@/lib/tiendanube';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code')?.trim();
  const clientId = searchParams.get('state')?.trim().toLowerCase() || 'biovela';
  const storeId =
    searchParams.get('store_id')?.trim() ||
    searchParams.get('user_id')?.trim() ||
    '';

  const failUrl = new URL(`/clientes/${clientId}/panel`, getAppBaseUrl());
  failUrl.searchParams.set('tiendanube', 'error');

  if (!code) {
    failUrl.searchParams.set('msg', 'missing_code');
    return NextResponse.redirect(failUrl);
  }

  try {
    const tokenData = await exchangeAuthorizationCode(code);
    const accessToken = String(tokenData.access_token || '').trim();
    const resolvedStoreId = String(
      storeId || tokenData.store_id || tokenData.user_id || ''
    ).trim();

    if (!accessToken || !resolvedStoreId) {
      failUrl.searchParams.set('msg', 'invalid_token_response');
      return NextResponse.redirect(failUrl);
    }

    await saveTiendanubeToken({
      clientId,
      storeId: resolvedStoreId,
      accessToken,
    });

    const okUrl = new URL(`/clientes/${clientId}/panel`, getAppBaseUrl());
    okUrl.searchParams.set('tiendanube', 'connected');
    return NextResponse.redirect(okUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'oauth_failed';
    failUrl.searchParams.set('msg', msg.slice(0, 120));
    return NextResponse.redirect(failUrl);
  }
}
