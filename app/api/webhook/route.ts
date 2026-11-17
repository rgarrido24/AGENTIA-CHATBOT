import { NextRequest, NextResponse } from 'next/server';
import { resolveBusinessConfigByPageId } from '@/src/lib/business-config';
import { matchSocialRule, pickPublicReply } from '@/src/lib/social-rules';
import { getMongoDb } from '@/lib/mongodb';
import { AGENTIA_PANEL_CLIENT_ID, isAgentiaSocialPageId } from '@/lib/agentia-panel';
import { appendPanelMessages, getPanelConversationById } from '@/lib/panel-conversations';
import { makeLeadIdFromParams } from '@/src/lib/leads';

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
  platform?: 'facebook' | 'instagram' | 'whatsapp';
}) {
  // Facebook: /{comment}/comments · Instagram: /{comment}/replies
  const edge = params.platform === 'instagram' ? 'replies' : 'comments';
  const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(params.commentId)}/${edge}?access_token=${encodeURIComponent(params.accessToken)}`;
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
async function recordOutcome(key: string | undefined, data: Record<string, unknown>) {
  if (!key) return;
  try {
    const db = await getMongoDb();
    await db.collection('webhook_events_social').updateOne({ _id: key as any }, { $set: data });
  } catch {
    /* solo diagnóstico */
  }
}

function errText(e: unknown): string {
  return String((e as Error)?.message ?? e).slice(0, 300);
}

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

    console.log(
      `[SOCIAL] evento recibido platform=${inferPlatform(body)} pageId=${pageId ?? '-'} tipo=${isComment ? 'comentario' : isDm ? 'dm' : 'otro'}`
    );
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

    const toPanel = isAgentiaSocialPageId(pageId) && Boolean(dmRecipientId);
    const panelRef = {
      clientId: AGENTIA_PANEL_CLIENT_ID,
      senderId: dmRecipientId ?? '',
      senderName: senderName ?? undefined,
      pageId: pageId ?? undefined,
      platform,
      channel: platform === 'instagram' ? ('instagram' as const) : ('facebook' as const),
    };
    const panelUserText = isComment ? `💬 Comentario: ${incomingText}` : incomingText;
    if (toPanel && !isComment) {
      try {
        const existing = await getPanelConversationById(
          AGENTIA_PANEL_CLIENT_ID,
          makeLeadIdFromParams(panelRef.senderId, panelRef.pageId ?? '', AGENTIA_PANEL_CLIENT_ID)
        );
        if (existing?.botPaused) {
          await appendPanelMessages({ ...panelRef, entries: [{ role: 'user', content: panelUserText }] });
          console.log('[SOCIAL] conversacion en modo manual; bot no responde');
          return summary;
        }
      } catch (e) {
        console.log('[SOCIAL] panel check error', e);
      }
    }

    const FALLBACK_REPLY = '¡Hola! Gracias por escribirnos 🙌 En breve una asesora te responde con toda la información.';
    let replyText = '';
    const rule = matchSocialRule(cfg.socialRules, incomingText, isComment ? 'comment' : 'dm');
    if (rule) {
      console.log(`[SOCIAL] regla coincide id=${rule.id}`);
      await recordOutcome(dedupeKey, { rule: rule.id });
      if (rule.dmMessage?.trim()) replyText = rule.dmMessage.trim();
    }
    try {
      if (replyText) throw new Error('__skip_ai__');
      const chatRes = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatBody),
      });
      const chatJson = await chatRes.json().catch(() => ({}));
      replyText = String(chatJson?.reply ?? '').trim();
      if (!chatRes.ok || !replyText) {
        console.log('[SOCIAL] /api/chat FALLO status=' + chatRes.status, JSON.stringify(chatJson).slice(0, 300));
        replyText = '';
      }
    } catch (chatErr) {
      if ((chatErr as Error)?.message !== '__skip_ai__') console.log('[SOCIAL] /api/chat EXCEPCION', chatErr);
    }
    if (!replyText) replyText = FALLBACK_REPLY;

    const COMMENT_REPLY_FIXED = '¡Hola! Te envié la información por mensaje privado 📩';

    if (isComment && commentId) {
      let publicOk = false;
      // Facebook: la respuesta pública requiere pages_read_user_content (App Review). Hasta que Meta la apruebe, solo inbox.
      const skipPublic = platform === 'facebook' && getEnv('SOCIAL_FB_PUBLIC_REPLY') !== '1';
      try {
        if (skipPublic) throw new Error('__skip_public__');
        await replyToComment({ accessToken: cfg.accessToken, commentId, text: pickPublicReply(rule, COMMENT_REPLY_FIXED), platform });
        publicOk = true;
        console.log(`[SOCIAL] respuesta publica OK platform=${platform} comment=${commentId}`);
        await recordOutcome(dedupeKey, { publicOk: true });
      } catch (e) {
        if ((e as Error)?.message === '__skip_public__') {
          await recordOutcome(dedupeKey, { publicSkipped: true });
        } else {
        console.log(`[SOCIAL] respuesta publica FALLO platform=${platform} comment=${commentId}:`, e);
        await recordOutcome(dedupeKey, { publicError: errText(e) });
        }
      }
      try {
        await sendPrivateReplyToComment({ accessToken: cfg.accessToken, commentId, text: replyText });
        console.log(`[SOCIAL] DM privado OK comment=${commentId} publica=${publicOk}`);
        await recordOutcome(dedupeKey, { dmOk: true });
      } catch (e) {
        console.log(`[SOCIAL] DM privado FALLO comment=${commentId}:`, e);
        await recordOutcome(dedupeKey, { dmError: errText(e) });
      }
    } else if (dmRecipientId) {
      try {
        await sendMessengerReply({ accessToken: cfg.accessToken, recipientId: dmRecipientId, text: replyText });
        console.log(`[SOCIAL] DM OK platform=${platform}`);
        await recordOutcome(dedupeKey, { dmOk: true });
      } catch (e) {
        console.log(`[SOCIAL] DM FALLO platform=${platform}:`, e);
        await recordOutcome(dedupeKey, { dmError: errText(e) });
      }
    }

    if (toPanel) {
      try {
        await appendPanelMessages({
          ...panelRef,
          entries: [
            { role: 'user', content: panelUserText },
            { role: 'assistant', content: replyText },
          ],
        });
      } catch (e) {
        console.log('[SOCIAL] panel append error', e);
      }
    }

    return summary;
  } catch (err) {
    console.log('[webhook] unhandled error:', err);
    return { received: true };
  }
}
