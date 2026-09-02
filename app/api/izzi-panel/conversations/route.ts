import { NextRequest, NextResponse } from 'next/server';
import { getIzziPanelClientId } from '@/lib/izzi-panel-auth';
import { listIzziConversations } from '@/lib/izzi-conversations';
import { panelConversationPublicId } from '@/lib/panel-conversations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const clientId = getIzziPanelClientId(req);
  if (!clientId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const conversations = await listIzziConversations(clientId, 200);
  return NextResponse.json({
    clientId,
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
      atendidoPor: c.atendidoPor,
    })),
  });
}
