import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import {
  appendCwfMessages,
  conversationPublicId,
  getCwfConversationById,
} from '@/lib/cwf-conversations';
import { serializePanelMessages } from '@/lib/panel-message-dto';
import { parsePanelReplyRequest, sendPanelWhatsAppReply } from '@/lib/panel-reply-route';
import { sendCwfWhatsAppMedia, sendCwfWhatsAppText } from '@/lib/cwf-whatsapp';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const parsed = await parsePanelReplyRequest(req);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const conv = await getCwfConversationById(id);
  if (!conv) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  const result = await sendPanelWhatsAppReply(conv, parsed, {
    sendText: sendCwfWhatsAppText,
    sendMedia: sendCwfWhatsAppMedia,
  }, `panel-cwf/${conv.conversationId}`);

  if (!result.ok) {
    return NextResponse.json({ error: result.error, status: result.status }, { status: result.status });
  }

  await appendCwfMessages({
    senderId: conv.senderId,
    senderName: conv.senderName,
    pageId: conv.pageId,
    platform: conv.platform,
    entries: [result.entry],
  });

  const updated = await getCwfConversationById(id);
  return NextResponse.json({
    ok: true,
    conversation: updated
      ? {
          id: conversationPublicId(updated),
          messages: serializePanelMessages(updated),
          lastMessageAt: updated.lastMessageAt.toISOString(),
        }
      : null,
  });
}
