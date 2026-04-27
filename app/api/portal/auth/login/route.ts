import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMongoDb } from '@/lib/mongodb';
import { hashPassword, buildCookieValue, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/reseller-auth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const resellerId = typeof body?.resellerId === 'string' ? body.resellerId.trim() : '';
  const password   = typeof body?.password   === 'string' ? body.password          : '';

  if (!resellerId || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  const db       = await getMongoDb();
  const reseller = await db.collection('resellers').findOne({ resellerId });

  console.log('[portal/login] reseller encontrado:', JSON.stringify(reseller));

  if (!reseller || reseller.status !== 'activo') {
    console.log('[portal/login] fallo: reseller nulo o status !== activo, status=', reseller?.status);
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const hash = hashPassword(password);
  console.log('[portal/login] hash recibido:', hash);
  console.log('[portal/login] hash en DB:   ', reseller.passwordHash);

  if (hash !== reseller.passwordHash) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const cookieValue = buildCookieValue(resellerId, reseller.passwordHash as string);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return NextResponse.json({ ok: true, redirect: `/portal/${resellerId}/dashboard` });
}
