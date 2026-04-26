import type { Metadata } from 'next';
import TallerShell from './TallerShell';

export const metadata: Metadata = {
  title: 'Chatbot IA para Talleres Mecánicos | Agentia',
  description: 'Demo funcional: órdenes tipo kanban, presupuestos PDF, inventario de refacciones, caja y recordatorios de mantenimiento. IA para talleres.',
  alternates: { canonical: 'https://agentia.software/demo/taller' },
  openGraph: {
    title: 'Chatbot IA para Talleres Mecánicos | Agentia',
    description: 'Órdenes, presupuestos PDF y recordatorios automáticos para tu taller. Pruébalo en vivo.',
    url: 'https://agentia.software/demo/taller',
  },
};

export default function TallerLayout({ children }: { children: React.ReactNode }) {
  return <TallerShell>{children}</TallerShell>;
}
