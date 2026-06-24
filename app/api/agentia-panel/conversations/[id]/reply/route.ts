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
import { sendWhatsAppCloudText } from '@/lib/whatsapp-cloud';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const text = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!text) {
    return NextResponse.json({ error: 'message requerido' }, { status: 400 });
  }

  const conv = await getPanelConversationById(AGENTIA_PANEL_CLIENT_ID, id);
  if (!conv) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  if (conv.channel === 'whatsapp') {
    const sent = await sendWhatsAppCloudText({
      to: conv.senderId,
      bodyText: text,
      phoneNumberId: getAgentiaWhatsAppPhoneNumberId(),
    });
    if (!sent.ok) {
      return NextResponse.json(
        { error: sent.error || 'No se pudo enviar por WhatsApp', status: sent.status },
        { status: 502 }
      );
    }
  }
  // facebook / instagram: persistir en panel; envío Graph API en fase siguiente

  await appendPanelMessages({
    clientId: AGENTIA_PANEL_CLIENT_ID,
    senderId: conv.senderId,
    senderName: conv.senderName,
    pageId: conv.pageId,
    platform: conv.platform,
    channel: conv.channel,
    entries: [{ role: 'agent', content: text }],
  });

  const updated = await getPanelConversationById(AGENTIA_PANEL_CLIENT_ID, id);
  return NextResponse.json({
    ok: true,
    conversation: updated
      ? {
          id: panelConversationPublicId(updated),
          messages: updated.messages.map((m) => ({
            role: m.role,
            content: m.content,
            at: m.at.toISOString(),
          })),
          lastMessageAt: updated.lastMessageAt.toISOString(),
        }
      : null,
  });
}
