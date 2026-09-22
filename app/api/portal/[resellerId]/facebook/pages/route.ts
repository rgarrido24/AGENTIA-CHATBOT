import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifyResellerCookie } from '@/lib/reseller-auth';
import {
  FB_CONNECT_REVEAL_COOKIE,
  FB_OAUTH_SESSION_COOKIE,
  loadOauthSession,
} from '@/lib/facebook-lead-connect';

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

  const sessionId = req.cookies.get(FB_OAUTH_SESSION_COOKIE)?.value || '';
  const session = await loadOauthSession(sessionId);
  if (!session || session.resellerId !== resellerId) {
    return NextResponse.json({ error: 'Sesión vencida', code: 'expired' }, { status: 410 });
  }

  return NextResponse.json({
    clientSlug: session.clientSlug,
    pages: session.pages.map((p) => ({ id: p.id, name: p.name })),
  });
}
