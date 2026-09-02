import { NextRequest, NextResponse } from 'next/server';
import { getIzziPanelClientId } from '@/lib/izzi-panel-auth';
import { getMongoDb } from '@/lib/mongodb';
import { getIzziWhatsAppStatus } from '@/lib/izzi-whatsapp-status';

export const dynamic = 'force-dynamic';

/** GET — estado de vinculación y QR vigente del tenant de este usuario. */
export async function GET(req: NextRequest) {
  const clientId = getIzziPanelClientId(req);
  if (!clientId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const status = await getIzziWhatsAppStatus(clientId);
    return NextResponse.json({ clientId, ...status });
  } catch (err) {
    console.error('[izzi-panel/whatsapp]', err);
    return NextResponse.json({ error: 'Error al consultar el estado' }, { status: 500 });
  }
}

/**
 * POST — pide un QR nuevo. El worker (whatsapp-web.js o Baileys) borra la
 * sesión en disco/Mongo y vuelve a emitir el código. No basta con apagar el
 * flag `connected`: si el teléfono ya se desvinculó, hay que tirar LocalAuth.
 */
export async function POST(req: NextRequest) {
  const clientId = getIzziPanelClientId(req);
  if (!clientId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = await getMongoDb();
    const now = new Date();
    const [sessions] = await Promise.all([
      db.collection('whatsapp_sessions').deleteMany({ clientId }),
      db.collection('whatsapp_qr').updateOne(
        { _id: clientId as never },
        {
          $set: {
            qr: null,
            connected: false,
            updatedAt: now,
            clientId,
            resetRequestedAt: now,
            resetRequestedBy: 'izzi-panel',
          },
        },
        { upsert: true }
      ),
    ]);

    return NextResponse.json({
      ok: true,
      clientId,
      sessionsDeleted: sessions.deletedCount,
      resetRequested: true,
    });
  } catch (err) {
    console.error('[izzi-panel/whatsapp] POST', err);
    return NextResponse.json({ error: 'No se pudo reiniciar la vinculación' }, { status: 500 });
  }
}
