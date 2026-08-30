import { NextRequest, NextResponse } from 'next/server';
import { isIzziPanelAuthenticated } from '@/lib/izzi-panel-auth';
import { listIzziConversations } from '@/lib/izzi-conversations';
import { panelConversationPublicId } from '@/lib/panel-conversations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isIzziPanelAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const conversations = await listIzziConversations(200);
  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: panelConversationPublicId(c),
      conversationId: c.conversationId,
      senderId: c.senderId,
      senderName: c.senderName ?? c.senderId,
      platform: c.platform,
      lastMessage: c.lastMessage ?? c.messages[c.messages.length - 1]?.content ?? '',
      lastMessageAt: c.lastMessageAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      messageCount: c.messages.length,
      botPaused: c.botPaused,
      tipo: c.tipo,
      etapa: c.etapa,
      notas: c.notas,
    })),
  });
}
