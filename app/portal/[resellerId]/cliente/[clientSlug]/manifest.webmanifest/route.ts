import { NextResponse } from 'next/server';
import { PORTAL_PWA_ICON_192, PORTAL_PWA_ICON_512 } from '@/lib/portal-pwa-config';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { resellerId: string; clientSlug: string } },
) {
  const { resellerId, clientSlug } = params;
  const startUrl = `/portal/${resellerId}/cliente/${clientSlug}`;

  const manifest = {
    name: 'Mis Leads — Panel de asesoras',
    short_name: 'Mis Leads',
    description: 'Gestión de leads en tiempo real',
    start_url: startUrl,
    scope: `${startUrl}/`,
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0a0f1a',
    theme_color: '#0a0f1a',
    lang: 'es-MX',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: PORTAL_PWA_ICON_192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: PORTAL_PWA_ICON_512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: PORTAL_PWA_ICON_512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
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
