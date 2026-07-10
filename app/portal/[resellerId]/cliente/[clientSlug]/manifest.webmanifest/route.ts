import { NextResponse } from 'next/server';

const PORTAL_PWA_ICON_URL =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1782579834/WhatsApp_Image_2026-06-27_at_11.03.20_AM_tzq2rn.jpg';

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
        src: PORTAL_PWA_ICON_URL,
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any maskable',
      },
      {
        src: PORTAL_PWA_ICON_URL,
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any maskable',
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
