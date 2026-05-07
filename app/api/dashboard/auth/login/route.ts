import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'dashboard_auth';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8h
const AUTH_SALT = 'agentia_dashboard_v2';

function dashboardToken(user: string, pass: string): string {
  return crypto.createHash('sha256').update(user + ':' + pass + AUTH_SALT).digest('hex');
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

  if (username !== adminUser || password !== adminPass) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const token = dashboardToken(adminUser, adminPass);
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
