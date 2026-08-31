import { NextRequest, NextResponse } from 'next/server';
import { getIzziPanelClientId } from '@/lib/izzi-panel-auth';
import {
  getIzziConversationById,
  setIzziConversationPaused,
} from '@/lib/izzi-conversations';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const clientId = getIzziPanelClientId(req);
  if (!clientId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const conv = await getIzziConversationById(clientId, id);
  if (!conv) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  const now = new Date();
  const db = await getMongoDb();
  await db.collection('leads').updateOne(
    { leadId: conv.conversationId },
    {
      $set: { bot_status: 'paused', updatedAt: now },
      $setOnInsert: {
        leadId: conv.conversationId,
        clientId,
        senderId: conv.senderId,
        pageId: conv.pageId,
        platform: conv.platform,
        status: 'nuevos',
        messageCount: 0,
        tags: [],
        createdAt: now,
      },
    },
    { upsert: true }
  );
  await setIzziConversationPaused(clientId, id, true);

  return NextResponse.json({ ok: true, botPaused: true });
}
