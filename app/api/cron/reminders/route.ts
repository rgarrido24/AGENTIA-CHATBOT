import { NextRequest } from 'next/server';
import { getMongoDB } from '@/src/lib/db';
import { getAppointmentsForReminder } from '@/src/lib/appointments';

const REMINDER_MINUTES = 120;
const WINDOW_MINUTES = 15;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('Authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const appointments = await getAppointmentsForReminder(REMINDER_MINUTES, WINDOW_MINUTES);
    const db = await getMongoDB();

    for (const apt of appointments) {
      const reminderText = `📅 Recordatorio: Tienes una cita en 2 horas (${apt.slotStart.toLocaleString()})`;

      await db.collection('reminder_queue').insertOne({
        appointmentId: (apt as any)._id,
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

    return Response.json({
      ok: true,
      queued: appointments.length,
      appointments: appointments.map((a) => ({
        id: (a as any)._id,
        slotStart: a.slotStart,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}