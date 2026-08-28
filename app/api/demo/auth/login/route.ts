import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  DEMO_AUTH_COOKIE,
  DEMO_AUTH_MAX_AGE,
  demoAuthToken,
  getDemoAdminPassword,
  getDemoAdminUser,
} from '@/lib/demo-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const expectedUser = getDemoAdminUser();
  const expectedPass = getDemoAdminPassword();

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const token = await demoAuthToken(expectedUser, expectedPass);
  const cookieStore = await cookies();
  cookieStore.set(DEMO_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DEMO_AUTH_MAX_AGE,
    path: '/',
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_AUTH_COOKIE);
  return NextResponse.json({ ok: true });
}
