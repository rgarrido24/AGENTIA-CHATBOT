import type { Metadata } from 'next';
import GroomingShell from './GroomingShell';

export const metadata: Metadata = {
  title: 'Chatbot IA para Grooming Canino | Agentia',
  description: 'Demo funcional: fichas por mascota, agenda, domicilio con seguimiento y recordatorios inteligentes. IA para grooming y veterinarias.',
  alternates: { canonical: 'https://agentia.software/demo/grooming' },
  openGraph: {
    title: 'Chatbot IA para Grooming Canino | Agentia',
    description: 'Fichas de mascotas, agenda y servicio a domicilio con WhatsApp e IA. Pruébalo en vivo.',
    url: 'https://agentia.software/demo/grooming',
  },
};

export default function GroomingLayout({ children }: { children: React.ReactNode }) {
  return <GroomingShell>{children}</GroomingShell>;
}
