import { NextRequest, NextResponse } from 'next/server';
import { getIzziPanelClientId } from '@/lib/izzi-panel-auth';
import { izziPanelBrand } from '@/lib/izzi-panel-brand';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const clientId = getIzziPanelClientId(req);
  if (!clientId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const brand = izziPanelBrand(clientId);
  return NextResponse.json({
    clientId,
    brand: brand.id,
    name: brand.name,
  });
}
