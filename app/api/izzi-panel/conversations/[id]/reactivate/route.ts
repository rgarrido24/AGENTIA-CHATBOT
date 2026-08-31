import { NextRequest, NextResponse } from 'next/server';
import { getIzziPanelClientId } from '@/lib/izzi-panel-auth';
import {
  getIzziConversationById,
  setIzziConversationPaused,
} from '@/lib/izzi-conversations';
import { setBotPaused } from '@/src/lib/leads';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const clientId = getIzziPanelClientId(req);
  if (!clientId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const conv = await getIzziConversationById(clientId, id);
  if (!conv) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  await setBotPaused(conv.conversationId, false);
  await setIzziConversationPaused(clientId, id, false);

  return NextResponse.json({ ok: true, botPaused: false });
}
