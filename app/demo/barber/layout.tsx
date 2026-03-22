import { Plus_Jakarta_Sans } from 'next/font/google';
import type { Viewport } from 'next';
import DemoBarberPWAHead from './DemoBarberPWAHead';
import BarberShell from './BarberShell';

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
