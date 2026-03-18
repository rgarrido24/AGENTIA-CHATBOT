import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { toPipelineStatus } from '@/src/lib/leads';

function normalizeSource(p: string | undefined): 'whatsapp' | 'facebook' | 'instagram' {
  const s = (p || '').toLowerCase();
  if (s === 'facebook') return 'facebook';
  if (s === 'instagram') return 'instagram';
  return 'whatsapp';
}

export async function GET() {
  try {
    const db = await getMongoDb();
    const [leads, messages] = await Promise.all([
      db.collection('leads').find({}).sort({ lastMessageAt: -1 }).limit(200).toArray(),
      db.collection('leads_agentia').find({}).sort({ createdAt: -1 }).limit(500).toArray(),
    ]);
    return NextResponse.json({
      ok: true,
      leads: (leads || []).map((l: Record<string, unknown>) => ({
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
      })),
      messages: (messages || []).map((m: Record<string, unknown>) => ({
        clientId: m.clientId,
        message: m.message,
        reply: m.reply,
        createdAt: m.createdAt,
        platform: m.platform ?? '',
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[api/leads]', err);
    return NextResponse.json({ ok: false, error: msg, leads: [], messages: [] }, { status: 500 });
  }
}
