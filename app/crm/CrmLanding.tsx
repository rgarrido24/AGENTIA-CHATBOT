'use client';

import { ProductLanding, type ProductLandingConfig } from '@/components/shared/ProductLanding';
import type { ROIResultLine } from '@/components/shared/ROICalculator';

function calculate(v: Record<string, number>): ROIResultLine[] {
  const clientesActuales = v.leads * (v.conversionActual / 100);
  const clientesNuevos = clientesActuales * (v.mejora / 100);
  const ingresoAdicional = clientesNuevos * v.ticket;
  return [
    { label: 'Clientes que cierras hoy', value: Math.round(clientesActuales).toString() },
    { label: 'Clientes adicionales con CRM', value: `+${Math.round(clientesNuevos)}` },
    {
      label: 'Ingreso adicional / mes',
      value: `$${Math.round(ingresoAdicional).toLocaleString('es-MX')} MXN`,
      highlight: true,
    },
  ];
}

const CONFIG: ProductLandingConfig = {
  slug: 'crm',
  analytics: 'landing-crm',
  waLabel: 'CRM de Ventas',
  eyebrow: 'CRM para equipos de ventas',
  headline: 'Cada lead con su asesora, sin que se te pierda ni uno',
  lead: 'Un CRM pensado para agencias y equipos de venta con varios asesores: distribución automática de leads, notificaciones push y conexión directa con tus campañas de Facebook Ads.',
  badge: 'Partner oficial Meta. Integración Facebook Ads',
  featuredCase: {
    title: 'Luciano Ads',
    stats: [
      { value: '26', label: 'asesoras activas con su propio panel', color: '#00D4FF' },
      { value: '2,000+', label: 'leads procesados por mes', color: '#00D4FF' },
      { value: '0', label: 'captura manual de formularios', color: '#FFD700' },
    ],
  },
  differentiatorsTitle: 'Un CRM hecho para equipos reales',
  differentiators: [
    {
      titulo: 'App PWA con notificaciones push',
      texto:
        'Cada asesora recibe el lead en el celular al instante, sin instalar nada desde una tienda de apps.',
    },
    {
      titulo: 'Conexión directa a Facebook Ads',
      texto:
        'Los formularios de Meta llegan al CRM vía Zapier, sin captura manual ni hojas de cálculo.',
    },
    {
      titulo: 'Paneles individuales por vendedora',
      texto:
        'Cada asesora ve solo sus leads y su seguimiento, sin mezclar información entre equipos.',
    },
  ],
  roiTitle: '¿Cuánto vale organizar tu seguimiento?',
  roiFields: [
    { key: 'leads', label: 'Leads que generas al mes', defaultValue: 300, min: 20, max: 5000, step: 20 },
    { key: 'conversionActual', label: 'Tasa de conversión actual', defaultValue: 8, min: 1, max: 50, suffix: '%' },
    {
      key: 'mejora',
      label: 'Mejora esperada con seguimiento organizado',
      defaultValue: 30,
      min: 5,
      max: 100,
      suffix: '%',
    },
    {
      key: 'ticket',
      label: 'Valor promedio por cliente cerrado',
      defaultValue: 1500,
      min: 100,
      max: 20000,
      step: 100,
      suffix: 'MXN',
    },
  ],
  calculateRoi: calculate,
};

export default function CrmLanding() {
  return <ProductLanding config={CONFIG} />;
}
