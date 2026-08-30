import type { Metadata } from 'next';

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
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
