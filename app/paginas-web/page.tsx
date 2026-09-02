import type { Metadata } from 'next';
import PaginasWebLanding from './PaginasWebLanding';

export const metadata: Metadata = {
  title: 'Páginas web de alta conversión | Agentia',
  description:
    'Landing pages con chatbot de WhatsApp incluido y conexión a Meta Ads. Cada visita que no llena el formulario igual puede convertirse.',
  alternates: { canonical: 'https://agentia.software/paginas-web' },
  openGraph: {
    title: 'Páginas web de alta conversión | Agentia',
    description: 'Una página que convierte visitas en clientes, no solo en visitas.',
    url: 'https://agentia.software/paginas-web',
    siteName: 'Agentia',
    locale: 'es_MX',
    type: 'website',
  },
};

export default function Page() {
  return <PaginasWebLanding />;
}
