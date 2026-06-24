import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import { AGENTIA_PANEL_CLIENT_ID } from '@/lib/agentia-panel';
import { getPanelConversationById, setPanelConversationPaused } from '@/lib/panel-conversations';
import { setBotPaused } from '@/src/lib/leads';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const conv = await getPanelConversationById(AGENTIA_PANEL_CLIENT_ID, id);
  if (!conv) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  await setBotPaused(conv.conversationId, false);
  await setPanelConversationPaused(AGENTIA_PANEL_CLIENT_ID, id, false);

  return NextResponse.json({ ok: true, botPaused: false });
}
