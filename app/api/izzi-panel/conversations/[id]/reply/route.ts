import { NextRequest, NextResponse } from 'next/server';
import { isIzziPanelAuthenticated } from '@/lib/izzi-panel-auth';
import {
  appendIzziMessages,
  getIzziConversationById,
} from '@/lib/izzi-conversations';
import { panelConversationPublicId } from '@/lib/panel-conversations';
import { serializePanelMessages } from '@/lib/panel-message-dto';
import { parsePanelReplyRequest, sendPanelWhatsAppReply } from '@/lib/panel-reply-route';
import { sendIzziWhatsAppMedia, sendIzziWhatsAppText } from '@/lib/izzi-whatsapp';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  if (!isIzziPanelAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const parsed = await parsePanelReplyRequest(req);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const conv = await getIzziConversationById(id);
  if (!conv) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }
  if (!conv.botPaused) {
    return NextResponse.json({ error: 'Toma control primero para responder' }, { status: 403 });
  }

  const result = await sendPanelWhatsAppReply(
    conv,
    parsed,
    {
      sendText: sendIzziWhatsAppText,
      sendMedia: sendIzziWhatsAppMedia,
    },
    `panel-izzi/${conv.conversationId}`
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error, status: result.status }, { status: result.status });
  }

  await appendIzziMessages({
    senderId: conv.senderId,
    senderName: conv.senderName,
    pageId: conv.pageId,
    platform: conv.platform,
    entries: [result.entry],
  });

  const updated = await getIzziConversationById(id);
  return NextResponse.json({
    ok: true,
    conversation: updated
      ? {
          id: panelConversationPublicId(updated),
          messages: serializePanelMessages(updated),
          lastMessageAt: updated.lastMessageAt.toISOString(),
        }
      : null,
  });
}
