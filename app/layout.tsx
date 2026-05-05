import type { Metadata } from 'next';
import { Montserrat, Roboto, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { GlobalWhatsAppAndExit } from '@/components/GlobalWhatsAppAndExit';

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
        url: '/og-agentia.jpg',
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
    images: ['/og-agentia.jpg'],
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

const schemaApp = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Agentia',
  description: 'Plataforma de chatbots con IA para automatizar negocios en WhatsApp',
  url: 'https://agentia.software',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: [
    { '@type': 'Offer', name: 'Starter',      price: '399', priceCurrency: 'MXN', billingPeriod: 'P1M' },
    { '@type': 'Offer', name: 'Profesional',  price: '599', priceCurrency: 'MXN', billingPeriod: 'P1M' },
    { '@type': 'Offer', name: 'Premium',      price: '899', priceCurrency: 'MXN', billingPeriod: 'P1M' },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '6',
  },
};

const schemaOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Agentia',
  url: 'https://agentia.software',
  logo: 'https://agentia.software/logo-agentia-2026.png',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+52-999-808-0265',
    contactType: 'sales',
    areaServed: 'MX',
    availableLanguage: 'Spanish',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Mérida',
    addressRegion: 'Yucatán',
    addressCountry: 'MX',
  },
  sameAs: [
    'https://www.instagram.com/agentia.software',
    'https://www.tiktok.com/@agentia.software',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${jakarta.variable} ${montserrat.variable} ${roboto.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaApp) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </head>
      <body className="min-h-screen antialiased font-sans bg-luxury text-white">
        {children}
        <GlobalWhatsAppAndExit />
      </body>
    </html>
  );
}
