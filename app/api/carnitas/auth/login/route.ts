import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  CARNITAS_AUTH_COOKIE,
  CARNITAS_AUTH_MAX_AGE,
  carnitasAuthToken,
  getCarnitasAdminPassword,
  getCarnitasAdminUser,
  isCarnitasAuthConfigured,
} from '@/lib/carnitas-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isCarnitasAuthConfigured()) {
    return NextResponse.json(
      { error: 'Auth no configurado (CARNITAS_ADMIN_USER / CARNITAS_ADMIN_PASSWORD)' },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const expectedUser = getCarnitasAdminUser();
  const expectedPass = getCarnitasAdminPassword();

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const token = await carnitasAuthToken(expectedUser, expectedPass);
  const cookieStore = await cookies();
  cookieStore.set(CARNITAS_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CARNITAS_AUTH_MAX_AGE,
    path: '/',
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete(CARNITAS_AUTH_COOKIE);
  return NextResponse.json({ ok: true });
}
