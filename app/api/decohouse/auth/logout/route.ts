import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('decohouse_auth', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/demo/deco-house',
    maxAge: 0,
  });
  return res;
}

