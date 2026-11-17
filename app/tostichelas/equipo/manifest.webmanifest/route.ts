import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

/** App del equipo: mesero, cocina, barra, caja y dueño (cada perfil con su contraseña). */
export function GET() {
  return NextResponse.json(
    {
      id: '/tostichelas/equipo',
      name: 'Tostichelas Equipo',
      short_name: 'Equipo',
      description: 'Mesero, cocina, barra, caja y dueño de Tostichelas.',
      start_url: '/tostichelas/equipo?src=pwa',
      scope: '/tostichelas/equipo',
      display: 'standalone',
      orientation: 'any',
      background_color: '#FBE3CB',
      theme_color: '#241610',
      icons: [
        { src: '/tostichelas/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/tostichelas/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/tostichelas/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
}
