import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getResellerAuth } from '@/lib/reseller-auth';
import { verifyClientCookie, CLIENT_COOKIE_NAME } from '@/lib/client-auth';
import { notifyPortalNewLead } from '@/lib/portal-push';
import { getMongoDb } from '@/lib/mongodb';

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
  // En cuentas demo la alerta de prueba se ve como un lead real (nombre y teléfono de ejemplo).
  let nombre = 'Lead de prueba';
  let telefono = '5550000000';
  try {
    const db = await getMongoDb();
    const demo = await db.collection('leads').findOne({ _collection_type: 'reseller_client', resellerId, clientSlug, es_demo: true }, { projection: { _id: 1 } });
    if (demo) {
      const l = await db.collection('leads').findOne(
        { resellerId, clientSlug, es_demo: true, _collection_type: { $ne: 'reseller_client' } },
        { sort: { createdAt: -1 }, projection: { nombre: 1, telefono: 1 } },
      );
      if (l?.nombre) { nombre = String(l.nombre); telefono = String(l.telefono ?? telefono); }
    }
  } catch { /* si falla, se usa el texto de prueba */ }
  try {
    const result = await notifyPortalNewLead({
      resellerId,
      clientSlug,
      leadId,
      nombre,
      telefono,
    });
    return NextResponse.json({ ok: true, leadId, sent: result.sent, total: result.total });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al enviar push' },
      { status: 500 },
    );
  }
}
