import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import { AGENTIA_PANEL_CLIENT_ID } from '@/lib/agentia-panel';
import { getPanelConversationById, panelConversationPublicId } from '@/lib/panel-conversations';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const conv = await getPanelConversationById(AGENTIA_PANEL_CLIENT_ID, id);
  if (!conv) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    conversation: {
      id: panelConversationPublicId(conv),
      conversationId: conv.conversationId,
      senderId: conv.senderId,
      senderName: conv.senderName ?? conv.senderId,
      channel: conv.channel,
      platform: conv.platform,
      pageId: conv.pageId,
      botPaused: conv.botPaused,
      lastMessageAt: conv.lastMessageAt.toISOString(),
      messages: conv.messages.map((m) => ({
        role: m.role,
        content: m.content,
        at: m.at.toISOString(),
      })),
    },
  });
}
