import { NextRequest, NextResponse } from 'next/server';
import { handleChat } from '@/src/api/chat-handler';

export const dynamic = 'force-dynamic';

/**
 * Extrae texto de respuesta típica de n8n / Make / webhooks genéricos.
 */
function extractWebhookReply(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === 'string') return raw.trim() || null;
  if (typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const direct =
    o.reply ??
    o.message ??
    o.output ??
    o.text ??
    o.response ??
    o.answer ??
    o.result;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();

  if (Array.isArray(o.data) && o.data.length > 0) {
    const first = o.data[0];
    if (typeof first === 'string') return first.trim();
    if (first && typeof first === 'object') {
      const r = extractWebhookReply(first);
      if (r) return r;
    }
  }

  if (o.data && typeof o.data === 'object') {
    const r = extractWebhookReply(o.data);
    if (r) return r;
  }

  if (o.body && typeof o.body === 'object') {
    const r = extractWebhookReply(o.body);
    if (r) return r;
  }

  return null;
}

export async function POST(request: NextRequest) {
  let body: { message?: string; sessionId?: string; senderName?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const message = String(body?.message ?? '').trim();
  const sessionId = String(body?.sessionId ?? '').trim() || `widget_${Date.now()}`;
  const senderName = String(body?.senderName ?? 'Visitante web').trim() || 'Visitante web';

  if (!message) {
    return NextResponse.json({ error: 'message requerido' }, { status: 400 });
  }

  const webhookUrl = String(process.env.AGENTIA_WIDGET_WEBHOOK_URL ?? '').trim();

  if (webhookUrl) {
    try {
      const secret = process.env.AGENTIA_WIDGET_WEBHOOK_SECRET?.trim();
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
        body: JSON.stringify({
          source: 'agentia-site-widget',
          sessionId,
          senderName,
          message,
          timestamp: new Date().toISOString(),
        }),
      });

      const ct = res.headers.get('content-type') || '';
      let parsed: unknown = null;
      if (ct.includes('application/json')) {
        parsed = await res.json().catch(() => null);
      } else {
        const t = await res.text().catch(() => '');
        try {
          parsed = JSON.parse(t);
        } catch {
          if (t.trim()) {
            if (!res.ok) {
              return NextResponse.json(
                { error: `Webhook HTTP ${res.status}`, detail: t.trim().slice(0, 800) },
                { status: 502 }
              );
            }
            return NextResponse.json({ reply: t.trim().slice(0, 8000), via: 'webhook' });
          }
        }
      }

      if (!res.ok) {
        const errText = extractWebhookReply(parsed) || JSON.stringify(parsed).slice(0, 400);
        return NextResponse.json(
          { error: `Webhook HTTP ${res.status}`, detail: errText },
          { status: 502 }
        );
      }

      const reply = extractWebhookReply(parsed);
      if (!reply) {
        return NextResponse.json(
          { error: 'Webhook sin texto reconocible', status: res.status, raw: parsed },
          { status: 502 }
        );
      }
      return NextResponse.json({ reply, via: 'webhook' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error webhook';
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  // Fallback: motor interno Agentia (misma lógica que WhatsApp bridge)
  const result = await handleChat({
    body: {
      clientId: 'agentia',
      platform: 'whatsapp',
      entryType: 'dm',
      message,
      senderId: sessionId,
      senderName,
      pageId: 'agentia-site-widget',
    },
    headers: request.headers,
  });

  return NextResponse.json(result.json, { status: result.status });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
