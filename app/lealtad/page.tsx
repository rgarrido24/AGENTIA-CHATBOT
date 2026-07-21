import type { Metadata } from 'next';
import { LealtadLanding } from './LealtadLanding';

export const metadata: Metadata = {
  title: 'Tarjeta de lealtad digital | Agentia',
  description:
    'Fideliza clientes con sellos digitales, Google Wallet y WhatsApp automático cuando alguien deja de visitar. Desde $299 MXN/mes.',
  alternates: { canonical: 'https://agentia.software/lealtad' },
  openGraph: {
    title: 'Tarjeta de lealtad digital — Agentia',
    description:
      'Tu cliente acumula sellos sin app. Tú recuperas a los que se enfrían por WhatsApp oficial.',
    url: 'https://agentia.software/lealtad',
    siteName: 'Agentia',
    locale: 'es_MX',
    type: 'website',
  },
};

export default function LealtadPage() {
  return <LealtadLanding />;
}
