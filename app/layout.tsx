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
  metadataBase: new URL('https://agentia.software'),
  title: 'Agentia | Chatbots con IA para Negocios — WhatsApp 24/7',
  description:
    'Automatiza tu negocio con IA. Chatbots para barberías, restaurantes, spas, dentistas y más. Agenda citas, cobra y fideliza clientes desde WhatsApp sin esfuerzo.',
  keywords:
    'chatbot IA, automatización WhatsApp, chatbot para barbería, chatbot para restaurante, agente IA negocio, chatbot México, automatización negocios México, WhatsApp bot, CRM con IA',
  authors: [{ name: 'Agentia' }],
  creator: 'Agentia',
  publisher: 'Agentia',
  alternates: {
    canonical: 'https://agentia.software',
  },
  openGraph: {
    title: 'Agentia | Tu negocio automatizado en WhatsApp',
    description:
      'Chatbots con IA que agendan, cobran y fidelizan clientes 24/7. Para barberías, restaurantes, spas, dentistas y más.',
    url: 'https://agentia.software',
    siteName: 'Agentia',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Agentia — Chatbots con IA para negocios',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentia | Chatbots con IA para Negocios',
    description: 'Automatiza tu WhatsApp con IA. Agenda, cobra y fideliza sin esfuerzo.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
