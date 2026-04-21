import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let token: string | undefined;
  try {
    ({ token } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Dev/preview: no secret configured → pass through
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Verificación no configurada' }, { status: 500 });
  }

  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, response: token }),
      }
    );
    const data = (await res.json()) as { success: boolean };
    if (data.success) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: 'Verificación fallida' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'Error al verificar' }, { status: 502 });
  }
}
