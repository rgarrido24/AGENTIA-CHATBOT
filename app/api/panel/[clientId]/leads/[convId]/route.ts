import { NextRequest } from 'next/server';
import { verifyClientPanelAuth, jsonUnauthorized } from '@/lib/client-panel-auth';
import {
  getConversation,
  serializeConversation,
  updateConversationLead,
  computePurchaseIntent,
} from '@/lib/client-panel-store';

export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string; convId: string } }
) {
  const clientId = params.clientId.toLowerCase();
  if (!verifyClientPanelAuth(request, clientId)) return jsonUnauthorized();

  const body = await request.json().catch(() => ({}));
  const patch: { stage?: string; notes?: string; tags?: string[] } = {};
  if (typeof body.stage === 'string') patch.stage = body.stage;
  if (typeof body.notes === 'string') patch.notes = body.notes;
  if (Array.isArray(body.tags)) patch.tags = body.tags.map(String);

  const updated = await updateConversationLead(clientId, decodeURIComponent(params.convId), patch);
  if (!updated) return Response.json({ error: 'Conversación no encontrada' }, { status: 404 });

  const serialized = serializeConversation(updated);
  return Response.json({
    ...serialized,
    purchaseIntent: computePurchaseIntent(updated),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string; convId: string } }
) {
  const clientId = params.clientId.toLowerCase();
  if (!verifyClientPanelAuth(request, clientId)) return jsonUnauthorized();

  const conv = await getConversation(clientId, decodeURIComponent(params.convId));
  if (!conv) return Response.json({ error: 'Conversación no encontrada' }, { status: 404 });

  return Response.json({
    ...serializeConversation(conv),
    purchaseIntent: computePurchaseIntent(conv),
  });
}
