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
  metadataBase: new URL('https://agentia-chatbot-ventas.onrender.com'),
  title: 'Agentia | Automatización con IA para Negocios — Chatbots, CRM y Cobranza',
  description:
    'Automatiza tu negocio con chatbots inteligentes, CRM integrado y cobranza automatizada. Demos en vivo de barbería, cobranza educativa e inmobiliaria. Desarrollado en México para empresas que quieren crecer sin aumentar su equipo.',
  keywords: [
    'chatbot con inteligencia artificial México',
    'automatización de cobranza',
    'CRM para pequeñas empresas México',
    'chatbot para negocios',
    'sistema de cobranza automatizado',
    'software cobranza colegiaturas',
    'chatbot WhatsApp empresas',
    'automatización para escuelas',
    'agencia automatización México',
    'inteligencia artificial para negocios Mérida',
    'chatbot reservas barbería',
    'portal inmobiliario con IA',
  ],
  openGraph: {
    title: 'Agentia | Automatización Inteligente para tu Negocio',
    description: 'Chatbots con IA, CRM y cobranza automatizada. Demos en vivo disponibles.',
    url: 'https://agentia-chatbot-ventas.onrender.com',
    siteName: 'Agentia',
    locale: 'es_MX',
    type: 'website',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://agentia-chatbot-ventas.onrender.com' },
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
