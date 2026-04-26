import type { Metadata } from 'next';
import SpaShell from './SpaShell';

export const metadata: Metadata = {
  title: 'Chatbot IA para Spa y Estéticas | Agentia',
  description: 'Demo funcional: agenda semanal, clientes VIP, servicios y recordatorios inteligentes para spa y estéticas. Automatiza con WhatsApp e IA.',
  alternates: { canonical: 'https://agentia.software/demo/spa' },
  openGraph: {
    title: 'Chatbot IA para Spa y Estéticas | Agentia',
    description: 'Agenda, KPIs y chat IA para tu spa o estética. Pruébalo en vivo.',
    url: 'https://agentia.software/demo/spa',
  },
};

export default function SpaLayout({ children }: { children: React.ReactNode }) {
  return <SpaShell>{children}</SpaShell>;
}
