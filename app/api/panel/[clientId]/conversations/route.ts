import { NextRequest } from 'next/server';
import { verifyClientPanelAuth, jsonUnauthorized } from '@/lib/client-panel-auth';
import {
  getPanelMetrics,
  listConversations,
  serializeConversation,
} from '@/lib/client-panel-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const clientId = params.clientId.toLowerCase();
  if (!verifyClientPanelAuth(request, clientId)) return jsonUnauthorized();

  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') || undefined;
  const filter = (searchParams.get('filter') || 'all') as
    | 'all'
    | 'unread'
    | 'bot_active'
    | 'advisor_active'
    | 'closed';
  const page = Number(searchParams.get('page') || '1');
  const withMetrics = searchParams.get('metrics') === '1';

  const { items, total, limit } = await listConversations(clientId, { q, filter, page });
  const conversations = items.map(serializeConversation);
  const metrics = withMetrics ? await getPanelMetrics(clientId) : undefined;

  return Response.json({ conversations, total, limit, page, metrics });
}
