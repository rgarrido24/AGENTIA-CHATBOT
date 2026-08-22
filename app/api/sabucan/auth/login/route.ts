import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SABUCAN_AUTH_COOKIE,
  SABUCAN_AUTH_MAX_AGE,
  getSabucanAdminPassword,
  getSabucanAdminUser,
  isSabucanAuthConfigured,
  sabucanAuthToken,
} from '@/lib/sabucan-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isSabucanAuthConfigured()) {
    return NextResponse.json(
      { error: 'Auth no configurado (SABUCAN_ADMIN_USER / SABUCAN_ADMIN_PASSWORD)' },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const expectedUser = getSabucanAdminUser();
  const expectedPass = getSabucanAdminPassword();

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const token = await sabucanAuthToken(expectedUser, expectedPass);
  const cookieStore = await cookies();
  cookieStore.set(SABUCAN_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SABUCAN_AUTH_MAX_AGE,
    path: '/',
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete(SABUCAN_AUTH_COOKIE);
  return NextResponse.json({ ok: true });
}
