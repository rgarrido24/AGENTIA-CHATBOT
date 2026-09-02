'use client';

import { ProductLanding, type ProductLandingConfig } from '@/components/shared/ProductLanding';
import type { ROIResultLine } from '@/components/shared/ROICalculator';

function calculate(v: Record<string, number>): ROIResultLine[] {
  const ventasActuales = v.visitas * (v.conversionActual / 100);
  const ventasAdicionales = ventasActuales * (v.mejora / 100);
  const ingresoAdicional = ventasAdicionales * v.ticket;
  return [
    { label: 'Ventas actuales / mes', value: Math.round(ventasActuales).toString() },
    { label: 'Ventas adicionales con chatbot', value: `+${Math.round(ventasAdicionales)}` },
    {
      label: 'Ingreso adicional / mes',
      value: `$${Math.round(ingresoAdicional).toLocaleString('es-MX')} MXN`,
      highlight: true,
    },
  ];
}

const CONFIG: ProductLandingConfig = {
  slug: 'ecommerce',
  analytics: 'landing-ecommerce',
  waLabel: 'Tienda Online',
  eyebrow: 'Tienda online + pasarela de pago',
  headline: 'Vende en línea con una tienda que también contesta WhatsApp',
  lead: 'Catálogo, checkout con tarjeta y chatbot con IA en un mismo lugar. Tus clientes preguntan por WhatsApp y el bot ya sabe qué hay en existencia y a qué precio.',
  featuredCase: {
    title: 'Biovela (La Rueda Veladoras)',
    body: 'Empresa de veladoras en CDMX. Catálogo de 192 productos migrado a Tiendanube, cobro con Clip y envíos con WeShip, todo conectado al chatbot de WhatsApp del negocio.',
    stats: [
      { value: '192', label: 'productos en catálogo', color: '#00D4FF' },
      { value: 'Tiendanube', label: 'Clip + WeShip', color: '#00D4FF' },
      { value: '1', label: 'chatbot para todo', color: '#FFD700' },
    ],
  },
  differentiatorsTitle: 'Tienda y chatbot, no dos sistemas separados',
  differentiators: [
    {
      titulo: 'Chatbot integrado a la tienda',
      texto:
        'El mismo bot que contesta WhatsApp conoce tu catálogo y precios en tiempo real, sin catálogos separados.',
    },
    {
      titulo: 'Pasarelas de pago listas',
      texto:
        'Clip, Stripe y Mercado Pago conectados desde el día uno, sin trámites bancarios adicionales.',
    },
    {
      titulo: 'Envíos integrados',
      texto: 'Cotización y guías de paquetería conectadas directo al checkout.',
    },
  ],
  roiTitle: '¿Cuánto puedes vender con chatbot integrado?',
  roiFields: [
    { key: 'visitas', label: 'Visitas mensuales a tu tienda', defaultValue: 1500, min: 100, max: 50000, step: 100 },
    {
      key: 'conversionActual',
      label: 'Conversión actual sin chatbot',
      defaultValue: 1.5,
      min: 0.2,
      max: 10,
      step: 0.1,
      suffix: '%',
    },
    {
      key: 'mejora',
      label: 'Mejora esperada con chatbot integrado',
      defaultValue: 40,
      min: 5,
      max: 150,
      suffix: '%',
    },
    { key: 'ticket', label: 'Ticket promedio', defaultValue: 450, min: 50, max: 5000, step: 50, suffix: 'MXN' },
  ],
  calculateRoi: calculate,
};

export default function EcommerceLanding() {
  return <ProductLanding config={CONFIG} />;
}
