import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import { conversationPublicId, getCwfConversationById } from '@/lib/cwf-conversations';
import { serializePanelMessages } from '@/lib/panel-message-dto';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const conv = await getCwfConversationById(id);
  if (!conv) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    conversation: {
      id: conversationPublicId(conv),
      conversationId: conv.conversationId,
      senderId: conv.senderId,
      senderName: conv.senderName ?? conv.senderId,
      platform: conv.platform,
      pageId: conv.pageId,
      botPaused: conv.botPaused,
      lastMessageAt: conv.lastMessageAt.toISOString(),
      messages: serializePanelMessages(conv),
    },
  });
}
