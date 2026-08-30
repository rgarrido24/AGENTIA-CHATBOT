import type { Metadata } from 'next';
import { Arimo, Azeret_Mono } from 'next/font/google';
import { PaycesaPresentation } from './PaycesaPresentation';

const arimo = Arimo({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-paycesa-arimo',
  display: 'swap',
});

const azeret = Azeret_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-paycesa-azeret',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Propuesta estratégica — La Rueda Veladoras | Agentia',
  description: 'Estrategia de crecimiento digital y automatización con Agentia AI.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Propuesta estratégica — La Rueda Veladoras',
    description: 'Evolución digital con Agentia AI.',
    type: 'website',
    url: 'https://agentia.software/paycesa',
  },
};

export default function PaycesaPage() {
  return (
    <div className={`${arimo.variable} ${azeret.variable} min-h-dvh`}>
      <PaycesaPresentation />
    </div>
  );
}
