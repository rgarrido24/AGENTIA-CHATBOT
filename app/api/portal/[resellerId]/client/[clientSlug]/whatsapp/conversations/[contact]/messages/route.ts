import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { authWaRoute } from '@/lib/wa-route-auth';
import { WA_MESSAGES, decryptWaToken, type WaMessageDoc } from '@/lib/wa-accounts';
import { WA_CONVERSATIONS, SESSION_WINDOW_MS, contactKey, sendWaReadReceipt, touchConversation, windowOpen, type WaConversationDoc } from '@/lib/wa-inbox';
import { sendWhatsAppCloudText } from '@/lib/whatsapp-cloud';

export const dynamic = 'force-dynamic';

type Ctx = { params: { resellerId: string; clientSlug: string; contact: string } };

const scope = (p: Ctx['params']) => ({ resellerId: p.resellerId, clientSlug: p.clientSlug, contactKey: contactKey(p.contact) });

/** Mensajes de una conversación. Con ?markRead=1 se pone en cero lo no leído y se manda el acuse de lectura. */
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authWaRoute(req, ctx.params);
  if (auth.error) return auth.error;
  const db = await getMongoDb();
  const conv = await db.collection<WaConversationDoc>(WA_CONVERSATIONS).findOne(scope(ctx.params));
  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });

  if (req.nextUrl.searchParams.get('markRead') === '1' && conv.unread > 0) {
    await db.collection(WA_CONVERSATIONS).updateOne(scope(ctx.params), { $set: { unread: 0 } });
    if (auth.account && conv.lastInboundWamid) void sendWaReadReceipt(auth.account, conv.lastInboundWamid);
  }

  const msgs = await db
    .collection<WaMessageDoc>(WA_MESSAGES)
    .find({ resellerId: ctx.params.resellerId, clientSlug: ctx.params.clientSlug, contactKey: conv.contactKey })
    .sort({ createdAt: -1 })
    .limit(150)
    .toArray();
  msgs.reverse();

  const open = windowOpen(conv.lastInboundAt);
  return NextResponse.json({
    ok: true,
    name: conv.name || '',
    contactKey: conv.contactKey,
    windowOpen: open,
    windowClosesAt: open && conv.lastInboundAt ? new Date(new Date(conv.lastInboundAt).getTime() + SESSION_WINDOW_MS) : null,
    messages: msgs.map((m) => ({
      direction: m.direction,
      text: m.text || (m.type ? `[${m.type}]` : ''),
      caption: m.caption || null,
      media: m.media ? { id: m.media.id, mime: m.media.mime || null, filename: m.media.filename || null, voice: m.media.voice === true } : null,
      location: m.location || null,
      type: m.type || 'text',
      status: m.status || null,
      errorCode: m.errorCode || null,
      createdAt: m.createdAt,
    })),
  });
}

/** Responde con texto libre. Solo se puede dentro de las 24 h posteriores al último mensaje de la persona. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await authWaRoute(req, ctx.params, true);
  if (auth.error) return auth.error;
  const account = auth.account!;
  const body = (await req.json().catch(() => ({}))) as { text?: unknown };
  const text = String(body.text ?? '').trim();
  if (!text || text.length > 4000) {
    return NextResponse.json({ error: 'Escribe un mensaje (máx. 4000 caracteres)' }, { status: 400 });
  }
  const db = await getMongoDb();
  const conv = await db.collection<WaConversationDoc>(WA_CONVERSATIONS).findOne(scope(ctx.params));
  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  if (!windowOpen(conv.lastInboundAt)) {
    return NextResponse.json(
      { error: 'Pasaron más de 24 horas desde el último mensaje de esta persona. WhatsApp solo permite enviarle una plantilla aprobada (desde Campañas).', windowClosed: true },
      { status: 409 },
    );
  }

  const out = await sendWhatsAppCloudText({
    to: conv.waId,
    bodyText: text,
    phoneNumberId: account.phoneNumberId,
    accessToken: decryptWaToken(account),
  });
  if (!out.ok || !out.messageId) {
    return NextResponse.json({ error: out.error || 'Meta no aceptó el mensaje' }, { status: 502 });
  }
  const now = new Date();
  await db.collection<WaMessageDoc>(WA_MESSAGES).insertOne({
    resellerId: ctx.params.resellerId,
    clientSlug: ctx.params.clientSlug,
    phoneNumberId: account.phoneNumberId,
    direction: 'out',
    wamid: out.messageId,
    contact: conv.waId,
    contactKey: conv.contactKey,
    type: 'text',
    text,
    status: 'sent',
    createdAt: now,
    updatedAt: now,
  });
  await touchConversation({ resellerId: ctx.params.resellerId, clientSlug: ctx.params.clientSlug, contact: conv.waId, direction: 'out', text, at: now });
  return NextResponse.json({ ok: true });
}
