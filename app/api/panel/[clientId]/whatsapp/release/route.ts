import { NextRequest } from 'next/server';
import { verifyClientPanelAuth, jsonUnauthorized } from '@/lib/client-panel-auth';
import { getConversation, setHumanMode } from '@/lib/client-panel-store';
import { bridgeResumePhone } from '@/lib/baileys-bridge-client';

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const clientId = params.clientId.toLowerCase();
  if (!verifyClientPanelAuth(request, clientId)) return jsonUnauthorized();

  const body = await request.json().catch(() => ({}));
  const convId = typeof body.convId === 'string' ? body.convId : '';
  if (!convId) return Response.json({ error: 'convId requerido' }, { status: 400 });

  const conv = await getConversation(clientId, convId);
  if (!conv) return Response.json({ error: 'Conversación no encontrada' }, { status: 404 });

  await setHumanMode(clientId, convId, false);
  await bridgeResumePhone(clientId, conv.phone);

  return Response.json({ ok: true, humanMode: false });
}
