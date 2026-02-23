import { NextRequest, NextResponse } from 'next/server';
import { resolveBusinessConfigByPageId } from '@/src/lib/business-config';

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
    const summary: any = { received: true };

    const entry0 = body?.entry?.[0];
    const pageId =
      pickFirstString(entry0?.id) ??
      pickFirstString(entry0?.messaging?.[0]?.recipient?.id) ??
      pickFirstString(body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id);

    const messaging0 = entry0?.messaging?.[0];
    const textDm = pickFirstString(messaging0?.message?.text);
    const senderId = pickFirstString(messaging0?.sender?.id);

    const change0 = entry0?.changes?.[0];
    const changeValue = change0?.value;
    const commentId =
      pickFirstString(changeValue?.comment_id) ??
      pickFirstString(changeValue?.commentId) ??
      pickFirstString(changeValue?.id);
    const textComment = pickFirstString(changeValue?.message, changeValue?.text);
    const commenterId = pickFirstString(changeValue?.from?.id);

    const isComment = Boolean(commentId && textComment);
    const isDm = Boolean(senderId && textDm);

    if (pageId) summary.pageId = pageId;
    if (senderId) summary.senderId = senderId;
    if (commentId) summary.commentId = commentId;
    if (textDm) summary.text = textDm;
    if (!textDm && textComment) summary.text = textComment;

    if (!pageId || (!isDm && !isComment)) {
      return NextResponse.json({ status: 'EVENT_RECEIVED', ...summary });
    }

    let cfg = null;
    try {
      cfg = await resolveBusinessConfigByPageId(pageId);
    } catch (dbErr) {
      console.log('[webhook][db] error:', dbErr);
      return NextResponse.json({ status: 'EVENT_RECEIVED', ...summary });
    }

    if (!cfg?.accessToken) {
      console.log('[webhook] No accessToken for pageId:', pageId);
      return NextResponse.json({ status: 'EVENT_RECEIVED', ...summary });
    }

    const platform = inferPlatform(body);
    const dmRecipientId = isComment ? commenterId : senderId;
    const incomingText = (isComment ? textComment : textDm) ?? '';

    if (isComment && !dmRecipientId) {
      console.log('[webhook] Comentario sin commenterId (from.id), no se puede enviar DM');
      return NextResponse.json({ status: 'EVENT_RECEIVED', ...summary });
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

    const entryTypeForApi = isComment ? 'dm' : 'dm';
    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: cfg.clientId,
        platform,
        entryType: entryTypeForApi,
        message: incomingText,
        senderId: dmRecipientId ?? undefined,
        senderName: senderName ?? undefined,
        pageId,
      }),
    });

    const chatJson = await chatRes.json().catch(() => ({}));
    const replyText = String(chatJson?.reply ?? '').trim();
    if (!chatRes.ok || !replyText) {
      console.log('[webhook] /api/chat failed:', chatRes.status, chatJson);
      return NextResponse.json({ status: 'EVENT_RECEIVED', ...summary });
    }

    const COMMENT_REPLY_FIXED = '¡Hola! Te envié la información por mensaje privado 📩';

    try {
      if (isComment && commentId) {
        await replyToComment({ accessToken: cfg.accessToken, commentId, text: COMMENT_REPLY_FIXED });
        if (dmRecipientId) {
          await sendMessengerReply({ accessToken: cfg.accessToken, recipientId: dmRecipientId, text: replyText });
        }
      } else if (dmRecipientId) {
        await sendMessengerReply({ accessToken: cfg.accessToken, recipientId: dmRecipientId, text: replyText });
      }
    } catch (sendErr) {
      console.log('[webhook][send] error:', sendErr);
    }

    return NextResponse.json({ status: 'EVENT_RECEIVED', ...summary });
  } catch (err) {
    console.log('[webhook] unhandled error:', err);
    return NextResponse.json({ status: 'EVENT_RECEIVED', received: true });
  }
}
