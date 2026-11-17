import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Arwings Equipo',
  robots: { index: false, follow: false },
  manifest: '/arwings/equipo/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Equipo', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = { themeColor: '#080808', width: 'device-width', initialScale: 1 };

export default function EquipoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
