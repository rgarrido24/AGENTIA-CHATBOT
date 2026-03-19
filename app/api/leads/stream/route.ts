import { getMongoDb } from '@/lib/mongodb';
import { toPipelineStatus } from '@/src/lib/leads';

function normalizeSource(p: string | undefined): 'whatsapp' | 'facebook' | 'instagram' {
  const s = (p || '').toLowerCase();
  if (s === 'facebook') return 'facebook';
  if (s === 'instagram') return 'instagram';
  return 'whatsapp';
}

function mapLead(l: Record<string, unknown>) {
  return {
    leadId: l.leadId || `${l.senderId || ''}_${l.pageId || ''}_${l.clientId || ''}`,
    senderName: l.senderName ?? 'Sin nombre',
    senderId: l.senderId ?? undefined,
    pageId: l.pageId ?? undefined,
    clientId: l.clientId ?? '',
    source: l.source ?? normalizeSource(String(l.platform || '')),
    status: toPipelineStatus(String(l.status || '')),
    is_being_handled_by: l.is_being_handled_by ?? null,
    bot_status: l.bot_status ?? 'active',
    assignedTo: l.assignedTo ?? null,
    lastMessage: l.lastMessage ?? '',
    lastReply: l.lastReply ?? '',
    lastMessageAt: l.lastMessageAt ?? null,
    lastClassifiedByAI: l.lastClassifiedByAI ?? null,
    cancelReason: l.cancelReason ?? null,
    messageCount: l.messageCount ?? 0,
    platform: l.platform ?? '',
    documentExpedient: l.documentExpedient ?? null,
    createdAt: l.createdAt ?? null,
  };
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send initial ping
      send('ping', { ts: Date.now() });

      let lastHash = '';
      let lastAlertHash = '';

      const poll = async () => {
        if (closed) return;
        try {
          const db = await getMongoDb();
          const [leads, alerts] = await Promise.all([
            db.collection('leads').find({}).sort({ lastMessageAt: -1 }).limit(200).toArray(),
            db.collection('lead_alerts').find({ sentAt: { $exists: false } }).sort({ createdAt: -1 }).limit(20).toArray(),
          ]);

          // Build a lightweight hash from lastMessageAt + status of all leads
          const leadsHash = leads
            .map((l) => `${l.leadId || l._id}:${String(l.lastMessageAt)}:${l.status}:${l.messageCount}`)
            .join('|');

          const alertHash = alerts.map((a) => String(a._id)).join('|');

          if (leadsHash !== lastHash) {
            lastHash = leadsHash;
            send('leads', { leads: leads.map(mapLead) });
          }

          if (alertHash !== lastAlertHash) {
            lastAlertHash = alertHash;
            send('alerts', {
              alerts: alerts.map((a) => ({
                id: String(a._id),
                leadId: a.leadId,
                clientId: a.clientId,
                senderId: a.senderId,
                senderName: a.senderName,
                lastMessage: a.lastMessage,
                platform: a.platform ?? '',
                reason: a.reason,
                createdAt: a.createdAt,
                sentAt: a.sentAt,
              })),
            });
          }
        } catch (err) {
          console.error('[SSE /api/leads/stream] poll error:', err);
        }
      };

      // Poll immediately then every 3s
      await poll();
      const interval = setInterval(poll, 3000);

      // Keep-alive ping every 20s
      const pingInterval = setInterval(() => {
        send('ping', { ts: Date.now() });
      }, 20000);

      // Clean up when client disconnects
      const cleanup = () => {
        closed = true;
        clearInterval(interval);
        clearInterval(pingInterval);
        try { controller.close(); } catch { /* already closed */ }
      };

      // Abort signal is not directly available in ReadableStream start(),
      // but we set a max lifetime of 5 minutes to avoid zombie connections
      setTimeout(cleanup, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
