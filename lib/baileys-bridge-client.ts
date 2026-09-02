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
  const mongo = await getMongoWhatsAppDoc(clientId);
  const base = bridgeBase();
  if (base) {
    try {
      const res = await bridgeFetch(`/status?clientId=${encodeURIComponent(clientId)}`);
      const data = (await res.json().catch(() => ({}))) as {
        connected?: boolean;
        phone?: string | null;
        hasQr?: boolean;
      };
      if (data?.connected) {
        return {
          connected: true,
          phone: data.phone || mongo.phone,
          hasQr: !!data.hasQr || mongo.hasQr,
        };
      }
    } catch {
      /* Baileys no es el bridge de todos los tenants (izzi usa whatsapp-web.js). */
    }
  }

  return {
    connected: mongo.connected,
    phone: mongo.phone,
    hasQr: mongo.hasQr,
  };
}

export async function bridgeGetQrRaw(clientId: string): Promise<string | null> {
  const base = bridgeBase();
  if (base) {
    try {
      const res = await bridgeFetch(`/qr?clientId=${encodeURIComponent(clientId)}&format=raw`);
      if (res.ok) {
        const text = (await res.text()).trim();
        if (text) return text;
      }
    } catch {
      /* fall through to Mongo */
    }
  }

  const mongo = await getMongoWhatsAppDoc(clientId);
  return mongo.qr;
}

async function getMongoWhatsAppDoc(clientId: string) {
  const db = await getMongoDb();
  const doc = await db.collection('whatsapp_qr').findOne({ _id: clientId as never });
  const typed = doc as { connected?: boolean; phone?: string; qr?: string } | null;
  return {
    connected: !!typed?.connected,
    phone: typed?.phone || null,
    hasQr: !!typed?.qr,
    qr: typed?.qr || null,
  };
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
