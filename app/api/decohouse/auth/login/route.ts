import { NextRequest, NextResponse } from 'next/server';

function safeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let ok = 0;
  for (let i = 0; i < a.length; i++) ok |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return ok === 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = typeof body?.user === 'string' ? body.user : '';
  const pass = typeof body?.pass === 'string' ? body.pass : '';

  const expectedUser = process.env.DECOHOUSE_DEMO_USER || 'decohouse';
  const expectedPass = process.env.DECOHOUSE_DEMO_PASS || '';

  if (!expectedPass) {
    return NextResponse.json(
      { error: 'Acceso no configurado (falta DECOHOUSE_DEMO_PASS)' },
      { status: 500 }
    );
  }

  if (!safeEq(user, expectedUser) || !safeEq(pass, expectedPass)) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('decohouse_auth', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/demo/deco-house',
    maxAge: 60 * 60 * 24 * 14, // 14 días
  });
  return res;
}

