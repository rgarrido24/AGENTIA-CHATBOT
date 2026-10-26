import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { authWaRoute } from '@/lib/wa-route-auth';
import { WA_MESSAGES, type WaMessageDoc } from '@/lib/wa-accounts';
import { WA_CONVERSATIONS, contactKey, touchConversation, windowOpen, type WaConversationDoc } from '@/lib/wa-inbox';
import { classifyOutboundFile, sendWaAttachment } from '@/lib/wa-media';

export const dynamic = 'force-dynamic';

type Ctx = { params: { resellerId: string; clientSlug: string; contact: string } };

const LABEL = { image: '📷 Imagen', audio: '🎤 Audio', video: '🎥 Video', document: '📄 Documento' } as const;

/** Responde con un archivo (foto, audio, video o documento). Mismas reglas que el texto: solo dentro de las 24 h. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await authWaRoute(req, ctx.params, true);
  if (auth.error) return auth.error;
  const account = auth.account!;

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!form || !(file instanceof File)) return NextResponse.json({ error: 'Elige un archivo' }, { status: 400 });
  const caption = String(form.get('caption') ?? '').trim().slice(0, 1024);

  const cls = classifyOutboundFile(file.type || '', file.size);
  if (!cls.ok) return NextResponse.json({ error: cls.error }, { status: 400 });

  const db = await getMongoDb();
  const key = contactKey(ctx.params.contact);
  const conv = await db
    .collection<WaConversationDoc>(WA_CONVERSATIONS)
    .findOne({ resellerId: ctx.params.resellerId, clientSlug: ctx.params.clientSlug, contactKey: key });
  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  if (!windowOpen(conv.lastInboundAt)) {
    return NextResponse.json(
      { error: 'Pasaron más de 24 horas desde el último mensaje de esta persona. WhatsApp solo permite enviarle una plantilla aprobada (desde Campañas).', windowClosed: true },
      { status: 409 },
    );
  }

  const filename = (file.name || 'archivo').replace(/[^\w.\- ]/g, '_').slice(0, 120);
  const sent = await sendWaAttachment(
    account,
    conv.waId,
    { bytes: Buffer.from(await file.arrayBuffer()), mime: cls.mime, filename, kind: cls.kind },
    caption,
  );
  if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 502 });

  const now = new Date();
  const shown = caption && cls.kind !== 'audio' ? `${LABEL[cls.kind]}: ${caption}` : LABEL[cls.kind];
  await db.collection<WaMessageDoc>(WA_MESSAGES).insertOne({
    resellerId: ctx.params.resellerId,
    clientSlug: ctx.params.clientSlug,
    phoneNumberId: account.phoneNumberId,
    direction: 'out',
    wamid: sent.wamid,
    contact: conv.waId,
    contactKey: conv.contactKey,
    type: cls.kind,
    text: shown,
    ...(caption && cls.kind !== 'audio' ? { caption } : {}),
    media: { id: sent.mediaId, mime: cls.mime, filename },
    status: 'sent',
    createdAt: now,
    updatedAt: now,
  });
  await touchConversation({ resellerId: ctx.params.resellerId, clientSlug: ctx.params.clientSlug, contact: conv.waId, direction: 'out', text: shown, at: now });
  return NextResponse.json({ ok: true });
}
