import { NextResponse } from 'next/server';
import { getRecentAlerts } from '@/src/lib/alerts';

export async function GET() {
  try {
    const alerts = await getRecentAlerts(50);
    return NextResponse.json({
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
        sentAt: a.sentAt,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
