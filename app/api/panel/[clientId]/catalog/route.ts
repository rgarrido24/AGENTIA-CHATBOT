import { NextRequest } from 'next/server';
import { verifyClientPanelAuth, jsonUnauthorized } from '@/lib/client-panel-auth';
import { BIOVELA_CATALOG } from '@/lib/biovela-catalog';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const clientId = params.clientId.toLowerCase();
  if (!verifyClientPanelAuth(request, clientId)) return jsonUnauthorized();

  if (clientId === 'biovela') {
    return Response.json({ products: BIOVELA_CATALOG });
  }

  return Response.json({ products: [] });
}
