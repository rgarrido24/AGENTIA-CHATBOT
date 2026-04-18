/**
 * Solicitud de Reseñas post-servicio.
 * 1 hora después de que termina la cita, envía link de Google Maps + 10% descuento.
 */
import { getMongoDb } from '../../lib/mongodb';
import { enqueueOutbound } from './outbound-queue';
import type { Appointment } from './appointments';

type AppointmentWithReview = Appointment & {
  review_sent_at?: Date;
};

function buildReviewMessage(apt: AppointmentWithReview, reviewUrl: string): string {
  const name = apt.senderName ? ` ${apt.senderName.split(' ')[0]}` : '';
  return (
    `¡Gracias por visitarnos${name}! ✂️✨\n\n` +
    `Esperamos que hayas quedado increíble. Si tienes un momento, nos ayudaría mucho que dejaras una reseña:\n` +
    `⭐ ${reviewUrl}\n\n` +
    `Como agradecimiento, en tu próxima visita tienes un *10% de descuento* 🎁\n` +
    `Solo muéstrale este mensaje al estilista. ¡Hasta la próxima!`
  );
}

/**
 * Busca citas cuyo slotEnd fue hace entre 55 y 75 minutos (ventana de detección).
 * Solo citas sin review_sent_at para no duplicar.
 */
export async function getAppointmentsNeedingReview(clientId: string): Promise<AppointmentWithReview[]> {
  const db = await getMongoDb();
  const now = new Date();
  const from = new Date(now.getTime() - 75 * 60 * 1000); // 75 min ago
  const to = new Date(now.getTime() - 55 * 60 * 1000);   // 55 min ago
  return db
    .collection<AppointmentWithReview>('appointments')
    .find({
      clientId: clientId.trim().toLowerCase(),
      status: 'confirmed',
      review_sent_at: { $exists: false },
      slotEnd: { $gte: from, $lt: to },
    })
    .toArray();
}

/**
 * Encola solicitudes de reseña para citas que terminaron ~1 hora atrás.
 * La URL de reseña se lee de la config del negocio o se usa un fallback de maps.
 */
export async function enqueueReviewRequests(
  clientId: string,
  reviewUrl: string
): Promise<number> {
  const apts = await getAppointmentsNeedingReview(clientId);
  const db = await getMongoDb();
  let count = 0;
  for (const apt of apts) {
    try {
      await enqueueOutbound({
        senderId: apt.senderId,
        clientId,
        message: buildReviewMessage(apt, reviewUrl),
        type: 'review',
      });
      await db.collection('appointments').updateOne(
        { _id: apt._id as import('mongodb').ObjectId },
        { $set: { review_sent_at: new Date(), updatedAt: new Date() } }
      );
      count++;
      console.log(`[review-requests] Reseña encolada para ${apt.senderId}`);
    } catch (err) {
      console.error('[review-requests] Error:', err instanceof Error ? err.message : err);
    }
  }
  return count;
}
