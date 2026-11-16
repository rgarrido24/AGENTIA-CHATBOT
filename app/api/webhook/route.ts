import { NextRequest, NextResponse } from 'next/server';
import { resolveBusinessConfigByPageId } from '@/src/lib/business-config';
import { getMongoDb } from '@/lib/mongodb';

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1).trim();
  return trimmed;
}

function pickFirstString(...vals: any[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function inferPlatform(body: any): 'facebook' | 'instagram' | 'whatsapp' {
  const obj = String(body?.object ?? '').toLowerCase();
  if (obj.includes('instagram')) return 'instagram';
  return 'facebook';
}

async function getFacebookUserName(
  accessToken: string,
  userId: string
): Promise<string | undefined> {
  try {
    const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(userId)}?fields=name&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const json = (await res.json()) as { name?: string };
    return typeof json?.name === 'string' ? json.name.trim() : undefined;
  } catch {
    return undefined;
  }
}

/** Descarga imagen de URL (Facebook suele devolver URL con token) y devuelve base64 + mimeType. */
async function fetchImageAsBase64(
  url: string,
  accessToken: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const urlWithToken = url.includes('?') ? `${url}&access_token=${encodeURIComponent(accessToken)}` : `${url}?access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(urlWithToken);
    if (!res.ok) return null;
    const blob = await res.blob();
    const buf = await blob.arrayBuffer();
    const base64 = Buffer.from(buf).toString('base64');
    const mimeType = blob.type || 'image/jpeg';
    return { base64, mimeType };
  } catch {
    return null;
  }
}

async function sendMessengerReply(params: {
  accessToken: string;
  recipientId: string;
  text: string;
}) {
  const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${encodeURIComponent(params.accessToken)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_type: 'RESPONSE',
      recipient: { id: params.recipientId },
      message: { text: params.text },
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Send API failed: ${res.status} ${res.statusText} ${t}`);
  }
}

async function replyToComment(params: {
  accessToken: string;
  commentId: string;
  text: string;
}) {
  const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(params.commentId)}/comments?access_token=${encodeURIComponent(params.accessToken)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: params.text }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Comment reply failed: ${res.status} ${res.statusText} ${t}`);
  }
}

/** Respuesta privada a un comentario: Meta exige recipient.comment_id (no el id del usuario). */
async function sendPrivateReplyToComment(params: {
  accessToken: string;
  commentId: string;
  text: string;
}) {
  const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${encodeURIComponent(params.accessToken)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { comment_id: params.commentId },
      message: { text: params.text },
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Private reply failed: ${res.status} ${res.statusText} ${t}`);
  }
}

/** Meta reintenta webhooks: evita contestar dos veces el mismo evento. true = ya procesado. */
async function alreadyProcessed(key: string): Promise<boolean> {
  try {
    const db = await getMongoDb();
    const col = db.collection('webhook_events_social');
    await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 3 }).catch(() => {});
    const r = await col.updateOne(
      { _id: key as any },
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    return r.upsertedCount === 0;
  } catch (e) {
    console.log('[webhook][dedupe] error (se procesa igual):', e);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const expectedToken = getEnv('META_VERIFY_TOKEN');
    if (!expectedToken) {
      console.log('[webhook][verify] META_VERIFY_TOKEN no configurado');
      return NextResponse.json({ error: 'META_VERIFY_TOKEN not configured' }, { status: 403 });
    }

    if (mode === 'subscribe' && token === expectedToken) {
      return new NextResponse(challenge ?? '', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (err) {
    console.log('[webhook] GET error:', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const entries: any[] = Array.isArray(body?.entry) && body.entry.length ? body.entry : [undefined];
    let last: any = { received: true };
    for (const entry of entries) {
      for (const item of splitEntry(entry)) {
        const r = await handleEvent(request, { ...body, entry: [item] });
        if (r) last = r;
      }
    }
    return NextResponse.json({ status: 'EVENT_RECEIVED', ...last });
  } catch (err) {
    console.log('[webhook] unhandled error:', err);
    return NextResponse.json({ status: 'EVENT_RECEIVED', received: true });
  }
}

/** Meta agrupa varios eventos en un mismo entry: los separa para procesar cada uno. */
function splitEntry(entry: any): any[] {
  if (!entry) return [entry];
  const out: any[] = [];
  const msgs: any[] = Array.isArray(entry.messaging) ? entry.messaging : [];
  const chs: any[] = Array.isArray(entry.changes) ? entry.changes : [];
  for (const m of msgs) out.push({ ...entry, messaging: [m], changes: undefined });
  for (const c of chs) out.push({ ...entry, changes: [c], messaging: undefined });
  return out.length ? out : [entry];
}

async function handleEvent(request: NextRequest, body: any): Promise<any> {
  try {
    const summary: any = { received: true };

    const entry0 = body?.entry?.[0];
    const pageId =
      pickFirstString(entry0?.id) ??
      pickFirstString(entry0?.messaging?.[0]?.recipient?.id) ??
      pickFirstString(body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id);

    const messaging0 = entry0?.messaging?.[0];
    const textDm = pickFirstString(messaging0?.message?.text);
    const senderId = pickFirstString(messaging0?.sender?.id);
    const attachments = Array.isArray(messaging0?.message?.attachments) ? messaging0.message.attachments : [];
    const imageAttachment = attachments.find((a: { type?: string }) => a?.type === 'image');
    const imageUrl = imageAttachment?.payload?.url ? String(imageAttachment.payload.url).trim() : undefined;

    const change0 = entry0?.changes?.[0];
    const changeValue = change0?.value;
    const commentId =
      pickFirstString(changeValue?.comment_id) ??
      pickFirstString(changeValue?.commentId) ??
      pickFirstString(changeValue?.id);
    const textComment = pickFirstString(changeValue?.message, changeValue?.text);
    const commenterId = pickFirstString(changeValue?.from?.id);

    const isEcho = Boolean(messaging0?.message?.is_echo);
    const isOwn = Boolean((commenterId && pageId && commenterId === pageId) || (senderId && pageId && senderId === pageId));
    const notNewComment = Boolean(changeValue?.item && changeValue.item !== 'comment') || Boolean(changeValue?.verb && changeValue.verb !== 'add');
    const isComment = Boolean(commentId && textComment) && !notNewComment;
    const isDm = Boolean(senderId && (textDm || imageUrl)) && !isEcho;
    if (isEcho || isOwn) {
      // Evita que el bot conteste sus propios mensajes/comentarios (bucle)
      return summary;
    }
    const dedupeKey = isComment ? `c:${commentId}` : messaging0?.message?.mid ? `m:${messaging0.message.mid}` : undefined;
    if (dedupeKey && (await alreadyProcessed(dedupeKey))) {
      return summary;
    }

    if (pageId) summary.pageId = pageId;
    if (senderId) summary.senderId = senderId;
    if (commentId) summary.commentId = commentId;
    if (textDm) summary.text = textDm;
    if (!textDm && textComment) summary.text = textComment;

    if (!pageId || (!isDm && !isComment)) {
      return summary;
    }

    let cfg = null;
    try {
      cfg = await resolveBusinessConfigByPageId(pageId);
    } catch (dbErr) {
      console.log('[webhook][db] error:', dbErr);
      return summary;
    }

    if (!cfg?.accessToken) {
      console.log('[webhook] No accessToken for pageId:', pageId);
      return summary;
    }

    const platform = inferPlatform(body);
    const dmRecipientId = isComment ? commenterId : senderId;
    const incomingText = (isComment ? textComment : textDm) ?? (imageUrl ? '[imagen/documento adjunto]' : '');

    if (isComment && !dmRecipientId) {
      console.log('[webhook] Comentario sin commenterId (from.id), no se puede enviar DM');
      return summary;
    }

    let senderName: string | undefined;
    if (dmRecipientId && isDm) {
      senderName = await getFacebookUserName(cfg.accessToken, dmRecipientId);
    }
    if (isComment && dmRecipientId && !senderName) {
      senderName = pickFirstString(changeValue?.from?.name);
    }

    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    const baseUrl = host ? `${proto}://${host}` : 'https://agentia-chatbot-ventas.vercel.app';

    let mediaBase64: string | undefined;
    let mimeType: string | undefined;
    if (imageUrl && cfg.accessToken) {
      const media = await fetchImageAsBase64(imageUrl, cfg.accessToken);
      if (media) {
        mediaBase64 = media.base64;
        mimeType = media.mimeType;
      }
    }

    const chatBody: Record<string, unknown> = {
      clientId: cfg.clientId,
      platform,
      entryType: 'dm',
      message: (isComment ? textComment : textDm) ?? (mediaBase64 ? '[imagen/documento adjunto]' : ''),
      senderId: dmRecipientId ?? undefined,
      senderName: senderName ?? undefined,
      pageId,
    };
    if (mediaBase64 && mimeType) {
      chatBody.mediaBase64 = mediaBase64;
      chatBody.mimeType = mimeType;
    }

    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatBody),
    });

    const chatJson = await chatRes.json().catch(() => ({}));
    const replyText = String(chatJson?.reply ?? '').trim();
    if (!chatRes.ok || !replyText) {
      console.log('[webhook] /api/chat failed:', chatRes.status, chatJson);
      return summary;
    }

    const COMMENT_REPLY_FIXED = '¡Hola! Te envié la información por mensaje privado 📩';

    try {
      if (isComment && commentId) {
        await replyToComment({ accessToken: cfg.accessToken, commentId, text: COMMENT_REPLY_FIXED });
        await sendPrivateReplyToComment({ accessToken: cfg.accessToken, commentId, text: replyText });
      } else if (dmRecipientId) {
        await sendMessengerReply({ accessToken: cfg.accessToken, recipientId: dmRecipientId, text: replyText });
      }
    } catch (sendErr) {
      console.log('[webhook][send] error:', sendErr);
    }

    return summary;
  } catch (err) {
    console.log('[webhook] unhandled error:', err);
    return { received: true };
  }
}
