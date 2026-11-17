import type { Metadata, Viewport } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import './tostichelas.css';

/** Fuentes variables: sin `weight` (bug del loader de next/font en Next 14). */
const baloo = Baloo_2({ subsets: ['latin'], variable: '--font-baloo', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });

export const metadata: Metadata = {
  title: 'Tostichelas | Restaurante digital',
  description: 'Menú, pedidos, cocina, barra, caja y lealtad para Tostichelas.',
  robots: { index: false, follow: false },
  manifest: '/tostichelas/manifest.webmanifest',
  icons: { icon: '/tostichelas/icon-192.png', apple: '/tostichelas/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Tostichelas', statusBarStyle: 'default' },
};

export const viewport: Viewport = { themeColor: '#FBE3CB', width: 'device-width', initialScale: 1 };

export default function TostichelasLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${baloo.variable} ${nunito.variable}`}>{children}</div>;
}
