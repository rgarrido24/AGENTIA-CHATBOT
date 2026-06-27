import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

const TITLE = 'La Rueda Veladoras | Aromas, ceras y velas artesanales - CDMX';
const DESCRIPTION =
  'Insumos para velas artesanales en México. 128 aromas, ceras de soya, coco y abeja, colorantes y parafinas. Envíos a toda la República. Iztacalco, CDMX.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://agentia.software/biovela',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://agentia.software/biovela',
    siteName: 'La Rueda Veladoras',
    locale: 'es_MX',
    type: 'website',
    images: [
      {
        url: '/logos/biovela.png',
        width: 512,
        height: 512,
        alt: 'La Rueda Veladoras — Biovela',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/logos/biovela.png'],
  },
  robots: { index: true, follow: true },
};

export default function BiovelaLayout({ children }: { children: React.ReactNode }) {
  return <div className={inter.className}>{children}</div>;
}
