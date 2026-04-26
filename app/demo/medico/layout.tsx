import type { Metadata } from 'next';
import MedicoShell from './MedicoShell';

export const metadata: Metadata = {
  title: 'Chatbot IA para Médicos y Especialistas | Agentia',
  description: 'Demo funcional: expediente digital, agenda por especialidad, signos vitales, recetas con QR e incapacidades. IA para consultorios médicos.',
  alternates: { canonical: 'https://agentia.software/demo/medico' },
  openGraph: {
    title: 'Chatbot IA para Médicos y Especialistas | Agentia',
    description: 'Expediente clínico, agenda y recetas verificables por WhatsApp. Pruébalo en vivo.',
    url: 'https://agentia.software/demo/medico',
  },
};

export default function MedicoLayout({ children }: { children: React.ReactNode }) {
  return <MedicoShell>{children}</MedicoShell>;
}
