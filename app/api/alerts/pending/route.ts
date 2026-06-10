import { NextRequest } from 'next/server';
import { getPendingAlerts } from '@/src/lib/alerts';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alerts = await getPendingAlerts();
    return Response.json({
      alerts: alerts.map((a) => ({
        id: String(a._id),
        leadId: a.leadId,
        clientId: a.clientId,
        senderId: a.senderId,
        senderName: a.senderName,
        lastMessage: a.lastMessage,
        platform: a.platform,
        reason: a.reason,
        createdAt: a.createdAt,
        notifyWhatsappTo: a.notifyWhatsappTo,
        resellerId: a.resellerId,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
