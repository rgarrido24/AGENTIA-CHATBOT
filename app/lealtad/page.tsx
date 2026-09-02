import type { Metadata } from 'next';
import { LealtadLanding } from './LealtadLanding';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const schemaLealtad = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Agentia Lealtad',
  description:
    'Programa de recompra para negocios locales. Google Wallet, alertas de quién se está yendo y panel de clientes. $399 MXN/mes.',
  url: 'https://agentia.software/lealtad',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    name: 'Plan base',
    price: '399',
    priceCurrency: 'MXN',
    description: '1 sucursal. +$150 MXN/mes por sucursal adicional.',
  },
};

export const metadata: Metadata = {
  title: 'Haz que tus clientes regresen | Agentia',
  description:
    'Sistema para negocios locales que aumenta la recompra. Plan base $399 MXN/mes. Se paga solo si vuelven unos cuantos.',
  keywords: [
    'clientes frecuentes',
    'programa de recompensas',
    'recuperar clientes',
    'aumentar ventas negocio local',
    'recompra',
    'fidelización',
    'Agentia',
  ],
  alternates: { canonical: 'https://agentia.software/lealtad' },
  openGraph: {
    title: 'Haz que tus clientes regresen una y otra vez — Agentia',
    description:
      'Convierte visitas ocasionales en clientes frecuentes. Te avisa quién se está yendo — tú mandas el WhatsApp en un toque. Simula cuánto podrías ganar.',
    url: 'https://agentia.software/lealtad',
    siteName: 'Agentia',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Haz que tus clientes regresen | Agentia',
    description:
      'Más recompra, menos gasto en publicidad. Tú decides a quién recuperar, el mensaje ya está listo.',
  },
};

export default function LealtadPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaLealtad) }}
      />
      <LealtadLanding />
    </>
  );
}
