import { NextRequest, NextResponse } from 'next/server';
import { buildTiendanubeInstallUrl } from '@/lib/tiendanube';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('clientId')?.trim().toLowerCase() || 'biovela';

  try {
    const url = buildTiendanubeInstallUrl(clientId);
    return NextResponse.redirect(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'install_failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
