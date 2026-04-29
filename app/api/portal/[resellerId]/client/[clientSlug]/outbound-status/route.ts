import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME, type ResellerClient } from '@/lib/reseller-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { resellerId: string; clientSlug: string } }
) {
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
  if (!alertNumber) return NextResponse.json({ error: 'Cliente sin alertNumber' }, { status: 400 });

  const items = await db
    .collection('outbound_messages')
    .find({ senderId: alertNumber })
    .sort({ createdAt: -1 })
    .limit(10)
    .project({ _id: 1, source: 1, createdAt: 1, sentAt: 1, message: 1, attempts: 1, lastError: 1, lastAttemptAt: 1 })
    .toArray();

  const pendingCount = await db.collection('outbound_messages').countDocuments({ senderId: alertNumber, sentAt: { $exists: false } });

  return NextResponse.json({
    ok: true,
    alertNumber,
    pendingCount,
    items: items.map((m: any) => ({
      id: String(m._id),
      source: String(m.source || ''),
      createdAt: m.createdAt || null,
      sentAt: m.sentAt || null,
      attempts: Number(m.attempts || 0),
      lastAttemptAt: m.lastAttemptAt || null,
      lastError: m.lastError ? String(m.lastError).slice(0, 500) : null,
      message: String(m.message || ''),
    })),
  });
}

