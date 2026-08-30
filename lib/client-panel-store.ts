import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import type { FunnelStage, PanelTag, ClientConfigDoc } from '@/lib/client-panel-config';

export type PanelMessageRole = 'user' | 'bot' | 'advisor';

export type ProductCard = {
  image?: string;
  name: string;
  price: string;
};

export type PanelMessage = {
  id: string;
  role: PanelMessageRole;
  content: string;
  createdAt: Date;
  productCard?: ProductCard;
};

export type PanelConversation = {
  _id?: ObjectId;
  clientId: string;
  phone: string;
  contactName?: string;
  messages: PanelMessage[];
  stage: FunnelStage | string;
  tags: string[];
  notes: string;
  humanMode: boolean;
  followupSent?: boolean;
  followupSentAt?: Date;
  unreadCount?: number;
  connectedNumber?: string;
  updatedAt: Date;
  createdAt?: Date;
};

const COLLECTION = 'conversations';

function normalizePhone(phone: string): string {
  return String(phone || '').replace(/\D/g, '');
}

/** Clientes cuyo panel CRM usa la colección `conversations` (schema phone/contactName/stage). */
export function usesClientPanelStore(clientId: string): boolean {
  return clientId.trim().toLowerCase() === 'biovela';
}

async function upsertClientPanelConversationMeta(params: {
  clientId: string;
  phone: string;
  contactName?: string;
}): Promise<{ clientId: string; phone: string } | null> {
  const clientId = params.clientId.trim().toLowerCase();
  const phone = normalizePhone(params.phone);
  if (!phone) return null;

  const db = await getMongoDb();
  const col = db.collection<PanelConversation>(COLLECTION);
  const now = new Date();

  await col.updateOne(
    { clientId, phone },
    {
      $set: {
        clientId,
        phone,
        updatedAt: now,
        ...(params.contactName?.trim() ? { contactName: params.contactName.trim() } : {}),
      },
      $setOnInsert: {
        stage: 'pregunton',
        humanMode: false,
        tags: [],
        notes: '',
        unreadCount: 0,
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return { clientId, phone };
}

async function pushClientPanelMessage(
  key: { clientId: string; phone: string },
  msg: PanelMessage,
  opts?: { incrementUnread?: boolean }
): Promise<void> {
  const db = await getMongoDb();
  const col = db.collection<PanelConversation>(COLLECTION);
  const now = new Date();

  await col.updateOne(
    { clientId: key.clientId, phone: key.phone },
    {
      $push: { messages: msg },
      $set: { updatedAt: now },
      ...(opts?.incrementUnread ? { $inc: { unreadCount: 1 } } : {}),
    }
  );
}

export async function recordClientPanelInbound(params: {
  clientId: string;
  phone: string;
  contactName?: string;
  message: string;
}): Promise<void> {
  const clientId = params.clientId.trim().toLowerCase();
  const phone = normalizePhone(params.phone);
  const content = params.message.trim();
  if (!phone || !content) return;

  const key = await upsertClientPanelConversationMeta({
    clientId,
    phone,
    contactName: params.contactName,
  });
  if (!key) return;

  const now = new Date();
  const msg: PanelMessage = {
    id: new ObjectId().toHexString(),
    role: 'user',
    content,
    createdAt: now,
  };

  await pushClientPanelMessage(key, msg, { incrementUnread: true });
}

export async function appendClientPanelBotReply(params: {
  clientId: string;
  phone: string;
  contactName?: string;
  reply: string;
  productCard?: ProductCard;
}): Promise<void> {
  const clientId = params.clientId.trim().toLowerCase();
  const phone = normalizePhone(params.phone);
  const content = params.reply.trim();
  if (!phone || !content) return;

  const key = await upsertClientPanelConversationMeta({
    clientId,
    phone,
    contactName: params.contactName,
  });
  if (!key) return;

  const now = new Date();
  const msg: PanelMessage = {
    id: new ObjectId().toHexString(),
    role: 'bot',
    content,
    createdAt: now,
    ...(params.productCard ? { productCard: params.productCard } : {}),
  };

  await pushClientPanelMessage(key, msg);
}

export async function appendClientPanelConversationTurn(params: {
  clientId: string;
  phone: string;
  contactName?: string;
  userMessage: string;
  botReply?: string;
  productCard?: ProductCard;
}): Promise<void> {
  await recordClientPanelInbound({
    clientId: params.clientId,
    phone: params.phone,
    contactName: params.contactName,
    message: params.userMessage,
  });
  if (params.botReply?.trim()) {
    await appendClientPanelBotReply({
      clientId: params.clientId,
      phone: params.phone,
      contactName: params.contactName,
      reply: params.botReply,
      productCard: params.productCard,
    });
  }
}

export function convIdFromDoc(doc: PanelConversation): string {
  return doc._id ? String(doc._id) : normalizePhone(doc.phone);
}

export async function getClientConfig(clientId: string): Promise<ClientConfigDoc | null> {
  const db = await getMongoDb();
  return db.collection<ClientConfigDoc>('client_configs').findOne({ clientId });
}

export async function listConversations(
  clientId: string,
  opts: {
    q?: string;
    filter?: 'all' | 'unread' | 'bot_active' | 'advisor_active' | 'closed';
    page?: number;
    limit?: number;
  } = {}
) {
  const db = await getMongoDb();
  const page = Math.max(1, opts.page || 1);
  const limit = Math.min(50, Math.max(1, opts.limit || 30));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { clientId };

  if (opts.q?.trim()) {
    const q = opts.q.trim();
    query.$or = [
      { contactName: { $regex: q, $options: 'i' } },
      { phone: { $regex: q.replace(/\D/g, ''), $options: 'i' } },
      { notes: { $regex: q, $options: 'i' } },
    ];
  }

  switch (opts.filter) {
    case 'unread':
      query.unreadCount = { $gt: 0 };
      break;
    case 'bot_active':
      query.humanMode = { $ne: true };
      query.stage = { $nin: ['entregado', 'venta_cerrada'] };
      break;
    case 'advisor_active':
      query.humanMode = true;
      break;
    case 'closed':
      query.stage = { $in: ['entregado', 'venta_cerrada'] };
      break;
    default:
      break;
  }

  const col = db.collection<PanelConversation>(COLLECTION);
  const [items, total] = await Promise.all([
    col.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

export async function getConversation(clientId: string, convId: string) {
  const db = await getMongoDb();
  const col = db.collection<PanelConversation>(COLLECTION);
  const digits = normalizePhone(convId);

  if (ObjectId.isValid(convId)) {
    const byId = await col.findOne({ clientId, _id: new ObjectId(convId) });
    if (byId) return byId;
  }

  return col.findOne({
    clientId,
    $or: [{ phone: convId }, { phone: digits }, { phone: { $regex: digits.slice(-10) } }],
  });
}

export async function updateConversationLead(
  clientId: string,
  convId: string,
  patch: { stage?: string; notes?: string; tags?: string[] }
) {
  const db = await getMongoDb();
  const existing = await getConversation(clientId, convId);
  if (!existing?._id) return null;

  const $set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.stage !== undefined) $set.stage = patch.stage;
  if (patch.notes !== undefined) $set.notes = patch.notes;
  if (patch.tags !== undefined) $set.tags = patch.tags;

  await db.collection<PanelConversation>(COLLECTION).updateOne({ _id: existing._id }, { $set });
  return getConversation(clientId, convId);
}

export async function appendAdvisorMessage(
  clientId: string,
  convId: string,
  content: string
) {
  const db = await getMongoDb();
  const existing = await getConversation(clientId, convId);
  if (!existing?._id) return null;

  const msg: PanelMessage = {
    id: new ObjectId().toHexString(),
    role: 'advisor',
    content,
    createdAt: new Date(),
  };

  await db.collection<PanelConversation>(COLLECTION).updateOne(
    { _id: existing._id },
    {
      $push: { messages: msg },
      $set: { updatedAt: new Date(), unreadCount: 0 },
    }
  );

  return msg;
}

export async function setHumanMode(clientId: string, convId: string, humanMode: boolean) {
  const db = await getMongoDb();
  const existing = await getConversation(clientId, convId);
  if (!existing?._id) return false;

  await db.collection<PanelConversation>(COLLECTION).updateOne(
    { _id: existing._id },
    { $set: { humanMode, updatedAt: new Date() } }
  );
  return true;
}

export async function markConversationRead(clientId: string, convId: string) {
  const db = await getMongoDb();
  const existing = await getConversation(clientId, convId);
  if (!existing?._id) return;
  await db.collection<PanelConversation>(COLLECTION).updateOne({ _id: existing._id }, { $set: { unreadCount: 0 } });
}

export function computePurchaseIntent(conv: PanelConversation): number {
  const msgs = conv.messages || [];
  const userMsgs = msgs.filter((m) => m.role === 'user');
  const text = msgs.map((m) => m.content).join(' ').toLowerCase();

  const keywords = [
    'comprar',
    'precio',
    'cuanto',
    'pedido',
    'mayoreo',
    'menudeo',
    'envío',
    'envio',
    'catalogo',
    'catálogo',
    'interesad',
    'quiero',
    'necesito',
  ];

  let score = Math.min(40, userMsgs.length * 8);
  for (const kw of keywords) {
    if (text.includes(kw)) score += 8;
  }
  if (conv.stage === 'interesado') score += 15;
  if (conv.stage === 'venta_cerrada') score = 100;
  if (conv.stage === 'pedido_enviado') score = 95;
  if (conv.stage === 'entregado') score = 100;

  return Math.min(100, Math.max(0, score));
}

export async function getPanelMetrics(clientId: string) {
  const db = await getMongoDb();
  const col = db.collection<PanelConversation>(COLLECTION);
  const startOfDay = startOfDayMexico();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [todayCount, closedCount, candidateUnanswered, allForAvg] = await Promise.all([
    col.countDocuments({ clientId, updatedAt: { $gte: startOfDay } }),
    col.countDocuments({ clientId, stage: 'venta_cerrada', updatedAt: { $gte: startOfDay } }),
    col
      .find({
        clientId,
        humanMode: { $ne: true },
        updatedAt: { $lte: oneHourAgo },
      })
      .project({ messages: 1 })
      .toArray(),
    col
      .find({ clientId })
      .project({ messages: 1 })
      .limit(200)
      .toArray(),
  ]);

  const unanswered = candidateUnanswered.filter((conv) => {
    const msgs = conv.messages || [];
    const last = msgs[msgs.length - 1];
    return last?.role === 'user';
  }).length;

  let totalResponseMs = 0;
  let responsePairs = 0;

  for (const conv of allForAvg) {
    const msgs = [...(conv.messages || [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    for (let i = 0; i < msgs.length - 1; i++) {
      if (msgs[i].role === 'user' && msgs[i + 1].role === 'bot') {
        const delta =
          new Date(msgs[i + 1].createdAt).getTime() - new Date(msgs[i].createdAt).getTime();
        if (delta > 0 && delta < 30 * 60 * 1000) {
          totalResponseMs += delta;
          responsePairs++;
        }
      }
    }
  }

  const avgBotResponseSec =
    responsePairs > 0 ? Math.round(totalResponseMs / responsePairs / 1000) : 0;

  return {
    conversationsToday: todayCount,
    closedSales: closedCount,
    unanswered,
    avgBotResponseSec,
  };
}

function startOfDayMexico(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  return new Date(Date.UTC(year, month - 1, day, 6, 0, 0));
}

export function serializeConversation(doc: PanelConversation) {
  const last = doc.messages?.[doc.messages.length - 1];
  return {
    id: convIdFromDoc(doc),
    phone: doc.phone,
    contactName: doc.contactName || doc.phone,
    stage: doc.stage,
    tags: doc.tags || [],
    notes: doc.notes || '',
    humanMode: !!doc.humanMode,
    unreadCount: doc.unreadCount || 0,
    lastMessage: last?.content || '',
    lastMessageAt: doc.updatedAt,
    purchaseIntent: computePurchaseIntent(doc),
  };
}

export function serializeMessage(m: PanelMessage) {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
    productCard: m.productCard,
  };
}

export function toggleTag(tags: string[], tag: PanelTag): string[] {
  const set = new Set(tags);
  if (set.has(tag)) set.delete(tag);
  else set.add(tag);
  return [...set];
}
