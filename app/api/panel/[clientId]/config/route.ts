import { NextRequest } from 'next/server';
import { verifyClientPanelAuth, jsonUnauthorized } from '@/lib/client-panel-auth';
import { getClientConfig } from '@/lib/client-panel-store';
import { getClientPanelBrand } from '@/lib/client-panel-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const clientId = params.clientId.toLowerCase();
  if (!verifyClientPanelAuth(request, clientId)) return jsonUnauthorized();

  const config = await getClientConfig(clientId);
  const brand = getClientPanelBrand(clientId, config);

  return Response.json({ brand, config });
}
