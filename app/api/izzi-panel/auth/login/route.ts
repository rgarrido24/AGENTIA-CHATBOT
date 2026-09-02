import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  IZZI_PANEL_COOKIE,
  IZZI_PANEL_COOKIE_MAX_AGE,
  isIzziPanelConfigured,
  mintIzziPanelSession,
} from '@/lib/izzi-panel-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isIzziPanelConfigured()) {
    return NextResponse.json({ error: 'Auth no configurado' }, { status: 500 });
  }
  const body = await request.json().catch(() => ({}));
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const session = mintIzziPanelSession(username, password);
  if (!session) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(IZZI_PANEL_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: IZZI_PANEL_COOKIE_MAX_AGE,
    path: '/',
  });
  return NextResponse.json({
    ok: true,
    expiresInDays: 30,
    clientId: session.clientId,
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(IZZI_PANEL_COOKIE);
  return NextResponse.json({ ok: true });
}
