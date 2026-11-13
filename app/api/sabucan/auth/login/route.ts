import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SABUCAN_AUTH_COOKIE,
  SABUCAN_AUTH_MAX_AGE,
  getSabucanAdminUser,
  isSabucanAuthConfigured,
  sabucanAuthToken,
} from '@/lib/sabucan-auth';
import { getEffectiveSabucanPassword } from '../password/route';
import {
  clearFailedLogins,
  isTenantPanelActive,
  lockMinutesLeft,
  recordFailedLogin,
  reportSuspendedAccess,
  requestIp,
} from '@/lib/sabucan-security';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isSabucanAuthConfigured()) {
    return NextResponse.json(
      { error: 'Auth no configurado (SABUCAN_ADMIN_USER / SABUCAN_ADMIN_PASSWORD)' },
      { status: 500 },
    );
  }

  const ip = requestIp(request);
  const locked = await lockMinutesLeft(ip);
  if (locked > 0) {
    return NextResponse.json(
      { error: `Demasiados intentos. Intenta de nuevo en ${locked} min.` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const expectedUser = getSabucanAdminUser();
  const effectivePass = await getEffectiveSabucanPassword();

  if (username !== expectedUser || password !== effectivePass) {
    const r = await recordFailedLogin(ip, request.headers.get('user-agent') ?? '', username);
    if (r.locked) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Acceso bloqueado por 30 min.' },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  await clearFailedLogins(ip);

  if (!(await isTenantPanelActive())) {
    await reportSuspendedAccess(ip);
    return NextResponse.json(
      { error: 'Servicio suspendido. Contacta a Agentia para reactivarlo.', suspendido: true },
      { status: 403 },
    );
  }

  const token = await sabucanAuthToken(expectedUser, effectivePass);
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
