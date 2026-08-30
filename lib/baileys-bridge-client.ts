import { getMongoDb } from '@/lib/mongodb';

function bridgeBase(): string | null {
  const raw = process.env.BAILEYS_BRIDGE_URL?.trim();
  return raw ? raw.replace(/\/$/, '') : null;
}

async function bridgeFetch(
  path: string,
  init?: RequestInit & { clientId?: string }
): Promise<Response> {
  const base = bridgeBase();
  if (!base) throw new Error('BAILEYS_BRIDGE_URL no configurado');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };

  const secret = process.env.CRON_SECRET?.trim();
  if (secret) headers.Authorization = `Bearer ${secret}`;

  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, { ...init, headers });
}

export async function bridgeSendMessage(clientId: string, phone: string, message: string) {
  const digits = String(phone).replace(/\D/g, '');
  const base = bridgeBase();

  if (base) {
    const res = await bridgeFetch('/send', {
      method: 'POST',
      body: JSON.stringify({ clientId, phone: digits, message }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string }).error || `Bridge error ${res.status}`);
    }
    return data;
  }

  const db = await getMongoDb();
  const leadId = `${digits}_wa_${clientId}`;
  await db.collection('outbound_messages').insertOne({
    leadId,
    senderId: digits,
    clientId,
    message,
    source: 'client-panel',
    createdAt: new Date(),
  });
  return { ok: true, queued: true };
}

export async function bridgeGetStatus(clientId: string) {
  const base = bridgeBase();
  if (base) {
    const res = await bridgeFetch(`/status?clientId=${encodeURIComponent(clientId)}`);
    return res.json().catch(() => ({}));
  }

  const db = await getMongoDb();
  const doc = await db.collection('whatsapp_qr').findOne({ _id: clientId as never });
  return {
    connected: !!(doc as { connected?: boolean } | null)?.connected,
    phone: (doc as { phone?: string } | null)?.phone || null,
    hasQr: !!(doc as { qr?: string } | null)?.qr,
  };
}

export async function bridgeGetQrRaw(clientId: string): Promise<string | null> {
  const base = bridgeBase();
  if (base) {
    const res = await bridgeFetch(`/qr?clientId=${encodeURIComponent(clientId)}&format=raw`);
    if (!res.ok) return null;
    const text = await res.text();
    return text.trim() || null;
  }

  const db = await getMongoDb();
  const doc = await db.collection('whatsapp_qr').findOne({ _id: clientId as never });
  return (doc as { qr?: string } | null)?.qr || null;
}

export async function bridgePausePhone(clientId: string, phone: string) {
  const digits = String(phone).replace(/\D/g, '');
  const base = bridgeBase();
  if (base) {
    const res = await bridgeFetch(`/pause/${encodeURIComponent(digits)}`, {
      method: 'POST',
      body: JSON.stringify({ clientId }),
    });
    return res.json().catch(() => ({}));
  }
  return { ok: true, local: true };
}

export async function bridgeResumePhone(clientId: string, phone: string) {
  const digits = String(phone).replace(/\D/g, '');
  const base = bridgeBase();
  if (base) {
    const res = await bridgeFetch(`/resume/${encodeURIComponent(digits)}`, {
      method: 'POST',
      body: JSON.stringify({ clientId }),
    });
    return res.json().catch(() => ({}));
  }
  return { ok: true, local: true };
}
