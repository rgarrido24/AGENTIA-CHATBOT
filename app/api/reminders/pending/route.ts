import { NextRequest } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

/**
 * El WhatsApp Bridge y otros clientes pueden hacer polling a este endpoint
 * para obtener recordatorios pendientes y enviarlos.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getMongoDb();
  const pending = await db
    .collection<{
      _id?: unknown;
      appointmentId: unknown;
      senderId: string;
      message: string;
      platform: string;
      status?: string;
    }>('reminder_queue')
    .find({ status: 'pending' })
    .limit(50)
    .toArray();

  return Response.json({ reminders: pending });
}
