import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifyResellerCookie } from '@/lib/reseller-auth';
import { FB_CONNECT_REVEAL_COOKIE, verifyReveal } from '@/lib/facebook-lead-connect';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { resellerId: string } },
) {
  const { resellerId } = params;
  const reseller = await verifyResellerCookie(req.cookies.get(COOKIE_NAME)?.value);
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const raw = req.cookies.get(FB_CONNECT_REVEAL_COOKIE)?.value;
  const reveal = raw ? verifyReveal(raw) : null;
  const res = NextResponse.json(reveal ? { ok: true, reveal } : { ok: false, reveal: null });
  res.cookies.set(FB_CONNECT_REVEAL_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
