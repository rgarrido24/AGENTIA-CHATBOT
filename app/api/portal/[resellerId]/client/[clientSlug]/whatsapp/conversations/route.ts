import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { authWaRoute, type WaRouteCtx } from '@/lib/wa-route-auth';
import { WA_CONVERSATIONS, windowOpen, type WaConversationDoc } from '@/lib/wa-inbox';

export const dynamic = 'force-dynamic';

/** Lista de conversaciones del cliente, la más reciente primero. */
export async function GET(req: NextRequest, ctx: WaRouteCtx) {
  const auth = await authWaRoute(req, ctx.params);
  if (auth.error) return auth.error;
  const db = await getMongoDb();
  const rows = await db
    .collection<WaConversationDoc>(WA_CONVERSATIONS)
    .find({ resellerId: ctx.params.resellerId, clientSlug: ctx.params.clientSlug })
    .sort({ lastMessageAt: -1 })
    .limit(200)
    .toArray();
  const now = Date.now();
  return NextResponse.json({
    ok: true,
    unreadTotal: rows.reduce((n, r) => n + (r.unread || 0), 0),
    conversations: rows.map((r) => ({
      contactKey: r.contactKey,
      name: r.name || '',
      leadId: r.leadId || null,
      lastText: r.lastText || '',
      lastDirection: r.lastDirection,
      lastMessageAt: r.lastMessageAt,
      unread: r.unread || 0,
      /** false = le escribimos pero la persona todavía no ha contestado nunca. */
      replied: !!r.lastInboundAt,
      windowOpen: windowOpen(r.lastInboundAt, now),
    })),
  });
}
