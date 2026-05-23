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
  title: 'Internet en casa desde $100 | Izzi Mérida',
  description:
    'Promoción Izzi en Mérida, Yucatán. Primer mes $100 con 100 megas. Instalación incluida. Solo zonas con cobertura.',
  alternates: { canonical: 'https://agentia.software/izzi/merida' },
  openGraph: {
    title: 'Internet en casa desde $100 — Izzi Mérida',
    description: 'Tu primer mes. Solo en Mérida. Oferta activa.',
    url: 'https://agentia.software/izzi/merida',
    locale: 'es_MX',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function IzziMeridaLayout({ children }: { children: React.ReactNode }) {
  return <div className={dmSans.className}>{children}</div>;
}
