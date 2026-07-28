import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import {
  AGENTIA_PANEL_CLIENT_ID,
  getAgentiaWhatsAppPhoneNumberId,
} from '@/lib/agentia-panel';
import {
  appendPanelMessages,
  getPanelConversationById,
  panelConversationPublicId,
} from '@/lib/panel-conversations';
import { serializePanelMessages } from '@/lib/panel-message-dto';
import { parsePanelReplyRequest, sendPanelWhatsAppReply, buildAttachmentFromPayload } from '@/lib/panel-reply-route';
import { sendWhatsAppCloudMedia, sendWhatsAppCloudText } from '@/lib/whatsapp-cloud';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

const agentiaPhoneId = () => getAgentiaWhatsAppPhoneNumberId();

export async function POST(req: NextRequest, ctx: RouteCtx) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const parsed = await parsePanelReplyRequest(req);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const conv = await getPanelConversationById(AGENTIA_PANEL_CLIENT_ID, id);
  if (!conv) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  let entry: {
    role: 'agent';
    content: string;
    mediaType?: 'image' | 'document';
    mediaUrl?: string;
    fileName?: string;
    waMessageId?: string;
    deliveryStatus?: 'sent' | 'failed';
  };

  if (conv.channel === 'whatsapp') {
    const result = await sendPanelWhatsAppReply(
      conv,
      parsed,
      {
        sendText: (to, text) =>
          sendWhatsAppCloudText({ to, bodyText: text, phoneNumberId: agentiaPhoneId() }),
        sendMedia: (to, params) =>
          sendWhatsAppCloudMedia({ to, ...params, phoneNumberId: agentiaPhoneId() }),
      },
      `panel-agentia/${conv.conversationId}`,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error, status: result.status }, { status: result.status });
    }
    entry = result.entry;
  } else if (parsed.kind === 'attachment') {
    const prepared = await buildAttachmentFromPayload(
      parsed,
      `panel-agentia/${conv.conversationId}`,
    );
    if (!prepared.ok) {
      return NextResponse.json({ error: prepared.error }, { status: prepared.status });
    }
    entry = {
      role: 'agent',
      content: prepared.data.caption,
      mediaType: prepared.data.mediaType,
      mediaUrl: prepared.data.mediaUrl,
      fileName: prepared.data.fileName,
    };
  } else {
    entry = { role: 'agent', content: parsed.text };
  }

  await appendPanelMessages({
    clientId: AGENTIA_PANEL_CLIENT_ID,
    senderId: conv.senderId,
    senderName: conv.senderName,
    pageId: conv.pageId,
    platform: conv.platform,
    channel: conv.channel,
    entries: [entry],
  });

  const updated = await getPanelConversationById(AGENTIA_PANEL_CLIENT_ID, id);
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
