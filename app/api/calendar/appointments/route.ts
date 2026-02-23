import { NextRequest } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status') ?? 'confirmed';

    const db = await getMongoDb();
    const filter: Record<string, unknown> = { status };
    if (clientId?.trim()) filter.clientId = clientId.trim().toLowerCase();

    const appointments = await db
      .collection('appointments')
      .find(filter)
      .sort({ slotStart: 1 })
      .limit(100)
      .toArray();

    return Response.json({
      appointments: appointments.map((a) => ({
        id: String((a as { _id?: unknown })._id ?? ''),
        clientId: a.clientId,
        slotStart: (a as { slotStart?: Date }).slotStart?.toISOString?.() ?? '',
        slotEnd: (a as { slotEnd?: Date }).slotEnd?.toISOString?.() ?? '',
        senderName: a.senderName,
        senderId: a.senderId,
        platform: a.platform,
        status: a.status,
        createdAt: (a as { createdAt?: Date }).createdAt?.toISOString?.() ?? '',
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
