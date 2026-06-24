import { ObjectId } from 'mongodb';
import { getMongoDb } from './mongodb';
import { makeLeadIdFromParams } from '@/src/lib/leads';

/** Canales soportados en el panel (extensible a Meta DMs). */
export type PanelChannel = 'whatsapp' | 'facebook' | 'instagram';

export const PANEL_CHANNELS: PanelChannel[] = ['whatsapp', 'facebook', 'instagram'];

export type PanelMessageRole = 'user' | 'assistant' | 'agent';

export type PanelConversationMessage = {
  role: PanelMessageRole;
  content: string;
  at: Date;
};

export type PanelConversation = {
  _id?: ObjectId;
  clientId: string;
  channel: PanelChannel;
  conversationId: string;
  senderId: string;
  senderName?: string;
  pageId: string;
  platform: string;
  messages: PanelConversationMessage[];
  lastMessage?: string;
  lastMessageAt: Date;
  botPaused: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type RawMessage = {
  role?: string;
  content?: string;
  at?: Date | string;
  timestamp?: Date | string;
  createdAt?: Date | string;
};

type RawConversation = {
  _id?: ObjectId;
  clientId?: string;
  channel?: string;
  conversationId?: string;
  senderId?: string;
  senderName?: string;
  pageId?: string;
  platform?: string;
  messages?: RawMessage[];
  history?: RawMessage[];
  lastMessage?: string;
  lastMessageAt?: Date | string;
  botPaused?: boolean;
  bot_status?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export function platformToChannel(platform: string): PanelChannel {
  const p = String(platform || '').toLowerCase();
  if (p === 'facebook' || p === 'fb') return 'facebook';
  if (p === 'instagram' || p === 'ig') return 'instagram';
  return 'whatsapp';
}

function parseDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

function normalizeRole(raw: unknown): PanelMessageRole {
  const r = String(raw || '').toLowerCase();
  if (r === 'user' || r === 'customer' || r === 'cliente') return 'user';
  if (r === 'agent' || r === 'human' || r === 'manual' || r === 'vendedor') return 'agent';
  return 'assistant';
}

function normalizeMessages(doc: RawConversation): PanelConversationMessage[] {
  const raw = Array.isArray(doc.messages) ? doc.messages : Array.isArray(doc.history) ? doc.history : [];
  return raw
    .map((m) => ({
      role: normalizeRole(m.role),
      content: typeof m.content === 'string' ? m.content : '',
      at: parseDate(m.at ?? m.timestamp ?? m.createdAt),
    }))
    .filter((m) => m.content.trim());
}

export function normalizePanelConversation(doc: RawConversation, defaultClientId: string): PanelConversation {
  const senderId = String(doc.senderId || '').trim();
  const pageId = String(doc.pageId || 'whatsapp-cloud').trim();
  const clientId = String(doc.clientId || defaultClientId).trim();
  const channel = doc.channel ? platformToChannel(doc.channel) : platformToChannel(doc.platform || 'whatsapp');
  const conversationId =
    String(doc.conversationId || '').trim() ||
    (senderId ? makeLeadIdFromParams(senderId, pageId, clientId) : String(doc._id || ''));

  return {
    _id: doc._id,
    clientId,
    channel,
    conversationId,
    senderId,
    senderName: typeof doc.senderName === 'string' ? doc.senderName : undefined,
    pageId,
    platform: String(doc.platform || channel),
    messages: normalizeMessages(doc),
    lastMessage: typeof doc.lastMessage === 'string' ? doc.lastMessage : undefined,
    lastMessageAt: parseDate(doc.lastMessageAt ?? doc.updatedAt ?? doc.createdAt),
    botPaused: doc.botPaused === true || doc.bot_status === 'paused',
    createdAt: parseDate(doc.createdAt),
    updatedAt: parseDate(doc.updatedAt ?? doc.lastMessageAt),
  };
}

export function panelConversationPublicId(doc: PanelConversation): string {
  return doc._id ? String(doc._id) : doc.conversationId;
}

async function conversationsColl() {
  const db = await getMongoDb();
  return db.collection<RawConversation>('conversations');
}

export type ListPanelOptions = {
  channel?: PanelChannel | 'all';
  limit?: number;
};

export async function listPanelConversations(
  clientId: string,
  opts: ListPanelOptions = {}
): Promise<PanelConversation[]> {
  const coll = await conversationsColl();
  const filter: Record<string, unknown> = { clientId: clientId.trim().toLowerCase() };
  if (opts.channel && opts.channel !== 'all') {
    filter.channel = opts.channel;
  }
  const docs = await coll
    .find(filter)
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(opts.limit ?? 100)
    .toArray();
  return docs.map((d) => normalizePanelConversation(d, clientId));
}

export async function getPanelConversationById(
  clientId: string,
  id: string
): Promise<PanelConversation | null> {
  const coll = await conversationsColl();
  const cid = clientId.trim().toLowerCase();
  let doc: RawConversation | null = null;

  if (ObjectId.isValid(id)) {
    doc = await coll.findOne({ _id: new ObjectId(id), clientId: cid });
  }
  if (!doc) {
    doc = await coll.findOne({
      clientId: cid,
      $or: [{ conversationId: id }, { senderId: id }],
    });
  }
  return doc ? normalizePanelConversation(doc, cid) : null;
}

function defaultPageId(channel: PanelChannel, pageId?: string): string {
  if (pageId?.trim()) return pageId.trim();
  if (channel === 'facebook') return 'facebook-dm';
  if (channel === 'instagram') return 'instagram-dm';
  return 'whatsapp-cloud';
}

async function upsertConversationBase(params: {
  clientId: string;
  senderId: string;
  senderName?: string;
  pageId?: string;
  platform?: string;
  channel?: PanelChannel;
}): Promise<{ conversationId: string; filter: Record<string, unknown> }> {
  const clientId = params.clientId.trim().toLowerCase();
  const senderId = params.senderId.trim();
  const channel = params.channel ?? platformToChannel(params.platform || 'whatsapp');
  const pageId = defaultPageId(channel, params.pageId);
  const conversationId = makeLeadIdFromParams(senderId, pageId, clientId);
  const coll = await conversationsColl();
  const now = new Date();

  await coll.updateOne(
    { clientId, conversationId },
    {
      $setOnInsert: {
        clientId,
        conversationId,
        senderId,
        pageId,
        channel,
        platform: params.platform || channel,
        messages: [],
        botPaused: false,
        createdAt: now,
      },
      $set: {
        ...(params.senderName ? { senderName: params.senderName } : {}),
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  return { conversationId, filter: { clientId, conversationId } };
}

export async function appendPanelMessages(params: {
  clientId: string;
  senderId: string;
  senderName?: string;
  pageId?: string;
  platform?: string;
  channel?: PanelChannel;
  entries: Array<{ role: PanelMessageRole; content: string }>;
}): Promise<void> {
  const entries = params.entries
    .map((e) => ({
      role: e.role,
      content: e.content.trim(),
      at: new Date(),
    }))
    .filter((e) => e.content);

  if (!entries.length) return;

  const { filter } = await upsertConversationBase(params);
  const coll = await conversationsColl();
  const last = entries[entries.length - 1]!;
  const now = new Date();

  await coll.updateOne(filter, {
    $push: { messages: { $each: entries } },
    $set: {
      lastMessage: last.content,
      lastMessageAt: now,
      updatedAt: now,
      ...(params.senderName ? { senderName: params.senderName } : {}),
    },
  });
}

export async function appendPanelConversationTurn(params: {
  clientId: string;
  senderId: string;
  senderName?: string;
  pageId?: string;
  platform?: string;
  channel?: PanelChannel;
  userMessage: string;
  botReply: string;
}): Promise<void> {
  const entries: Array<{ role: PanelMessageRole; content: string }> = [
    { role: 'user', content: params.userMessage },
  ];
  if (params.botReply.trim()) {
    entries.push({ role: 'assistant', content: params.botReply });
  }
  await appendPanelMessages({ ...params, entries });
}

export async function recordPanelInboundWhilePaused(params: {
  clientId: string;
  senderId: string;
  senderName?: string;
  pageId?: string;
  platform?: string;
  channel?: PanelChannel;
  message: string;
}): Promise<void> {
  await appendPanelMessages({
    ...params,
    entries: [{ role: 'user', content: params.message }],
  });
}

export async function setPanelConversationPaused(
  clientId: string,
  conversationRef: string,
  paused: boolean
): Promise<boolean> {
  const coll = await conversationsColl();
  const cid = clientId.trim().toLowerCase();
  const now = new Date();
  const filter: Record<string, unknown> = { clientId: cid };
  if (ObjectId.isValid(conversationRef)) {
    filter._id = new ObjectId(conversationRef);
  } else {
    filter.$or = [{ conversationId: conversationRef }, { senderId: conversationRef }];
  }

  const result = await coll.updateOne(filter, {
    $set: {
      botPaused: paused,
      bot_status: paused ? 'paused' : 'active',
      updatedAt: now,
    },
  });
  return result.matchedCount > 0;
}

/** Clientes que persisten en colección `conversations` para el panel. */
export function usesPanelConversations(clientId: string): boolean {
  const c = clientId.trim().toLowerCase();
  return c === 'cwf' || c === 'agentia-ventas';
}
