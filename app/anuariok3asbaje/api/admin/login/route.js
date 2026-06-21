import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ANUARIO_BASE,
  ANUARIO_COOKIE,
  anuarioAdminPassword,
  anuarioPath,
} from '@/lib/anuario-k3/paths';

export async function POST(request) {
  const { password } = await request.json();
  const expected = anuarioAdminPassword();

  if (expected && password === expected) {
    const cookieStore = cookies();
    cookieStore.set(ANUARIO_COOKIE, password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: ANUARIO_BASE,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}
