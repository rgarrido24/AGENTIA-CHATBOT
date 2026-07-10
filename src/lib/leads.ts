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

export type AgentiaVentasStatusVendedor =
  | 'nuevo'
  | 'contactado'
  | 'interesado'
  | 'vio_demo'
  | 'en_negociacion'
  | 'cerrado'
  | 'sin_respuesta'
  | 'perdido';

export type Lead = {
  leadId: string;
  clientId: string;
  pageId: string;
  senderId: string;
  senderName?: string;
  platform: string;
  source?: 'whatsapp' | 'facebook' | 'instagram';
  pipeline?: string;
  canal_origen?: string;
  nombre?: string;
  telefono?: string;
  /** Portal reseller (leads FB / asesoras) */
  resellerId?: string;
  clientSlug?: string;
  // Facebook Lead Ads
  campana?: string;
  adset?: string;
  form_id?: string;
  leadgen_id?: string;
  source_meta?: boolean;
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
  // Campos exclusivos del pipeline de ventas Agentia
  giro_interes?: string;
  demo_enviada?: boolean;
  demo_vista?: boolean;
  follow_up_count?: number;
  ultimo_contacto?: Date;
  status_vendedor?: AgentiaVentasStatusVendedor;
  createdAt: Date;
  updatedAt: Date;
  /** Soft-delete: si es true, no se debe volver a upsertear el lead. */
  deleted?: boolean;
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

    const existing = await coll.findOne({ leadId });
    if (existing && existing.deleted === true) {
      console.log('[leads] Lead marcado como deleted, no se actualiza:', leadId);
      return;
    }
    const prevMessageCount = existing?.messageCount ?? 0;

    const isAgentiaVentas = params.clientId === 'agentia-ventas';

    const result = await coll.updateOne(
      { leadId },
      {
        $set: {
          // Campos que se actualizan en CADA mensaje — nunca deben estar en $setOnInsert
          senderName: params.senderName ?? undefined,
          platform: params.platform,
          source: normalizeSource(params.platform),
          lastMessage: params.message,
          lastReply: params.reply,
          lastMessageAt: now,
          tags: params.tags,
          updatedAt: now,
          ...(isAgentiaVentas ? {
            nombre: params.senderName ?? params.senderId,
            telefono: params.senderId,
          } : {}),
        },
        $setOnInsert: {
          // Campos que se escriben UNA SOLA VEZ al crear — ninguno puede estar en $set ni $inc
          leadId,
          clientId: params.clientId,
          pageId: params.pageId,
          senderId: params.senderId,
          status: "nuevos",
          bot_status: "active",
          createdAt: now,
          ...(isAgentiaVentas ? {
            pipeline: 'agentia',
            canal_origen: normalizeSource(params.platform),
            status_vendedor: 'nuevo' as AgentiaVentasStatusVendedor,
          } : {}),
        },
        // messageCount solo en $inc, nunca en $set ni $setOnInsert
        $inc: { messageCount: 1 }
      },
      { upsert: true }
    );
    console.log('[leads] Lead guardado correctamente:', leadId, 'clientId:', params.clientId);

    if (result.upsertedCount > 0) {
      const saved = await coll.findOne(
        { leadId },
        { projection: { resellerId: 1, clientSlug: 1, leadId: 1, nombre: 1, senderName: 1, telefono: 1 } },
      );
      if (saved?.resellerId && saved?.clientSlug) {
        void import('../../lib/portal-push')
          .then(({ notifyPortalNewLeadIfResellerClient }) =>
            notifyPortalNewLeadIfResellerClient({
              resellerId: String(saved.resellerId),
              clientSlug: String(saved.clientSlug),
              leadId: String(saved.leadId),
              nombre: saved.nombre ? String(saved.nombre) : undefined,
              senderName: saved.senderName ? String(saved.senderName) : undefined,
              telefono: saved.telefono ? String(saved.telefono) : undefined,
            }),
          )
          .catch((e) => console.error('[leads] notifyPortalNewLeadIfResellerClient:', e));
      }
    }

    if (params.clientId === 'izzi' && prevMessageCount === 0) {
      const botActive =
        !existing ||
        (existing.bot_status !== 'paused' && !(existing.assignedTo && String(existing.assignedTo).trim()));
      void import('./izzi-pipeline-notify')
        .then(({ notifyIzziNewLeadWhatsApp }) =>
          notifyIzziNewLeadWhatsApp({
            senderName: params.senderName,
            senderId: params.senderId,
            botActive,
          })
        )
        .catch((e) => console.error('[leads] notifyIzziNewLeadWhatsApp:', e));
    }
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

export async function updateAgentiaLeadFields(
  leadId: string,
  fields: Partial<Pick<Lead, 'giro_interes' | 'demo_enviada' | 'demo_vista' | 'follow_up_count' | 'ultimo_contacto' | 'status_vendedor'>>
): Promise<boolean> {
  const db = await getMongoDb();
  const result = await db.collection<Lead>('leads').updateOne(
    { leadId },
    { $set: { ...fields, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0 || result.matchedCount > 0;
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
