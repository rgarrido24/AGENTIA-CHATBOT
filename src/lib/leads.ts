import { getMongoDb } from "../../lib/mongodb";

export const PIPELINE_STATUSES = [
  'nuevos',
  'preguntones',
  'seguimiento',
  'interesado',
  'cierres',
  'cancelados',
] as const;
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

const LEGACY_TO_PIPELINE: Record<string, PipelineStatus> = {
  Interesado: 'interesado',
  Calificado: 'seguimiento',
  Cerrado: 'cierres',
  Perdido: 'preguntones',
  Cancelado: 'cancelados',
};

export type DocumentExpedient = {
  nombre: string;
  curp: string;
  direccion: string;
  telefono: string;
  correo: string;
  paquete: string;
  promocion: string;
};

export type Lead = {
  leadId: string;
  clientId: string;
  pageId: string;
  senderId: string;
  senderName?: string;
  platform: string;
  source?: 'whatsapp' | 'facebook' | 'instagram';
  status: PipelineStatus | string;
  assignedTo?: string;
  bot_status?: 'active' | 'paused';
  is_being_handled_by?: string;
  lastMessage?: string;
  lastReply?: string;
  lastMessageAt?: Date;
  lastClassifiedByAI?: Date;
  cancelReason?: string;
  messageCount: number;
  tags: string[];
  documentExpedient?: DocumentExpedient;
  createdAt: Date;
  updatedAt: Date;
};

export function toPipelineStatus(s: string | undefined): PipelineStatus {
  if (!s) return 'nuevos';
  const normalized = (s || '').toLowerCase().trim();
  if (PIPELINE_STATUSES.includes(normalized as PipelineStatus)) return normalized as PipelineStatus;
  return (LEGACY_TO_PIPELINE[s] as PipelineStatus) ?? 'nuevos';
}

function makeLeadId(senderId: string, pageId: string, clientId: string): string {
  return `${senderId}_${pageId}_${clientId}`;
}

function normalizeSource(platform: string): 'whatsapp' | 'facebook' | 'instagram' {
  const p = (platform || '').toLowerCase();
  if (p === 'facebook') return 'facebook';
  if (p === 'instagram') return 'instagram';
  return 'whatsapp';
}

export async function upsertLead(params: {
  senderId: string;
  pageId: string;
  clientId: string;
  senderName?: string;
  platform: string;
  message: string;
  reply: string;
  tags: string[];
}): Promise<void> {
  const leadId = makeLeadId(params.senderId, params.pageId, params.clientId);
  try {
    const db = await getMongoDb();
    const coll = db.collection<Lead>("leads");
    const now = new Date();

    await coll.updateOne(
      { leadId },
      {
        $set: {
          senderName: params.senderName ?? undefined,
          platform: params.platform,
          source: normalizeSource(params.platform),
          lastMessage: params.message,
          lastReply: params.reply,
          lastMessageAt: now,
          tags: params.tags,
          updatedAt: now
        },
        $setOnInsert: {
          leadId,
          clientId: params.clientId,
          pageId: params.pageId,
          senderId: params.senderId,
          status: "nuevos",
          bot_status: "active",
          createdAt: now
        },
        $inc: { messageCount: 1 }
      },
      { upsert: true }
    );
    console.log('[leads] Lead guardado correctamente:', leadId, 'clientId:', params.clientId);
  } catch (err) {
    console.error('[leads] Error al guardar lead:', leadId, err instanceof Error ? err.message : err);
    throw err;
  }
}

export function makeLeadIdFromParams(senderId: string, pageId: string, clientId: string): string {
  return makeLeadId(senderId, pageId, clientId);
}

export async function getLeadById(leadId: string): Promise<Lead | null> {
  const db = await getMongoDb();
  const doc = await db.collection<Lead>("leads").findOne({ leadId });
  return doc;
}

export async function assignLeadToVendedor(leadId: string, vendedorName: string): Promise<boolean> {
  const db = await getMongoDb();
  const result = await db.collection<Lead>("leads").updateOne(
    { leadId },
    { $set: { assignedTo: vendedorName.trim() || undefined, bot_status: 'paused', updatedAt: new Date() } }
  );
  return result.modifiedCount > 0 || result.matchedCount > 0;
}

export async function unassignLead(leadId: string): Promise<boolean> {
  const db = await getMongoDb();
  const result = await db.collection<Lead>("leads").updateOne(
    { leadId },
    { $unset: { assignedTo: "" }, $set: { bot_status: 'active', updatedAt: new Date() } }
  );
  return result.modifiedCount > 0 || result.matchedCount > 0;
}

/** Pausa o reanuda el bot para un lead (sin asignar a vendedor). Kill switch por lead. */
export async function setBotPaused(leadId: string, paused: boolean): Promise<boolean> {
  const db = await getMongoDb();
  const result = await db.collection<Lead>("leads").updateOne(
    { leadId },
    { $set: { bot_status: paused ? 'paused' : 'active', updatedAt: new Date() } }
  );
  return result.modifiedCount > 0 || result.matchedCount > 0;
}

export async function setLeadHandledBy(leadId: string, handlerId: string | null): Promise<boolean> {
  const db = await getMongoDb();
  const result = handlerId
    ? await db.collection<Lead>("leads").updateOne(
        { leadId },
        { $set: { is_being_handled_by: handlerId, updatedAt: new Date() } }
      )
    : await db.collection<Lead>("leads").updateOne(
        { leadId },
        { $unset: { is_being_handled_by: "" }, $set: { updatedAt: new Date() } }
      );
  return result.modifiedCount > 0 || result.matchedCount > 0;
}

export async function updateLeadStatus(
  leadId: string,
  status: PipelineStatus,
  opts?: { closedBy?: string; clientId?: string; fromAI?: boolean; cancelReason?: string }
): Promise<boolean> {
  const db = await getMongoDb();
  const now = new Date();
  const setPayload: Record<string, unknown> = { status, updatedAt: now };
  if (opts?.fromAI) {
    setPayload.lastClassifiedByAI = now;
  }
  if (status === 'cancelados' && opts?.cancelReason?.trim()) {
    setPayload.cancelReason = opts.cancelReason.trim();
  }
  const result = await db.collection<Lead>("leads").updateOne(
    { leadId },
    { $set: setPayload }
  );
  if (result.modifiedCount > 0 && status === 'cierres' && opts?.closedBy) {
    const { recordIntervention } = await import('./intervention-history');
    await recordIntervention({
      leadId,
      handlerId: opts.closedBy,
      action: 'closed',
      clientId: opts.clientId ?? '',
      statusAtAction: status,
    }).catch(() => {});
  }
  return result.modifiedCount > 0 || result.matchedCount > 0;
}

export function isBotPaused(lead: Lead | null): boolean {
  if (!lead) return false;
  return lead.bot_status === 'paused' || !!lead.assignedTo;
}

export async function deleteLead(leadId: string): Promise<boolean> {
  const db = await getMongoDb();
  const result = await db.collection<Lead>('leads').deleteOne({ leadId });
  return (result.deletedCount ?? 0) > 0;
}

export async function updateLeadDocumentExpedient(
  leadId: string,
  documentExpedient: DocumentExpedient
): Promise<boolean> {
  const db = await getMongoDb();
  const result = await db.collection<Lead>('leads').updateOne(
    { leadId },
    { $set: { documentExpedient, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0 || result.matchedCount > 0;
}
