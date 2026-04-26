import type { Metadata } from 'next';
import RestauranteShell from './RestauranteShell';

export const metadata: Metadata = {
  title: 'Chatbot IA para Restaurantes | Agentia',
  description: 'Demo funcional: menú QR, panel de cocina, delivery con CRM y chatbot en WhatsApp. Automatiza tu restaurante con IA.',
  alternates: { canonical: 'https://agentia.software/demo/restaurante' },
  openGraph: {
    title: 'Chatbot IA para Restaurantes | Agentia',
    description: 'Menú QR, pedidos, delivery y CRM para tu restaurante. Pruébalo en vivo.',
    url: 'https://agentia.software/demo/restaurante',
  },
};

export default function RestauranteLayout({ children }: { children: React.ReactNode }) {
  return <RestauranteShell>{children}</RestauranteShell>;
}
