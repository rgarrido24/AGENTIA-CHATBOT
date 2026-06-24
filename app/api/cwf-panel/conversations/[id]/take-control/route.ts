import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import { getCwfConversationById, setCwfConversationPaused, CWF_CLIENT_ID } from '@/lib/cwf-conversations';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const conv = await getCwfConversationById(id);
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
        clientId: CWF_CLIENT_ID,
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
  await setCwfConversationPaused(id, true);

  return NextResponse.json({ ok: true, botPaused: true });
}
