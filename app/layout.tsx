import type { Metadata } from 'next';
import { Montserrat, Roboto, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-montserrat',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'Agentia - CRM & Chatbot',
  description: 'Automatización inteligente para ventas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${jakarta.variable} ${montserrat.variable} ${roboto.variable}`}>
      <body className="min-h-screen antialiased font-sans bg-luxury text-white">
        {children}
      </body>
    </html>
  );
}
