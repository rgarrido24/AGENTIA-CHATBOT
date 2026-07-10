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
  title: '100 Mbps $120/mes × 6 meses | Izzi Mérida',
  description:
    'Internet Residencial 100 Mbps en Mérida. Promo $120/mes por 6 meses. Instalación sin costo. Contrata por WhatsApp.',
  alternates: { canonical: 'https://agentia.software/izzi/merida' },
  openGraph: {
    title: '100 Mbps — Promo Izzi Mérida',
    description: '$120/mes por 6 meses. Velocímetro a 100 Mbps. Contrata ahora.',
    url: 'https://agentia.software/izzi/merida',
    locale: 'es_MX',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function IzziMeridaLayout({ children }: { children: React.ReactNode }) {
  return <div className={dmSans.className}>{children}</div>;
}
