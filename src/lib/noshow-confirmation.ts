/**
 * Confirmación Anti-No-Show.
 * 3 horas antes de la cita: envía mensaje CONFIRMAR / REPROGRAMAR.
 * El cliente responde "CONFIRMAR" o "REPROGRAMAR" y el bot procesa la respuesta.
 */
import { getMongoDb } from '../../lib/mongodb';
import { enqueueOutbound } from './outbound-queue';
import type { Appointment } from './appointments';

type AppointmentWithConfirmation = Appointment & {
  confirmation_sent_at?: Date;
  confirmation_status?: 'confirmed' | 'reschedule_requested';
};

function buildConfirmationMessage(apt: Appointment): string {
  const slot = apt.slotStart;
  const timeStr = slot.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Mexico_City',
  });
  const dateStr = slot.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Mexico_City',
  });
  const name = apt.senderName ? ` ${apt.senderName.split(' ')[0]}` : '';
  return (
    `Hola${name}! ✂️ Te recordamos tu cita *hoy ${dateStr} a las ${timeStr}*.\n\n` +
    `Por favor confirma tu asistencia respondiendo:\n` +
    `✅ *CONFIRMAR* — para confirmar tu lugar\n` +
    `🔄 *REPROGRAMAR* — si necesitas otro horario\n\n` +
    `¡Te esperamos!`
  );
}

/**
 * Busca citas que empiezan en ~3 horas y aún no tienen confirmation_sent_at.
 * Usa una ventana de 10 minutos para evitar duplicados entre ejecuciones.
 */
export async function getAppointmentsNeedingConfirmation(): Promise<AppointmentWithConfirmation[]> {
  const db = await getMongoDb();
  const now = new Date();
  const from = new Date(now.getTime() + 2.75 * 60 * 60 * 1000);  // 2h45m ahead
  const to = new Date(now.getTime() + 3.25 * 60 * 60 * 1000);    // 3h15m ahead
  return db
    .collection<AppointmentWithConfirmation>('appointments')
    .find({
      status: 'confirmed',
      confirmation_sent_at: { $exists: false },
      slotStart: { $gte: from, $lt: to },
    })
    .toArray();
}

/**
 * Encola mensajes de confirmación para las citas próximas.
 * Usa delaySeconds: 5 (prioridad alta — aviso temporal).
 */
export async function enqueueConfirmationMessages(): Promise<number> {
  const apts = await getAppointmentsNeedingConfirmation();
  const db = await getMongoDb();
  let count = 0;
  for (const apt of apts) {
    try {
      const { ObjectId } = await import('mongodb');
      await enqueueOutbound({
        senderId: apt.senderId,
        clientId: apt.clientId,
        message: buildConfirmationMessage(apt),
        type: 'confirmation',
        delaySeconds: 5,
      });
      // Mark as sent immediately so we don't duplicate
      await db.collection('appointments').updateOne(
        { _id: apt._id as import('mongodb').ObjectId },
        { $set: { confirmation_sent_at: new Date(), updatedAt: new Date() } }
      );
      void ObjectId; // suppress unused warning
      count++;
      console.log(`[noshow-confirmation] Confirmación encolada para ${apt.senderId}`);
    } catch (err) {
      console.error('[noshow-confirmation] Error:', err instanceof Error ? err.message : err);
    }
  }
  return count;
}

/**
 * Procesa la respuesta del cliente a la confirmación de cita.
 * Llamado desde chat-handler cuando llega "CONFIRMAR" o "REPROGRAMAR".
 * Retorna el mensaje de respuesta al cliente, o null si no aplica.
 */
export async function handleConfirmationReply(
  senderId: string,
  message: string,
  clientId: string
): Promise<string | null> {
  const normalized = message.trim().toUpperCase();
  const isConfirm = /^CONFIRMAR$/.test(normalized) || /\bCONFIRMAR\b/i.test(normalized);
  const isReschedule = /^REPROGRAMAR$/.test(normalized) || /\bREPROGRAMAR\b/i.test(normalized);

  if (!isConfirm && !isReschedule) return null;

  const db = await getMongoDb();
  const now = new Date();

  // Find the most recent upcoming confirmed appointment for this sender
  const apt = await db.collection<AppointmentWithConfirmation>('appointments').findOne(
    {
      senderId,
      clientId: clientId.trim().toLowerCase(),
      status: 'confirmed',
      confirmation_sent_at: { $exists: true },
      confirmation_status: { $exists: false },
      slotStart: { $gte: now },
    },
    { sort: { slotStart: 1 } }
  );

  if (!apt) return null;

  if (isConfirm) {
    await db.collection('appointments').updateOne(
      { _id: apt._id as import('mongodb').ObjectId },
      { $set: { confirmation_status: 'confirmed', updatedAt: new Date() } }
    );
    const timeStr = apt.slotStart.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Mexico_City',
    });
    return `✅ ¡Perfecto! Tu cita a las *${timeStr}* está confirmada. ¡Te esperamos! ✂️`;
  }

  // REPROGRAMAR: mark as reschedule_requested + alert admin
  await db.collection('appointments').updateOne(
    { _id: apt._id as import('mongodb').ObjectId },
    { $set: { confirmation_status: 'reschedule_requested', updatedAt: new Date() } }
  );

  // Alert admin via outbound to the admin number (read from env or store as alert)
  const adminNumber = process.env.ALERT_WHATSAPP_NUMBER;
  if (adminNumber) {
    const name = apt.senderName || senderId.replace(/@.*$/, '');
    const slotStr = apt.slotStart.toLocaleString('es-MX', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: 'America/Mexico_City',
    });
    await enqueueOutbound({
      senderId: adminNumber.includes('@') ? adminNumber : `${adminNumber.replace(/\D/g, '')}@c.us`,
      clientId,
      message: `🔄 *REPROGRAMAR CITA*\n👤 ${name}\n📱 ${senderId.replace(/@.*$/, '')}\n🕐 Cita: ${slotStr}\n\nEl cliente quiere reprogramar. Contáctalo.`,
      type: 'manual',
      delaySeconds: 5,
    });
  }

  return (
    `🔄 Entendido, vamos a reprogramar tu cita. ` +
    `Uno de nuestros colaboradores te contactará en breve para darte un nuevo horario. ✂️`
  );
}
