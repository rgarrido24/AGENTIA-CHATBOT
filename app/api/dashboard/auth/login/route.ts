import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'dashboard_auth';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8h
const AUTH_SALT = 'agentia_dashboard_v2';

async function dashboardToken(user: string, pass: string): Promise<string> {
  const data = new TextEncoder().encode(user + ':' + pass + AUTH_SALT);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(request: NextRequest) {
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) {
    return NextResponse.json({ error: 'Auth no configurado' }, { status: 500 });
  }
  const body = await request.json().catch(() => ({}));
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  // Acceso de revisor (Meta App Review): cookie propia, solo panel Agentia.
  const revUser = process.env.REVIEWER_USER?.trim();
  const revPass = process.env.REVIEWER_PASSWORD;
  if (revUser && revPass && username === revUser && password === revPass) {
    const data = new TextEncoder().encode(`${revUser}:${revPass}:agentia_reviewer_v1`);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const rtoken = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
    const jar = await cookies();
    jar.set('agentia_reviewer', rtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
    return NextResponse.json({ ok: true });
  }

  // Usuario demo (solo lectura, acceso público para demos)
  const isDemoUser = username === 'demo-agencia' && password === 'demo2026';

  if (!isDemoUser && (username !== adminUser || password !== adminPass)) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const token = isDemoUser
    ? await dashboardToken('demo-agencia', 'demo2026')
    : await dashboardToken(adminUser, adminPass);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
