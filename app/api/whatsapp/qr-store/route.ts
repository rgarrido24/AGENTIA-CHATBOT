import { NextRequest } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

/**
 * El WhatsApp Bridge (scripts/whatsapp-bridge.js) envía el QR aquí cuando lo recibe.
 * Protegido con WHATSAPP_QR_SECRET.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.WHATSAPP_QR_SECRET;
  // Si el servidor NO tiene WHATSAPP_QR_SECRET, aceptamos el POST sin auth (para que el puente en Render funcione sin config extra).
  if (secret && secret.trim() !== '' && authHeader !== `Bearer ${secret.trim()}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const qr = body?.qr;
    if (typeof qr !== 'string' || !qr.trim()) {
      return Response.json({ error: 'qr requerido (string)' }, { status: 400 });
    }

    const qrTrimmed = qr.trim();
    // Reintento una vez si MongoDB no está listo (cold start)
    let db;
    try {
      db = await getMongoDb();
    } catch (firstErr) {
      await new Promise((r) => setTimeout(r, 2000));
      db = await getMongoDb();
    }
    await db.collection('whatsapp_qr').updateOne(
      { _id: 'current' as any },
      { $set: { qr: qrTrimmed, updatedAt: new Date() } },
      { upsert: true }
    );

    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[qr-store] Error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
