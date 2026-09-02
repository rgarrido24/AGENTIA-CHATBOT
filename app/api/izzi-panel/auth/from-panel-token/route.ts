import { NextRequest, NextResponse } from 'next/server';
import { getExpectedClientPanelToken } from '@/lib/client-panel-auth';
import { isIzziClient } from '@/lib/izzi-panel';
import {
  IZZI_PANEL_COOKIE,
  IZZI_PANEL_COOKIE_MAX_AGE,
  izziPanelBridgeToken,
} from '@/lib/izzi-panel-auth';

export const dynamic = 'force-dynamic';

function loginRedirect(request: NextRequest) {
  const url = new URL('/izzi-panel/login', request.url);
  url.searchParams.set('from', '/izzi-panel/conversaciones');
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const clientId = (request.nextUrl.searchParams.get('clientId') || '').trim().toLowerCase();
  const token = request.nextUrl.searchParams.get('token') || '';

  if (!isIzziClient(clientId)) return loginRedirect(request);

  const expected = getExpectedClientPanelToken(clientId);
  if (!expected || token !== expected) return loginRedirect(request);

  const dest = new URL('/izzi-panel/conversaciones', request.url);
  const res = NextResponse.redirect(dest);
  res.cookies.set(IZZI_PANEL_COOKIE, izziPanelBridgeToken(clientId, expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: IZZI_PANEL_COOKIE_MAX_AGE,
    path: '/',
  });
  return res;
}
