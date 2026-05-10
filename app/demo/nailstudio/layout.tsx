import { Plus_Jakarta_Sans } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import DemoBarberPWAHead from '../barber/DemoBarberPWAHead';
import BarberShell from '../barber/BarberShell';

export const metadata: Metadata = {
  title: 'Chatbot IA para Nail Studios | Agentia',
  description:
    'Demo funcional para salones de uñas: agenda automática, recordatorios y CRM con IA desde WhatsApp. Ideal para nail studios y manicuristas.',
  alternates: { canonical: 'https://agentia.software/demo/nailstudio' },
  openGraph: {
    title: 'Chatbot IA para Nail Studios | Agentia',
    description: 'Agenda, recordatorios y CRM para tu nail studio. Pruébalo en vivo.',
    url: 'https://agentia.software/demo/nailstudio',
  },
};

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-demo',
});

export const viewport: Viewport = {
  themeColor: '#fff0f7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function DemoNailStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={plusJakarta.className}>
      <DemoBarberPWAHead />
      <BarberShell forceGiro="nail">{children}</BarberShell>
    </div>
  );
}
