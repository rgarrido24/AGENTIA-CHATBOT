import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import QRCode from 'qrcode';

interface QrDoc {
  _id: string;
  clientId?: string;
  qr?: string | null;
  connected?: boolean;
  updatedAt?: Date;
}

export async function GET() {
  try {
    const db = await getMongoDb();
    const docs = await db.collection<QrDoc>('whatsapp_qr').find({}).toArray();

    const bridges = await Promise.all(
      docs.map(async (doc) => {
        // Normalize: legacy doc has _id='current', treat as 'agentia'
        const id = doc._id === 'current' ? 'agentia' : String(doc._id);
        const hasQr = typeof doc.qr === 'string' && doc.qr.length > 0;
        let qrDataUrl: string | null = null;
        if (hasQr) {
          try {
            qrDataUrl = await QRCode.toDataURL(doc.qr as string, { width: 280, margin: 2 });
          } catch { /* ignore */ }
        }
        return {
          clientId: id,
          connected: doc.connected ?? false,
          hasQr,
          qrDataUrl,
          updatedAt: doc.updatedAt ?? null,
        };
      })
    );

    // Deduplicate: if both 'current' and 'agentia' exist, keep only 'agentia'
    const seen = new Set<string>();
    const unique = bridges.filter((b) => {
      if (seen.has(b.clientId)) return false;
      seen.add(b.clientId);
      return true;
    });

    return NextResponse.json({ bridges: unique });
  } catch (err) {
    console.error('[whatsapp/status]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
