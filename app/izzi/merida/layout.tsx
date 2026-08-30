import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { buildIzziMetadata } from '@/lib/izzi-metadata';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const dynamic = 'force-static';

export const metadata: Metadata = buildIzziMetadata({
  title: '120 Mbps — 1er mes $100 | Izzi Mérida',
  description:
    'Internet Residencial 120 Mbps en Mérida. 1er mes $100, mes 2-3 $429, después $480. Instalación sin costo. Contrata por WhatsApp.',
  path: '/izzi/merida',
});

export default function IzziMeridaLayout({ children }: { children: React.ReactNode }) {
  return <div className={dmSans.className}>{children}</div>;
}
