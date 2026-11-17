import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Tostichelas Equipo',
  robots: { index: false, follow: false },
  manifest: '/tostichelas/equipo/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Equipo', statusBarStyle: 'default' },
};

export const viewport: Viewport = { themeColor: '#241610', width: 'device-width', initialScale: 1 };

export default function EquipoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
