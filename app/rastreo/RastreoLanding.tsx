'use client';

import { ProductLanding, type ProductLandingConfig } from '@/components/shared/ProductLanding';
import type { ROIResultLine } from '@/components/shared/ROICalculator';

function calculate(v: Record<string, number>): ROIResultLine[] {
  const horasMes = v.personas * 8 * 22;
  const horasPerdidasMes = horasMes * (v.horasPerdidas / 100);
  const costoMensual = horasPerdidasMes * v.costoHora;
  return [
    { label: 'Horas-persona trabajadas / mes', value: Math.round(horasMes).toString() },
    { label: 'Horas perdidas sin supervisión', value: Math.round(horasPerdidasMes).toString() },
    {
      label: 'Costo mensual estimado',
      value: `$${Math.round(costoMensual).toLocaleString('es-MX')} MXN`,
      highlight: true,
    },
  ];
}

const CONFIG: ProductLandingConfig = {
  slug: 'rastreo',
  analytics: 'landing-rastreo',
  waLabel: 'Rastreo de Campo',
  eyebrow: 'Rastreo GPS para equipos de campo',
  headline: 'Sabe exactamente dónde estuvo tu equipo hoy, sin llamarles uno por uno',
  lead: 'App de rastreo GPS para volanteo, cambaceo o rutas de venta en campo, con panel web para supervisores y mapa de calor de zonas cubiertas.',
  featuredCase: {
    title: 'Volanteo Tracker',
    body: 'App en Flutter para Android con GPS en segundo plano, usada por equipos de volanteo en varias plazas del país, con panel de mapa en tiempo real para supervisión.',
    stats: [
      { value: '8+', label: 'personas en campo por plaza', color: '#00D4FF' },
      { value: 'Flutter', label: 'app Android nativa', color: '#00D4FF' },
      { value: '1', label: 'panel para todas las plazas', color: '#FFD700' },
    ],
  },
  differentiatorsTitle: 'Supervisión real, no reportes de palabra',
  differentiators: [
    {
      titulo: 'Mapa de calor de zonas cubiertas',
      texto: 'Ve de un vistazo qué colonias ya se volantearon esta semana y cuáles faltan.',
    },
    {
      titulo: 'Panel web para supervisores',
      texto: 'Seguimiento en tiempo real de cada equipo desde una computadora, sin instalar nada.',
    },
    {
      titulo: 'App Android nativa',
      texto: 'Rastreo GPS en segundo plano, pensado para jornadas largas de campo sin drenar la batería.',
    },
  ],
  roiTitle: '¿Cuánto te cuesta no saber dónde está tu equipo?',
  roiFields: [
    { key: 'personas', label: 'Personas en campo', defaultValue: 8, min: 1, max: 100, step: 1 },
    { key: 'horasPerdidas', label: '% de horas perdidas sin supervisión', defaultValue: 20, min: 0, max: 60, suffix: '%' },
    {
      key: 'costoHora',
      label: 'Costo por hora por persona',
      defaultValue: 45,
      min: 20,
      max: 300,
      step: 5,
      suffix: 'MXN',
    },
  ],
  calculateRoi: calculate,
};

export default function RastreoLanding() {
  return <ProductLanding config={CONFIG} />;
}
