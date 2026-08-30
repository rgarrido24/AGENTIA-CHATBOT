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

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const { signal } = request;

  let interval: ReturnType<typeof setInterval> | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let controllerRef: ReadableStreamDefaultController | null = null;
  let closed = false;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    if (interval) clearInterval(interval);
    if (pingInterval) clearInterval(pingInterval);
    try { controllerRef?.close(); } catch { /* already closed */ }
  };

  // Limpiar cuando el cliente se desconecta
  signal.addEventListener('abort', cleanup);

  const stream = new ReadableStream({
    async start(controller) {
      controllerRef = controller;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          cleanup();
        }
      };

      send('ping', { ts: Date.now() });

      let lastHash = '';
      let lastAlertHash = '';

      const poll = async () => {
        if (closed) return;
        try {
          const db = await getMongoDb();
          const [leads, alerts] = await Promise.all([
            db.collection('leads').find({}).sort({ lastMessageAt: -1 }).limit(200).toArray(),
            db.collection('lead_alerts')
              .find({ sentAt: { $exists: false } })
              .sort({ createdAt: -1 })
              .limit(20)
              .toArray(),
          ]);

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

      await poll();
      interval = setInterval(poll, 3000);

      // Keep-alive cada 25s para evitar que proxies cierren la conexión
      pingInterval = setInterval(() => {
        send('ping', { ts: Date.now() });
      }, 25000);

      // Cierre máximo a los 10 minutos (el cliente reconecta automáticamente)
      setTimeout(cleanup, 10 * 60 * 1000);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
