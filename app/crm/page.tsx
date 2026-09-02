import type { Metadata } from 'next';
import CrmLanding from './CrmLanding';

export const metadata: Metadata = {
  title: 'CRM de ventas para equipos y agencias | Agentia',
  description:
    'CRM con distribución automática de leads, notificaciones push PWA y conexión a Facebook Ads. Hecho para agencias y equipos con varios asesores.',
  alternates: { canonical: 'https://agentia.software/crm' },
  openGraph: {
    title: 'CRM de ventas para equipos y agencias | Agentia',
    description: 'Cada lead con su asesora, sin que se te pierda ni uno. Push en el celular.',
    url: 'https://agentia.software/crm',
    siteName: 'Agentia',
    locale: 'es_MX',
    type: 'website',
  },
};

export default function Page() {
  return <CrmLanding />;
}
