import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

/** App para clientes: menú, pedir desde la mesa y tarjeta de lealtad. */
export function GET() {
  return NextResponse.json(
    {
      id: '/tostichelas',
      name: 'Tostichelas',
      short_name: 'Tostichelas',
      description: 'Menú, pedidos y tarjeta de lealtad de Tostichelas.',
      start_url: '/tostichelas?src=pwa',
      scope: '/tostichelas',
      display: 'standalone',
      orientation: 'any',
      background_color: '#FBE3CB',
      theme_color: '#FBE3CB',
      icons: [
        { src: '/tostichelas/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/tostichelas/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/tostichelas/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
}
