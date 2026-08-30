import { ObjectId, type AnyBulkWriteOperation } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import {
  appendPanelMessages,
  getPanelConversationById,
  normalizePanelConversation,
  setPanelConversationPaused,
  type PanelConversation,
  type PanelConversationMessage,
  type RawConversation,
} from './panel-conversations';
import {
  IZZI_CLIENT_ID,
  IZZI_DEFAULT_ETAPA,
  IZZI_DEFAULT_TIPO,
  IZZI_PAGE_ID,
  isEtapaForTipo,
  normalizeIzziEtapa,
  normalizeIzziTipo,
  type IzziConversationTipo,
} from './izzi-panel';

export type IzziConversation = PanelConversation & {
  tipo: IzziConversationTipo;
  etapa: string;
  notas: string;
};

type RawDoc = RawConversation & {
  tipo?: unknown;
  etapa?: unknown;
  notas?: unknown;
  recentMessages?: unknown[];
};

function asIzziConversation(doc: RawDoc): IzziConversation {
  const base = normalizePanelConversation(doc, IZZI_CLIENT_ID);
  const tipo = normalizeIzziTipo(doc.tipo);
  return {
    ...base,
    tipo,
    etapa: normalizeIzziEtapa(tipo, doc.etapa),
    notas: typeof doc.notas === 'string' ? doc.notas : '',
  };
}

async function conversationsColl() {
  const db = await getMongoDb();
  return db.collection('conversations');
}

export function toIzziConversation(conv: PanelConversation, extra?: Partial<Pick<IzziConversation, 'tipo' | 'etapa' | 'notas'>>): IzziConversation {
  const tipo = normalizeIzziTipo(extra?.tipo ?? (conv as IzziConversation).tipo);
  return {
    ...conv,
    tipo,
    etapa: normalizeIzziEtapa(tipo, extra?.etapa ?? (conv as IzziConversation).etapa),
    notas: extra?.notas ?? (conv as IzziConversation).notas ?? '',
  };
}

export async function listIzziConversations(limit = 200): Promise<IzziConversation[]> {
  await hydrateIzziConversationsFromExistingData().catch(() => {});
  const coll = await conversationsColl();
  const docs = await coll
    .find({ clientId: IZZI_CLIENT_ID })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => asIzziConversation(d as RawDoc));
}

export async function getIzziConversationById(id: string): Promise<IzziConversation | null> {
  const coll = await conversationsColl();
  let doc: RawDoc | null = null;
  if (ObjectId.isValid(id)) {
    doc = (await coll.findOne({ _id: new ObjectId(id), clientId: IZZI_CLIENT_ID })) as RawDoc | null;
  }
  if (!doc) {
    doc = (await coll.findOne({
      clientId: IZZI_CLIENT_ID,
      $or: [{ conversationId: id }, { senderId: id }],
    })) as RawDoc | null;
  }
  if (doc) return asIzziConversation(doc);

  const fallback = await getPanelConversationById(IZZI_CLIENT_ID, id);
  return fallback ? toIzziConversation(fallback) : null;
}

export async function appendIzziMessages(
  params: Omit<Parameters<typeof appendPanelMessages>[0], 'clientId'>
): Promise<void> {
  await appendPanelMessages({ ...params, clientId: IZZI_CLIENT_ID });
}

export async function setIzziConversationPaused(conversationId: string, paused: boolean): Promise<boolean> {
  return setPanelConversationPaused(IZZI_CLIENT_ID, conversationId, paused);
}

export type IzziConversationMetaPatch = {
  tipo?: IzziConversationTipo;
  etapa?: string;
  notas?: string;
};

export async function updateIzziConversationMeta(
  id: string,
  patch: IzziConversationMetaPatch
): Promise<IzziConversation | null> {
  const conv = await getIzziConversationById(id);
  if (!conv) return null;

  const tipo = patch.tipo ? normalizeIzziTipo(patch.tipo) : conv.tipo;
  let etapa = typeof patch.etapa === 'string' ? patch.etapa.trim() : conv.etapa;
  if (!isEtapaForTipo(tipo, etapa)) etapa = IZZI_DEFAULT_ETAPA;
  const notas = typeof patch.notas === 'string' ? patch.notas : conv.notas;

  const coll = await conversationsColl();
  const filter: Record<string, unknown> = { clientId: IZZI_CLIENT_ID };
  if (conv._id) filter._id = conv._id;
  else filter.conversationId = conv.conversationId;

  await coll.updateOne(filter, {
    $set: {
      tipo,
      etapa,
      notas,
      updatedAt: new Date(),
    },
  });

  return {
    ...conv,
    tipo,
    etapa,
    notas,
  };
}

export type IzziExportFilters = {
  from?: Date;
  to?: Date;
  tipo?: IzziConversationTipo | 'all';
  etapa?: string;
};

export async function listIzziConversationsForExport(filters: IzziExportFilters): Promise<IzziConversation[]> {
  await hydrateIzziConversationsFromExistingData().catch(() => {});
  const coll = await conversationsColl();
  const query: Record<string, unknown> = { clientId: IZZI_CLIENT_ID };

  if (filters.tipo && filters.tipo !== 'all') {
    query.tipo = filters.tipo;
  }
  if (filters.etapa && filters.etapa !== 'all' && filters.etapa.trim()) {
    query.etapa = filters.etapa.trim();
  }

  const dateRange: Record<string, Date> = {};
  if (filters.from) dateRange.$gte = filters.from;
  if (filters.to) dateRange.$lte = filters.to;
  if (Object.keys(dateRange).length) {
    query.$or = [
      { createdAt: dateRange },
      { lastMessageAt: dateRange },
    ];
  }

  const docs = await coll.find(query).sort({ createdAt: -1 }).limit(5000).toArray();
  let rows = docs.map((d) => asIzziConversation(d as RawDoc));

  if (filters.from || filters.to) {
    rows = rows.filter((c) => {
      const t = c.createdAt.getTime() || c.lastMessageAt.getTime();
      if (filters.from && t < filters.from.getTime()) return false;
      if (filters.to && t > filters.to.getTime()) return false;
      return true;
    });
  }
  return rows;
}

function parseHistory(raw: unknown): PanelConversationMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => {
      const item = m as { role?: string; content?: string; at?: Date | string };
      const roleRaw = String(item.role || '').toLowerCase();
      const role: PanelConversationMessage['role'] =
        roleRaw === 'user' || roleRaw === 'customer' || roleRaw === 'cliente'
          ? 'user'
          : roleRaw === 'agent' || roleRaw === 'human'
            ? 'agent'
            : 'assistant';
      const at =
        item.at instanceof Date
          ? item.at
          : item.at
            ? new Date(item.at)
            : new Date(0);
      return {
        role,
        content: typeof item.content === 'string' ? item.content : '',
        at: Number.isNaN(at.getTime()) ? new Date(0) : at,
      };
    })
    .filter((m) => m.content.trim());
}

function asRecord(doc: unknown): Record<string, unknown> {
  return doc && typeof doc === 'object' ? (doc as Record<string, unknown>) : {};
}

/**
 * Trae chats históricos de `leads` + `chat_sessions` a `conversations`
 * para que el panel muestre lo que ya existía antes de este módulo.
 */
export async function hydrateIzziConversationsFromExistingData(): Promise<void> {
  const db = await getMongoDb();
  const convColl = db.collection('conversations');
  const existing = await convColl
    .find({ clientId: IZZI_CLIENT_ID })
    .project({ conversationId: 1, senderId: 1 })
    .toArray();
  const existingIds = new Set(
    existing.flatMap((d) => [String(d.conversationId || ''), String(d.senderId || '')].filter(Boolean))
  );

  const leads = await db
    .collection('leads')
    .find({ clientId: IZZI_CLIENT_ID, deleted: { $ne: true } })
    .sort({ lastMessageAt: -1 })
    .limit(400)
    .toArray();

  const sessions = await db
    .collection('chat_sessions')
    .find({ clientId: IZZI_CLIENT_ID })
    .sort({ lastMessageAt: -1 })
    .limit(400)
    .toArray();

  const sessionById = new Map(sessions.map((s) => [String(asRecord(s).sessionId || ''), s]));
  const sessionBySender = new Map(sessions.map((s) => [String(asRecord(s).senderId || ''), s]));

  const ops: AnyBulkWriteOperation[] = [];
  const now = new Date();

  const enqueue = (params: {
    conversationId: string;
    senderId: string;
    senderName?: string;
    pageId: string;
    platform: string;
    lastMessage?: string;
    lastMessageAt: Date;
    createdAt: Date;
    botPaused: boolean;
    messages: PanelConversationMessage[];
  }) => {
    if (!params.senderId || existingIds.has(params.conversationId) || existingIds.has(params.senderId)) {
      return;
    }
    existingIds.add(params.conversationId);
    existingIds.add(params.senderId);
    ops.push({
      updateOne: {
        filter: { clientId: IZZI_CLIENT_ID, conversationId: params.conversationId },
        update: {
          $setOnInsert: {
            clientId: IZZI_CLIENT_ID,
            conversationId: params.conversationId,
            senderId: params.senderId,
            senderName: params.senderName,
            pageId: params.pageId,
            platform: params.platform || 'whatsapp',
            channel: 'whatsapp',
            messages: params.messages,
            lastMessage: params.lastMessage || params.messages[params.messages.length - 1]?.content || '',
            lastMessageAt: params.lastMessageAt,
            botPaused: params.botPaused,
            tipo: IZZI_DEFAULT_TIPO,
            etapa: IZZI_DEFAULT_ETAPA,
            notas: '',
            createdAt: params.createdAt,
            updatedAt: now,
          },
        },
        upsert: true,
      },
    });
  };

  for (const leadDoc of leads) {
    const lead = asRecord(leadDoc);
    const senderId = String(lead.senderId || '').trim();
    const conversationId = String(lead.leadId || '').trim() || senderId;
    const session = asRecord(sessionById.get(conversationId) || sessionBySender.get(senderId));
    const messages = parseHistory(session.recentMessages);
    enqueue({
      conversationId,
      senderId,
      senderName:
        typeof lead.senderName === 'string'
          ? lead.senderName
          : typeof lead.nombre === 'string'
            ? lead.nombre
            : undefined,
      pageId: String(lead.pageId || IZZI_PAGE_ID),
      platform: String(lead.platform || 'whatsapp'),
      lastMessage: typeof lead.lastMessage === 'string' ? lead.lastMessage : undefined,
      lastMessageAt: lead.lastMessageAt instanceof Date ? lead.lastMessageAt : now,
      createdAt: lead.createdAt instanceof Date ? lead.createdAt : now,
      botPaused: lead.bot_status === 'paused' || Boolean(lead.assignedTo),
      messages,
    });
  }

  for (const sessionDoc of sessions) {
    const session = asRecord(sessionDoc);
    const senderId = String(session.senderId || '').trim();
    const conversationId = String(session.sessionId || '').trim() || senderId;
    enqueue({
      conversationId,
      senderId,
      pageId: String(session.pageId || IZZI_PAGE_ID),
      platform: String(session.platform || 'whatsapp'),
      lastMessageAt: session.lastMessageAt instanceof Date ? session.lastMessageAt : now,
      createdAt: session.createdAt instanceof Date ? session.createdAt : now,
      botPaused: false,
      messages: parseHistory(session.recentMessages),
    });
  }

  if (ops.length) {
    await convColl.bulkWrite(ops, { ordered: false });
  }
}
