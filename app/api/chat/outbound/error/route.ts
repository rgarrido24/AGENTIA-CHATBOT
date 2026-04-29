import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (secret && secret.trim() !== '' && authHeader !== `Bearer ${secret.trim()}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const id = typeof body?.id === 'string' ? body.id.trim() : '';
    const error = typeof body?.error === 'string' ? body.error.slice(0, 500) : 'Error';
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const db = await getMongoDb();
    const { ObjectId } = await import('mongodb');
    let oid: any;
    try {
      oid = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    await db.collection('outbound_messages').updateOne(
      { _id: oid },
      {
        $set: { lastError: error, lastAttemptAt: new Date() },
        $inc: { attempts: 1 },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

