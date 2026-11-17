import type { Metadata, Viewport } from 'next';
import { Anton, Barlow } from 'next/font/google';
import '@/components/restaurante/restaurante.css';
import '@/components/restaurante/nuevo.css';
import '@/components/restaurante/arwings.css';

/** Anton y Barlow no son variables: llevan `weight` explícito. */
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton', display: 'swap' });
const barlow = Barlow({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-barlow', display: 'swap' });

export const metadata: Metadata = {
  title: 'ARWINGS | Alitas, boneless y más. El sabor tiene alas',
  description: 'Pide alitas, boneless, hamburguesas y snacks de Arwings a domicilio o para llevar. Acumula saldo en cada pedido.',
  manifest: '/arwings/manifest.webmanifest',
  icons: { icon: '/arwings/icon-192.png', apple: '/arwings/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Arwings', statusBarStyle: 'black-translucent' },
  openGraph: {
    title: 'ARWINGS · El sabor tiene alas',
    description: 'Alitas, boneless, hamburguesas y snacks. Pide a domicilio.',
    images: [{ url: '/arwings/logo.jpg', width: 764, height: 701 }],
    locale: 'es_MX',
    type: 'website',
  },
};

export const viewport: Viewport = { themeColor: '#080808', width: 'device-width', initialScale: 1 };

export default function ArwingsLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${anton.variable} ${barlow.variable}`}>{children}</div>;
}
