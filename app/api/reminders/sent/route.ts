import { NextRequest } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

/**
 * El WhatsApp Bridge llama a este endpoint después de enviar un recordatorio.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids) ? body.ids : body?.id ? [body.id] : [];

  if (ids.length === 0) {
    return Response.json({ error: 'ids requerido (array)' }, { status: 400 });
  }

  const db = await getMongoDb();
  const { ObjectId } = await import('mongodb');
  const objectIds = ids.filter((id: unknown) => {
    try {
      new ObjectId(String(id));
      return true;
    } catch {
      return false;
    }
  }).map((id: unknown) => new ObjectId(String(id)));

  const reminders = await db.collection<{ appointmentId?: unknown }>('reminder_queue').find({ _id: { $in: objectIds } }).toArray();
  await db.collection('reminder_queue').updateMany(
    { _id: { $in: objectIds } },
    { $set: { status: 'sent', sentAt: new Date() } }
  );
  for (const r of reminders) {
    if (r.appointmentId) {
      await db.collection('appointments').updateOne(
        { _id: r.appointmentId },
        { $set: { reminderSentAt: new Date() } }
      );
    }
  }

  return Response.json({ ok: true });
}
