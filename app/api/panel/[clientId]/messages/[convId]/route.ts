import { NextRequest } from 'next/server';
import { verifyClientPanelAuth, jsonUnauthorized } from '@/lib/client-panel-auth';
import {
  appendAdvisorMessage,
  getConversation,
  markConversationRead,
  serializeMessage,
} from '@/lib/client-panel-store';
import { bridgeSendMessage } from '@/lib/baileys-bridge-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string; convId: string } }
) {
  const clientId = params.clientId.toLowerCase();
  if (!verifyClientPanelAuth(request, clientId)) return jsonUnauthorized();

  const conv = await getConversation(clientId, decodeURIComponent(params.convId));
  if (!conv) return Response.json({ error: 'Conversación no encontrada' }, { status: 404 });

  await markConversationRead(clientId, params.convId);

  return Response.json({
    conversation: {
      id: params.convId,
      phone: conv.phone,
      contactName: conv.contactName || conv.phone,
      stage: conv.stage,
      tags: conv.tags || [],
      notes: conv.notes || '',
      humanMode: !!conv.humanMode,
    },
    messages: (conv.messages || []).map(serializeMessage),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string; convId: string } }
) {
  const clientId = params.clientId.toLowerCase();
  if (!verifyClientPanelAuth(request, clientId)) return jsonUnauthorized();

  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return Response.json({ error: 'message requerido' }, { status: 400 });

  const conv = await getConversation(clientId, decodeURIComponent(params.convId));
  if (!conv) return Response.json({ error: 'Conversación no encontrada' }, { status: 404 });
  if (!conv.humanMode) {
    return Response.json({ error: 'Debes tomar control antes de enviar mensajes' }, { status: 403 });
  }

  await bridgeSendMessage(clientId, conv.phone, message);
  const saved = await appendAdvisorMessage(clientId, params.convId, message);

  return Response.json({ ok: true, message: saved ? serializeMessage(saved) : null });
}
