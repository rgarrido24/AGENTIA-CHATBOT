'use client';

import { ProductLanding, type ProductLandingConfig } from '@/components/shared/ProductLanding';
import type { ROIResultLine } from '@/components/shared/ROICalculator';

function calculate(v: Record<string, number>): ROIResultLine[] {
  const leadsActuales = v.visitas * (v.conversionActual / 100);
  const leadsNuevos = v.visitas * (v.conversionNueva / 100);
  const leadsAdicionales = leadsNuevos - leadsActuales;
  return [
    { label: 'Leads actuales / mes', value: Math.round(leadsActuales).toString() },
    { label: 'Leads con landing + chatbot', value: Math.round(leadsNuevos).toString() },
    { label: 'Leads adicionales / mes', value: `+${Math.round(leadsAdicionales)}`, highlight: true },
  ];
}

const CONFIG: ProductLandingConfig = {
  slug: 'paginas-web',
  analytics: 'landing-paginas-web',
  waLabel: 'Páginas Web',
  eyebrow: 'Páginas web de alta conversión',
  headline: 'Una página que convierte visitas en clientes, no solo en visitas',
  lead: 'Landing pages construidas para vender: rápidas, con chatbot de WhatsApp incluido y conectadas a tus campañas de Meta Ads desde el primer día.',
  badge: 'Partner oficial Meta. Integración Ads',
  differentiatorsTitle: 'No es solo diseño, es un sistema de captura',
  differentiators: [
    {
      titulo: 'Chatbot incluido',
      texto:
        'Tu landing no es solo un folleto: el chatbot de WhatsApp contesta a quien no llena el formulario.',
    },
    {
      titulo: 'Integración con Meta Ads',
      texto:
        'Conectada directo a tus campañas de Facebook e Instagram, con pixel y formularios sincronizados.',
    },
    {
      titulo: 'Captura de leads automática',
      texto:
        'Cada visita que llena el formulario cae directo a tu CRM, sin hojas de cálculo de por medio.',
    },
  ],
  roiTitle: '¿Cuántos leads te está costando tu página actual?',
  roiFields: [
    {
      key: 'visitas',
      label: 'Visitas mensuales a tu página actual',
      defaultValue: 800,
      min: 50,
      max: 30000,
      step: 50,
    },
    { key: 'conversionActual', label: 'Conversión actual', defaultValue: 1, min: 0.1, max: 10, step: 0.1, suffix: '%' },
    {
      key: 'conversionNueva',
      label: 'Conversión con landing + chatbot',
      defaultValue: 4,
      min: 0.5,
      max: 20,
      step: 0.5,
      suffix: '%',
    },
  ],
  calculateRoi: calculate,
};

export default function PaginasWebLanding() {
  return <ProductLanding config={CONFIG} />;
}
