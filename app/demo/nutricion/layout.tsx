import type { Metadata } from 'next';
import NutriShell from './NutriShell';

export const metadata: Metadata = {
  title: 'Chatbot IA para Nutrición y Bienestar | Agentia',
  description: 'Demo funcional: tablero de progreso, OCR InBody, chatbot dietético y recordatorios motivacionales. IA para nutriólogos.',
  alternates: { canonical: 'https://agentia.software/demo/nutricion' },
  openGraph: {
    title: 'Chatbot IA para Nutrición y Bienestar | Agentia',
    description: 'Seguimiento nutricional, IA dietética y recordatorios por WhatsApp. Pruébalo en vivo.',
    url: 'https://agentia.software/demo/nutricion',
  },
};

export default function NutricionLayout({ children }: { children: React.ReactNode }) {
  return <NutriShell>{children}</NutriShell>;
}
