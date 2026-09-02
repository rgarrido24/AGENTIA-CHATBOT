import { NextRequest, NextResponse } from 'next/server';
import { getIzziPanelClientId } from '@/lib/izzi-panel-auth';
import { getIzziConversationById } from '@/lib/izzi-conversations';
import { panelConversationPublicId } from '@/lib/panel-conversations';
import { serializePanelMessages } from '@/lib/panel-message-dto';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const clientId = getIzziPanelClientId(req);
  if (!clientId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const conv = await getIzziConversationById(clientId, id);
  if (!conv) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    conversation: {
      id: panelConversationPublicId(conv),
      conversationId: conv.conversationId,
      senderId: conv.senderId,
      senderName: conv.senderName ?? conv.senderId,
      platform: conv.platform,
      pageId: conv.pageId,
      botPaused: conv.botPaused,
      lastMessageAt: conv.lastMessageAt.toISOString(),
      createdAt: conv.createdAt.toISOString(),
      tipo: conv.tipo,
      etapa: conv.etapa,
      notas: conv.notas,
      atendidoPor: conv.atendidoPor,
      messages: serializePanelMessages(conv),
    },
  });
}
