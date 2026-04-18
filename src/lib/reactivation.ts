/**
 * Lógica de Recuperación de Clientes Inactivos.
 * Detecta leads cuya última cita fue hace más de N días y encola un mensaje proactivo.
 */
import { getMongoDb } from '../../lib/mongodb';
import { enqueueOutbound } from './outbound-queue';

export type InactiveLead = {
  senderId: string;
  senderName?: string;
  clientId: string;
  lastAppointment: Date;
  daysSince: number;
};

export async function getLeadsForReactivation(
  clientId: string,
  daysThreshold = 20
): Promise<InactiveLead[]> {
  const db = await getMongoDb();
  const cutoff = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);

  // Aggregate: last confirmed appointment per sender
  const pipeline = [
    {
      $match: {
        clientId: clientId.trim().toLowerCase(),
        status: 'confirmed',
      },
    },
    {
      $sort: { slotStart: -1 },
    },
    {
      $group: {
        _id: '$senderId',
        lastAppointment: { $first: '$slotStart' },
        senderName: { $first: '$senderName' },
        clientId: { $first: '$clientId' },
      },
    },
    {
      $match: {
        lastAppointment: { $lt: cutoff },
      },
    },
  ];

  const docs = await db.collection('appointments').aggregate(pipeline).toArray();
  const now = Date.now();
  return docs.map((d) => ({
    senderId: String(d._id),
    senderName: d.senderName as string | undefined,
    clientId: d.clientId as string,
    lastAppointment: d.lastAppointment as Date,
    daysSince: Math.floor((now - (d.lastAppointment as Date).getTime()) / (24 * 60 * 60 * 1000)),
  }));
}

function buildReactivationMessage(lead: InactiveLead): string {
  const firstName = lead.senderName ? lead.senderName.split(' ')[0] : 'amigo';
  return (
    `Hola ${firstName} 👋 Ya te extrañamos en la barbería. ` +
    `¿Agendamos para mantener tu estilo impecable esta semana? ✂️\n` +
    `Escríbenos y te damos horario de inmediato.`
  );
}

/**
 * Encola mensajes de reactivación para todos los inactivos de un clientId.
 * Cada mensaje lleva el delay aleatorio de `outbound-queue` (30-60 s).
 * Retorna el número de mensajes encolados.
 */
export async function enqueueReactivationMessages(
  clientId: string,
  daysThreshold = 20
): Promise<number> {
  const leads = await getLeadsForReactivation(clientId, daysThreshold);
  let count = 0;
  for (const lead of leads) {
    try {
      // Check if we already sent a reactivation in the last 7 days
      const db = await getMongoDb();
      const recentlySent = await db.collection('outbound_messages').findOne({
        senderId: lead.senderId,
        clientId: clientId.trim().toLowerCase(),
        type: 'reactivation',
        createdAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });
      if (recentlySent) continue;

      await enqueueOutbound({
        senderId: lead.senderId,
        clientId,
        message: buildReactivationMessage(lead),
        type: 'reactivation',
      });
      count++;
      console.log(`[reactivation] Encolado para ${lead.senderId} (${lead.daysSince} días inactivo)`);
    } catch (err) {
      console.error('[reactivation] Error encolando:', err instanceof Error ? err.message : err);
    }
  }
  return count;
}
