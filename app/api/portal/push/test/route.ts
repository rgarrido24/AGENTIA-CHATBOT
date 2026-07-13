import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getResellerAuth } from '@/lib/reseller-auth';
import { verifyClientCookie, CLIENT_COOKIE_NAME } from '@/lib/client-auth';
import { notifyPortalNewLead } from '@/lib/portal-push';

export const dynamic = 'force-dynamic';

async function isAuthorized(resellerId: string, clientSlug: string): Promise<boolean> {
  const reseller = await getResellerAuth(resellerId);
  if (reseller) return true;
  const cookieStore = await cookies();
  const clientCookie = cookieStore.get(CLIENT_COOKIE_NAME)?.value;
  return verifyClientCookie(clientCookie, resellerId, clientSlug);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const resellerId = typeof body?.resellerId === 'string' ? body.resellerId.trim() : '';
  const clientSlug = typeof body?.clientSlug === 'string' ? body.clientSlug.trim() : '';

  if (!resellerId || !clientSlug) {
    return NextResponse.json({ error: 'Faltan resellerId o clientSlug' }, { status: 400 });
  }

  if (!(await isAuthorized(resellerId, clientSlug))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const leadId = `test-push_${Date.now()}`;
  try {
    const result = await notifyPortalNewLead({
      resellerId,
      clientSlug,
      leadId,
      nombre: 'Lead de prueba',
      telefono: '5550000000',
    });
    return NextResponse.json({ ok: true, leadId, sent: result.sent, total: result.total });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al enviar push' },
      { status: 500 },
    );
  }
}
