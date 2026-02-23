import { NextRequest } from 'next/server';
import { getAppointmentsForReminder } from '@/src/lib/appointments';
import { getMongoDb } from '@/lib/mongodb';

const REMINDER_MINUTES = 2 * 60;
const WINDOW_MINUTES = 15;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const appointments = await getAppointmentsForReminder(REMINDER_MINUTES, WINDOW_MINUTES);
    const db = await getMongoDb();

    for (const apt of appointments) {
      const reminderText = `📅 Recordatorio: Tienes una cita en 2 horas (${apt.slotStart.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}). Si necesitas cancelar, escribe "cancelar".`;

      await db.collection('reminder_queue').insertOne({
        appointmentId: (apt as { _id?: import('mongodb').ObjectId })._id as unknown,
        clientId: apt.clientId,
        senderId: apt.senderId,
        platform: apt.platform,
        message: reminderText,
        status: 'pending',
        createdAt: new Date(),
      });

      await db.collection('appointments').updateOne(
        { _id: (apt as any)._id },
        { $set: { reminderQueuedAt: new Date() } }
      );
    }
    }

    return Response.json({
      ok: true,
      queued: appointments.length,
      appointments: appointments.map((a) => ({
        id: (a as { _id?: unknown })._id,
        slotStart: a.slotStart,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
