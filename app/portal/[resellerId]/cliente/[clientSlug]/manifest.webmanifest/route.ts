import { buildPortalManifest } from '@/lib/portal-pwa-config';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { resellerId: string; clientSlug: string } },
) {
  const manifest = buildPortalManifest(params.resellerId, params.clientSlug);

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
