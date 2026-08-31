import type { Metadata } from 'next';
import { LealtadLanding } from './LealtadLanding';

export const metadata: Metadata = {
  title: 'Haz que tus clientes regresen | Agentia',
  description:
    'Sistema para negocios locales que aumenta la recompra: clientes frecuentes, recuperación de inactivos y marketing automático. $499 MXN/mes. Se paga solo si vuelven unos cuantos.',
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
      'Convierte visitas ocasionales en clientes frecuentes. WhatsApp automático cuando alguien se enfría. Simula cuánto podrías ganar.',
    url: 'https://agentia.software/lealtad',
    siteName: 'Agentia',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Haz que tus clientes regresen | Agentia',
    description:
      'Más recompra, menos gasto en publicidad. El sistema recupera inactivos por ti.',
  },
};

export default function LealtadPage() {
  return <LealtadLanding />;
}
