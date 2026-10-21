import { getMongoDb } from '@/lib/mongodb';
import { FB_GRAPH_VERSION } from '@/lib/facebook-lead-connect';
import { decryptWaToken, type WaAccountDoc } from '@/lib/wa-accounts';

/**
 * Bandeja de conversaciones de WhatsApp (API oficial) por cliente.
 * wa_conversations: una por persona y cliente. Los mensajes viven en wa_messages (campo contactKey).
 */
export const WA_CONVERSATIONS = 'wa_conversations';
export const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000;

export type WaConversationDoc = {
  resellerId: string;
  clientSlug: string;
  contactKey: string;
  /** id con el que Meta nos escribió la última vez; es el que se usa para responder. */
  waId: string;
  name?: string;
  leadId?: string;
  lastMessageAt: Date;
  lastText?: string;
  lastDirection: 'in' | 'out';
  lastInboundAt?: Date;
  /** wamid del último mensaje entrante, para el acuse de lectura. */
  lastInboundWamid?: string;
  unread: number;
  createdAt: Date;
};

/**
 * Llave estable de una persona. Meta a veces escribe los números de México como 521 + 10 dígitos
 * y se les envía como 52 + 10 dígitos; se unifican para no partir la conversación en dos.
 */
export function contactKey(raw: string): string {
  const d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('521') && d.length === 13) return `52${d.slice(3)}`;
  return d;
}

export function windowOpen(lastInboundAt?: Date | null, now = Date.now()): boolean {
  return !!lastInboundAt && now - new Date(lastInboundAt).getTime() < SESSION_WINDOW_MS;
}

/** Registra un mensaje (entrante o saliente) en la conversación. Devuelve la conversación resultante. */
export async function touchConversation(opts: {
  resellerId: string;
  clientSlug: string;
  contact: string;
  direction: 'in' | 'out';
  text?: string;
  name?: string;
  wamid?: string;
  at?: Date;
}): Promise<void> {
  const key = contactKey(opts.contact);
  if (!key) return;
  const db = await getMongoDb();
  const at = opts.at ?? new Date();
  const col = db.collection<WaConversationDoc>(WA_CONVERSATIONS);
  const set: Partial<WaConversationDoc> = {
    lastMessageAt: at,
    lastText: (opts.text ?? '').slice(0, 140),
    lastDirection: opts.direction,
  };
  if (opts.direction === 'in') {
    set.lastInboundAt = at;
    set.waId = opts.contact;
    if (opts.wamid) set.lastInboundWamid = opts.wamid;
    if (opts.name?.trim()) set.name = opts.name.trim().slice(0, 80);
  }
  const res = await col.updateOne(
    { resellerId: opts.resellerId, clientSlug: opts.clientSlug, contactKey: key },
    {
      $set: set,
      ...(opts.direction === 'in' ? { $inc: { unread: 1 } } : {}),
      $setOnInsert: {
        createdAt: at,
        ...(opts.direction === 'out' ? { waId: opts.contact, unread: 0 } : {}),
      } as Partial<WaConversationDoc>,
    },
    { upsert: true },
  );
  // Al crear la conversación, enlazarla con el lead del panel si el teléfono coincide.
  if (res.upsertedCount > 0) {
    const lead = await db.collection('leads').findOne(
      { resellerId: opts.resellerId, clientSlug: opts.clientSlug, telefono: { $regex: `${key.slice(-10)}$` } },
      { projection: { leadId: 1, nombre: 1 }, sort: { createdAt: -1 } },
    );
    if (lead?.leadId) {
      await col.updateOne(
        { resellerId: opts.resellerId, clientSlug: opts.clientSlug, contactKey: key },
        { $set: { leadId: String(lead.leadId), ...(lead.nombre ? { name: String(lead.nombre) } : {}) } },
      );
    }
  }
}

/** Acuse de lectura (palomitas azules) para el último mensaje de la persona. Best effort. */
export async function sendWaReadReceipt(acc: WaAccountDoc, wamid: string): Promise<void> {
  try {
    await fetch(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${acc.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${decryptWaToken(acc)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: wamid }),
    });
  } catch {
    /* no crítico */
  }
}
