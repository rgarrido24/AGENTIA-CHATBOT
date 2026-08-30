import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { getLeadById } from '@/src/lib/leads';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const leadId = typeof body.leadId === 'string' ? body.leadId.trim() : null;
    const message = typeof body.message === 'string' ? body.message.trim() : null;
    if (!leadId || !message) {
      return NextResponse.json({ ok: false, error: 'leadId y message requeridos' }, { status: 400 });
    }

    const lead = await getLeadById(leadId);
    if (!lead || !lead.senderId) {
      return NextResponse.json({ ok: false, error: 'Lead no encontrado o sin senderId' }, { status: 404 });
    }

    const db = await getMongoDb();
    await db.collection('outbound_messages').insertOne({
      leadId,
      senderId: lead.senderId,
      clientId: lead.clientId,
      message,
      createdAt: new Date(),
    });

    await db.collection('leads').updateOne(
      { leadId },
      {
        $set: {
          lastReply: message,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    await db.collection('chat_messages').insertOne({
      leadId,
      role: 'admin',
      content: message,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al enviar';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
