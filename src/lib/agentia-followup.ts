import { getMongoDb } from '../../lib/mongodb';
import { type AgentiaVentasStatusVendedor } from './leads';
import { createAlertIfUrgent } from './alerts';

export type FollowupQueueItem = {
  _id?: unknown;
  leadId: string;
  senderId: string;
  clientId: string;
  message: string;
  followupNumber: 1 | 2;
  createdAt: Date;
  sentAt?: Date;
};

const FOLLOWUP_1_HOURS = 24;
const FOLLOWUP_2_HOURS = 48;

function buildFollowup1(nombre: string, giro: string): string {
  return `Hola ${nombre}, ¿pudiste ver la demo? Con gusto te explico cómo funcionaría para tu ${giro} 🙌`;
}

function buildFollowup2(nombre: string): string {
  return `Última vez que te escribo ${nombre}, si en algún momento te interesa automatizar tu negocio, aquí estamos 😊`;
}

function firstName(fullName: string | undefined): string {
  return ((fullName || 'amigo').split(' ')[0]) || 'amigo';
}

function hoursSince(date: Date | undefined): number {
  if (!date) return 0;
  return (Date.now() - new Date(date).getTime()) / 3_600_000;
}

/** Genera los mensajes de seguimiento pendientes y los encola. */
export async function processAgentiaFollowups(): Promise<{ enqueued: number }> {
  const db = await getMongoDb();
  const now = new Date();

  const leads = await db
    .collection('leads')
    .find({
      clientId: 'agentia-ventas',
      demo_enviada: true,
      // Solo prospectos que aún no han respondido ni están cerrados
      status_vendedor: { $in: ['nuevo', 'contactado', null, undefined] },
    })
    .toArray();

  let enqueued = 0;

  for (const lead of leads) {
    const lastContact: Date | undefined =
      lead.ultimo_contacto ?? lead.lastMessageAt ?? lead.createdAt;
    const elapsed = hoursSince(lastContact);
    const followupCount: number = lead.follow_up_count ?? 0;
    const nombre = firstName(lead.senderName);
    const giro: string = lead.giro_interes || 'negocio';

    let message: string | null = null;
    let followupNumber: 1 | 2 | null = null;
    let newStatus: AgentiaVentasStatusVendedor = 'contactado';

    if (followupCount === 0 && elapsed >= FOLLOWUP_1_HOURS) {
      message = buildFollowup1(nombre, giro);
      followupNumber = 1;
      newStatus = 'contactado';
    } else if (followupCount === 1 && elapsed >= FOLLOWUP_2_HOURS) {
      message = buildFollowup2(nombre);
      followupNumber = 2;
      newStatus = 'sin_respuesta';
    }

    if (!message || !followupNumber) continue;

    await db.collection<FollowupQueueItem>('agentia_followup_queue').insertOne({
      leadId: lead.leadId,
      senderId: lead.senderId,
      clientId: 'agentia-ventas',
      message,
      followupNumber,
      createdAt: now,
    });

    await db.collection('leads').updateOne(
      { leadId: lead.leadId },
      {
        $set: {
          follow_up_count: followupNumber,
          ultimo_contacto: now,
          status_vendedor: newStatus,
          updatedAt: now,
        },
      }
    );

    enqueued++;
  }

  return { enqueued };
}

/** Devuelve los mensajes de seguimiento pendientes de envío. */
export async function getPendingFollowups(): Promise<FollowupQueueItem[]> {
  const db = await getMongoDb();
  const docs = await db
    .collection<FollowupQueueItem>('agentia_followup_queue')
    .find({ sentAt: { $exists: false } })
    .sort({ createdAt: 1 })
    .limit(50)
    .toArray();
  return docs as unknown as FollowupQueueItem[];
}

/** Marca mensajes de seguimiento como enviados. */
export async function markFollowupsSent(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const db = await getMongoDb();
  const { ObjectId } = await import('mongodb');
  const oids = ids
    .map((id) => { try { return new ObjectId(String(id)); } catch { return null; } })
    .filter((x): x is InstanceType<typeof ObjectId> => x !== null);
  if (!oids.length) return;
  await db
    .collection('agentia_followup_queue')
    .updateMany({ _id: { $in: oids } }, { $set: { sentAt: new Date() } });
}

/**
 * Detecta prospectos que respondieron con interés después de un follow-up
 * y actualiza su status + crea alerta para seguimiento humano.
 */
export async function detectAndFlagInterest(): Promise<{ flagged: number }> {
  const db = await getMongoDb();
  const now = new Date();

  // Leads en seguimiento que tuvieron actividad reciente (< 6h) — indica que respondieron
  const sixHoursAgo = new Date(now.getTime() - 6 * 3_600_000);
  const leads = await db
    .collection('leads')
    .find({
      clientId: 'agentia-ventas',
      status_vendedor: { $in: ['contactado', 'sin_respuesta'] },
      lastMessageAt: { $gte: sixHoursAgo },
    })
    .toArray();

  let flagged = 0;
  for (const lead of leads) {
    await db.collection('leads').updateOne(
      { leadId: lead.leadId },
      {
        $set: {
          status_vendedor: 'interesado' as AgentiaVentasStatusVendedor,
          updatedAt: now,
        },
      }
    );

    await createAlertIfUrgent({
      leadId: lead.leadId,
      clientId: 'agentia-ventas',
      senderName: lead.senderName,
      lastMessage: lead.lastMessage || '',
      platform: lead.platform || 'whatsapp',
      messageCount: 99, // forzar alerta
      assignedTo: lead.assignedTo,
    });

    flagged++;
  }

  return { flagged };
}
