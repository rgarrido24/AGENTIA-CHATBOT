import { NextRequest } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

/**
 * El WhatsApp Bridge (scripts/whatsapp-bridge.js) envía el QR aquí cuando lo recibe.
 * Protegido con WHATSAPP_QR_SECRET.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.WHATSAPP_QR_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const qr = body?.qr;
    if (typeof qr !== 'string' || !qr.trim()) {
      return Response.json({ error: 'qr requerido (string)' }, { status: 400 });
    }

    const db = await getMongoDb();
    await db.collection('whatsapp_qr').updateOne(
      { _id: 'current' as any },
      { $set: { qr: qr.trim(), updatedAt: new Date() } },
      { upsert: true }
    );

    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
