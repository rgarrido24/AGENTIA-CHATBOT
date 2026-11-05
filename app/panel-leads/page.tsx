import type { Metadata } from 'next';
import PanelLeadsContent from './panel-leads-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Panel de Leads para Agencias | Agentia',
  description:
    '+15,000 leads gestionados. CRM con marca blanca para agencias de Facebook Ads — entrega leads en tiempo real a tus clientes, con notificaciones push y seguimiento de ventas.',
  keywords: [
    'panel de leads Facebook Ads',
    'CRM para agencias de marketing',
    'enviar leads a clientes',
    'notificaciones de leads por WhatsApp',
    'CRM para traffickers',
    'leads Facebook Ads México',
    'panel marca blanca agencia',
  ],
  openGraph: {
    title: 'Panel de Leads para Agencias | Agentia',
    description:
      '+15,000 leads gestionados. 52 negocios activos. Entrega leads de Facebook Ads a tus clientes en tiempo real.',
    images: [{ url: '/og-agentia.jpg', width: 1200, height: 630 }],
    type: 'website',
    url: 'https://agentia.software/panel-leads',
  },
  alternates: {
    canonical: 'https://agentia.software/panel-leads',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Panel de Leads Agentia',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      description:
        'CRM de leads para agencias y traffickers de Facebook Ads. Panel con marca blanca, notificaciones push, seguimiento de ventas y bandeja de WhatsApp. +15,000 leads gestionados.',
      offers: { '@type': 'Offer', price: '12', priceCurrency: 'USD' },
      url: 'https://agentia.software/panel-leads',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Mis clientes saben que usan Agentia?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. El panel lleva tu marca — tu logo, tu nombre. Para tu cliente, tú eres el proveedor. Agentia es la infraestructura invisible.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo conecta con Facebook Ads?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Integración nativa con Meta Lead Ads. En menos de 5 minutos enlazas la página de Facebook del cliente. Sin Zapier, sin webhooks, sin código.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cuánto tarda el primer panel?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Entre 24 y 48 horas desde que confirmas. Recibes el acceso al panel maestro y una guía paso a paso. No instalas nada.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Funciona en iPhone sin App Store?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sí. Es una PWA. Se instala desde Safari o Chrome en dos taps. Aparece en la pantalla de inicio y recibe notificaciones push como una app nativa.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué pasa si un cliente cancela?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Solo pagas paneles activos ese mes. Sin penalizaciones, sin contratos anuales.',
          },
        },
      ],
    },
  ],
};

export default function PanelLeadsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PanelLeadsContent />
    </>
  );
}
