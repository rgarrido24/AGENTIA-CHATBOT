import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getIzziPanelClientId } from '@/lib/izzi-panel-auth';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

type QrDoc = {
  _id: string;
  qr?: string | null;
  connected?: boolean;
  updatedAt?: Date;
};

/** GET — estado de vinculación y QR vigente del tenant de este usuario. */
export async function GET(req: NextRequest) {
  const clientId = getIzziPanelClientId(req);
  if (!clientId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = await getMongoDb();
    const doc = await db
      .collection<QrDoc>('whatsapp_qr')
      .findOne({ _id: clientId as never });

    const rawQr = typeof doc?.qr === 'string' && doc.qr.length > 0 ? doc.qr : null;
    let qrDataUrl: string | null = null;
    if (rawQr) {
      try {
        qrDataUrl = await QRCode.toDataURL(rawQr, { width: 300, margin: 2 });
      } catch {
        qrDataUrl = null;
      }
    }

    return NextResponse.json({
      clientId,
      connected: doc?.connected ?? false,
      hasQr: !!qrDataUrl,
      qrDataUrl,
      updatedAt: doc?.updatedAt ?? null,
      bridgeSeen: !!doc,
    });
  } catch (err) {
    console.error('[izzi-panel/whatsapp]', err);
    return NextResponse.json({ error: 'Error al consultar el estado' }, { status: 500 });
  }
}

/**
 * POST — fuerza una vinculación nueva: borra la sesión guardada para que
 * el bridge deje de reintentar con credenciales muertas y emita un QR.
 */
export async function POST(req: NextRequest) {
  const clientId = getIzziPanelClientId(req);
  if (!clientId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = await getMongoDb();
    const [sessions] = await Promise.all([
      db.collection('whatsapp_sessions').deleteMany({ clientId }),
      db
        .collection('whatsapp_qr')
        .updateOne(
          { _id: clientId as never },
          { $set: { qr: null, connected: false, updatedAt: new Date(), clientId } },
          { upsert: true },
        ),
    ]);

    return NextResponse.json({
      ok: true,
      clientId,
      sessionsDeleted: sessions.deletedCount,
    });
  } catch (err) {
    console.error('[izzi-panel/whatsapp] POST', err);
    return NextResponse.json({ error: 'No se pudo reiniciar la vinculación' }, { status: 500 });
  }
}
