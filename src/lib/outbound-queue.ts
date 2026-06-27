/**
 * Cola de mensajes salientes con delay anti-baneo.
 * Inserta en la colección `outbound_messages` con `scheduledFor`
 * para que el bridge de WhatsApp los envíe escalonados (30-60 segundos
 * de retraso aleatorio por mensaje).
 */
import { getMongoDb } from '../../lib/mongodb';

export type OutboundMessageType = 'reactivation' | 'confirmation' | 'review' | 'manual' | 'followup';

/** Retraso aleatorio entre 30 y 60 segundos para proteger el número del baneo */
function randomDelaySecs(min = 30, max = 60): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Encola un mensaje saliente. El bridge lo enviará cuando llegue `scheduledFor`.
 * @param delaySeconds Si se omite, aplica delay aleatorio 30-60 s.
 */
export async function enqueueOutbound(params: {
  senderId: string;
  clientId: string;
  message: string;
  type: OutboundMessageType;
  delaySeconds?: number;
  mediaUrl?: string;
}): Promise<void> {
  const db = await getMongoDb();
  const delaySecs = params.delaySeconds ?? randomDelaySecs();
  const now = new Date();
  await db.collection('outbound_messages').insertOne({
    senderId: params.senderId,
    clientId: params.clientId.trim().toLowerCase(),
    message: params.message,
    type: params.type,
    mediaUrl: params.mediaUrl ?? null,
    scheduledFor: new Date(now.getTime() + delaySecs * 1000),
    createdAt: now,
  });
  console.log(
    `[outbound-queue] Encolado para ${params.senderId} | tipo: ${params.type} | delay: ${delaySecs}s`
  );
}
