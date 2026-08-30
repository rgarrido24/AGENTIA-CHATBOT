import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_auth';
const DASHBOARD_COOKIE_NAME = 'dashboard_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h
const AUTH_SALT = 'agentia_admin_salt';
const DASHBOARD_AUTH_SALT = 'agentia_dashboard_v2';

function getAuthTokenHash(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return '';
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(secret + AUTH_SALT).digest('hex');
}

function getDashboardTokenHash(): string {
  const user = process.env.ADMIN_USER || 'admin';
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return '';
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(user + ':' + secret + DASHBOARD_AUTH_SALT).digest('hex');
}

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    return NextResponse.json({ error: 'Auth no configurado' }, { status: 500 });
  }
  const body = await request.json().catch(() => ({}));
  const password = typeof body?.password === 'string' ? body.password : '';
  if (password !== secret) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }
  const token = getAuthTokenHash();
  const dashboardToken = getDashboardTokenHash();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  cookieStore.set(DASHBOARD_COOKIE_NAME, dashboardToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  return NextResponse.json({ ok: true, redirect: '/admin/dashboard' });
}
