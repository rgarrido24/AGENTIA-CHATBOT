import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getMongoDb();
    const messages = await db
      .collection('outbound_messages')
      .find({ sentAt: { $exists: false } })
      .sort({ createdAt: 1 })
      .limit(20)
      .toArray();
    return NextResponse.json({
      messages: messages.map((m) => ({
        _id: String(m._id),
        leadId: m.leadId,
        senderId: m.senderId,
        message: m.message,
        clientId: m.clientId,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 });
    }
    const db = await getMongoDb();
    const { ObjectId } = await import('mongodb');
    let oid;
    try {
      oid = new ObjectId(id);
    } catch {
      return NextResponse.json({ ok: false, error: 'id inválido' }, { status: 400 });
    }
    await db.collection('outbound_messages').updateOne(
      { _id: oid },
      { $set: { sentAt: new Date() } }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
