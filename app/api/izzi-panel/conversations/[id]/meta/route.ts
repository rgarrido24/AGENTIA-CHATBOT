import { NextRequest, NextResponse } from 'next/server';
import { isIzziPanelAuthenticated } from '@/lib/izzi-panel-auth';
import { updateIzziConversationMeta } from '@/lib/izzi-conversations';
import { isIzziTipo, type IzziConversationTipo } from '@/lib/izzi-panel';
import { panelConversationPublicId } from '@/lib/panel-conversations';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  if (!isIzziPanelAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const patch: { tipo?: IzziConversationTipo; etapa?: string; notas?: string } = {};
  if (isIzziTipo(body?.tipo)) patch.tipo = body.tipo;
  if (typeof body?.etapa === 'string') patch.etapa = body.etapa;
  if (typeof body?.notas === 'string') patch.notas = body.notas.slice(0, 4000);

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }

  const conv = await updateIzziConversationMeta(id, patch);
  if (!conv) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    conversation: {
      id: panelConversationPublicId(conv),
      tipo: conv.tipo,
      etapa: conv.etapa,
      notas: conv.notas,
    },
  });
}
