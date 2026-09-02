import type { Metadata } from 'next';
import EcommerceLanding from './EcommerceLanding';

export const metadata: Metadata = {
  title: 'Tienda online con chatbot WhatsApp | Agentia',
  description:
    'Catálogo, checkout con tarjeta y chatbot con IA en un mismo lugar. Clip, Stripe, Mercado Pago y envíos integrados.',
  alternates: { canonical: 'https://agentia.software/ecommerce' },
  openGraph: {
    title: 'Tienda online con chatbot WhatsApp | Agentia',
    description: 'Vende en línea con una tienda que también contesta WhatsApp.',
    url: 'https://agentia.software/ecommerce',
    siteName: 'Agentia',
    locale: 'es_MX',
    type: 'website',
  },
};

export default function Page() {
  return <EcommerceLanding />;
}
