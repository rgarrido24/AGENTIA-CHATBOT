import { NextRequest } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

/**
 * POST /api/whatsapp/qr-store
 * El WhatsApp Bridge envía el QR aquí cuando lo recibe.
 * Body: { qr?: string, clientId?: string, connected?: boolean }
 * Protegido con WHATSAPP_QR_SECRET.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.WHATSAPP_QR_SECRET;
  if (secret && secret.trim() !== '' && authHeader !== `Bearer ${secret.trim()}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const clientId: string = (body?.clientId ?? 'agentia').toString().trim().toLowerCase() || 'agentia';
    const connected: boolean | undefined = typeof body?.connected === 'boolean' ? body.connected : undefined;
    const qr: string | undefined = typeof body?.qr === 'string' && body.qr.trim() ? body.qr.trim() : undefined;

    // Require either qr or connected status
    if (qr === undefined && connected === undefined) {
      return Response.json({ error: 'Se requiere qr o connected en el body' }, { status: 400 });
    }

    let db;
    try {
      db = await getMongoDb();
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
      db = await getMongoDb();
    }

    const existing = await db.collection('whatsapp_qr').findOne({ _id: clientId as never });
    const resetPending = !!(existing as { resetRequestedAt?: Date } | null)?.resetRequestedAt;

    // Un worker con sesión vieja no debe volver a marcar "conectado" mientras
    // el panel pidió un QR nuevo (el teléfono ya se desvinculó).
    if (resetPending && connected === true && qr === undefined) {
      return Response.json({ ok: true, ignored: 'reset_pending' });
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };
    const unset: Record<string, string> = {};
    if (qr !== undefined) {
      update.qr = qr;
      update.connected = false; // QR present means not yet connected
      unset.resetRequestedAt = '';
      unset.resetRequestedBy = '';
    }
    if (connected !== undefined) {
      update.connected = connected;
      if (connected) update.qr = null; // Clear QR once connected
    }

    const mongoUpdate: Record<string, unknown> = {
      $set: update,
      $setOnInsert: { clientId },
    };
    if (Object.keys(unset).length) mongoUpdate.$unset = unset;

    await db.collection('whatsapp_qr').updateOne(
      { _id: clientId as any },
      mongoUpdate as any,
      { upsert: true }
    );

    // Migrate legacy 'current' doc: if clientId is 'agentia', also keep 'current' for backwards compat
    if (clientId === 'agentia' && qr !== undefined) {
      await db.collection('whatsapp_qr').updateOne(
        { _id: 'current' as any },
        { $set: { qr, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[qr-store] Error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
