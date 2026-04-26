import type { Metadata } from 'next';
import DentistaShell from './DentistaShell';

export const metadata: Metadata = {
  title: 'Chatbot IA para Clínicas Dentales | Agentia',
  description: 'Demo funcional: expediente con odontograma, recetas PDF con QR, agenda por dentista y alertas de alergia. IA para clínicas dentales.',
  alternates: { canonical: 'https://agentia.software/demo/dentista' },
  openGraph: {
    title: 'Chatbot IA para Clínicas Dentales | Agentia',
    description: 'Expediente digital, recetas PDF y agenda inteligente para tu clínica dental. Pruébalo en vivo.',
    url: 'https://agentia.software/demo/dentista',
  },
};

export default function DentistaLayout({ children }: { children: React.ReactNode }) {
  return <DentistaShell>{children}</DentistaShell>;
}
