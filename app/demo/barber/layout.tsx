import { Plus_Jakarta_Sans } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import DemoBarberPWAHead from './DemoBarberPWAHead';
import BarberShell from './BarberShell';

export const metadata: Metadata = {
  title: 'Chatbot IA para Barberías | Agentia',
  description: 'Demo funcional: agenda citas, detecta conflictos de horario y fideliza clientes desde WhatsApp con IA. Ideal para barberías y estéticas.',
  alternates: { canonical: 'https://agentia.software/demo/barber' },
  openGraph: {
    title: 'Chatbot IA para Barberías | Agentia',
    description: 'Agenda automática, recordatorios y CRM para tu barbería. Pruébalo en vivo.',
    url: 'https://agentia.software/demo/barber',
  },
};

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-demo',
});

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function DemoBarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={plusJakarta.className}>
      <DemoBarberPWAHead />
      <BarberShell>{children}</BarberShell>
    </div>
  );
}
