import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

/** Ruta estática; evita superficie innecesaria de Server Actions en esta landing. */
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: '120 Mbps — 1er mes $100 | Izzi Mérida',
  description:
    'Internet Residencial 120 Mbps en Mérida. 1er mes $100, mes 2-3 $429, después $480. Instalación sin costo. Contrata por WhatsApp.',
  alternates: { canonical: 'https://agentia.software/izzi/merida' },
  openGraph: {
    title: '120 Mbps — Promo Izzi Mérida',
    description: '1er mes $100 · instalación sin costo. Velocímetro a 120 Mbps.',
    url: 'https://agentia.software/izzi/merida',
    locale: 'es_MX',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function IzziMeridaLayout({ children }: { children: React.ReactNode }) {
  return <div className={dmSans.className}>{children}</div>;
}
