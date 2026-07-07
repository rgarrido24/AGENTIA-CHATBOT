import { NextResponse } from 'next/server';
import { PORTAL_PWA_ICON } from '@/lib/portal-push';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { resellerId: string; clientSlug: string } },
) {
  const { resellerId, clientSlug } = params;
  const startUrl = `/portal/${resellerId}/cliente/${clientSlug}`;

  const manifest = {
    name: 'Mis Leads',
    short_name: 'Leads',
    start_url: startUrl,
    scope: `${startUrl}/`,
    display: 'standalone',
    theme_color: '#0a0f1a',
    background_color: '#0a0f1a',
    icons: [
      {
        src: PORTAL_PWA_ICON,
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: PORTAL_PWA_ICON,
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
