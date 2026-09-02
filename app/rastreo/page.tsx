import type { Metadata } from 'next';
import RastreoLanding from './RastreoLanding';

export const metadata: Metadata = {
  title: 'Rastreo GPS para equipos de campo | Agentia',
  description:
    'App de rastreo GPS para volanteo, cambaceo o rutas de venta, con panel web y mapa de calor de zonas cubiertas.',
  alternates: { canonical: 'https://agentia.software/rastreo' },
  openGraph: {
    title: 'Rastreo GPS para equipos de campo | Agentia',
    description: 'Sabe exactamente dónde estuvo tu equipo hoy, sin llamarles uno por uno.',
    url: 'https://agentia.software/rastreo',
    siteName: 'Agentia',
    locale: 'es_MX',
    type: 'website',
  },
};

export default function Page() {
  return <RastreoLanding />;
}
