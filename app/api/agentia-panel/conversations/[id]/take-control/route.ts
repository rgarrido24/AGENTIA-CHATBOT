import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import { AGENTIA_PANEL_CLIENT_ID } from '@/lib/agentia-panel';
import { getPanelConversationById, setPanelConversationPaused } from '@/lib/panel-conversations';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const conv = await getPanelConversationById(AGENTIA_PANEL_CLIENT_ID, id);
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
        clientId: AGENTIA_PANEL_CLIENT_ID,
        senderId: conv.senderId,
        pageId: conv.pageId,
        platform: conv.platform,
        status: 'nuevos',
        pipeline: 'agentia',
        messageCount: 0,
        tags: [],
        createdAt: now,
      },
    },
    { upsert: true }
  );
  await setPanelConversationPaused(AGENTIA_PANEL_CLIENT_ID, id, true);

  return NextResponse.json({ ok: true, botPaused: true });
}
