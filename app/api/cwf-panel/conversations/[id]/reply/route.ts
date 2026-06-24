import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import {
  appendCwfMessages,
  conversationPublicId,
  getCwfConversationById,
} from '@/lib/cwf-conversations';
import { sendCwfWhatsAppText } from '@/lib/cwf-whatsapp';

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

  const conv = await getCwfConversationById(id);
  if (!conv) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  const sent = await sendCwfWhatsAppText(conv.senderId, text);
  if (!sent.ok) {
    return NextResponse.json(
      { error: sent.error || 'No se pudo enviar por WhatsApp', status: sent.status },
      { status: 502 }
    );
  }

  await appendCwfMessages({
    senderId: conv.senderId,
    senderName: conv.senderName,
    pageId: conv.pageId,
    platform: conv.platform,
    entries: [{ role: 'agent', content: text }],
  });

  const updated = await getCwfConversationById(id);
  return NextResponse.json({
    ok: true,
    conversation: updated
      ? {
          id: conversationPublicId(updated),
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
