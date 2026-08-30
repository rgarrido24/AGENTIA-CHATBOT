import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME, type ResellerClient } from '@/lib/reseller-auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { resellerId: string; clientSlug: string } }
) {
  // Seguridad operativa: esto se usó solo para pruebas internas.
  // En producción queda apagado a menos que se habilite explícitamente.
  const enabled =
    String(process.env.AGENTIA_ENABLE_PORTAL_TEST_ALERTS || '').trim().toLowerCase() === 'true';
  if (process.env.NODE_ENV === 'production' && !enabled) {
    return NextResponse.json({ error: 'No disponible' }, { status: 404 });
  }

  const { resellerId, clientSlug } = params;
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  const reseller = await verifyResellerCookie(cookieValue);
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db = await getMongoDb();
  const client = await db.collection<ResellerClient>('leads').findOne({
    resellerId,
    clientSlug,
    _collection_type: 'reseller_client',
  });
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const alertNumber = String((client as any).alertNumber || '').replace(/\D/g, '');
  if (!alertNumber) {
    return NextResponse.json({ error: 'Cliente sin alertNumber configurado' }, { status: 400 });
  }

  // Cache-buster para forzar refresh del preview OG en WhatsApp.
  const portalUrl = `https://agentia.software/portal/${resellerId}/cliente/${clientSlug}?lid=${Date.now()}`;
  const message =
    `🚨 ATENCION🚨\n` +
    `¡Nuevo ingreso de LEAD!\n\n` +
    `Vistita tu panel para contactarlo👇\n` +
    portalUrl;

  await db.collection('outbound_messages').insertOne({
    senderId: alertNumber,
    clientId: (client as any).legacyQuery?.clientId || 'agentia-ventas',
    leadId: `test-alert_${resellerId}_${clientSlug}_${Date.now()}`,
    source: 'admin-alert-test',
    message,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true, alertNumber, portalUrl });
}

