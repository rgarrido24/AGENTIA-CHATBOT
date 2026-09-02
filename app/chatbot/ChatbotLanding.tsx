'use client';

import { ProductLanding, type ProductLandingConfig } from '@/components/shared/ProductLanding';
import type { ROIResultLine } from '@/components/shared/ROICalculator';

function calculate(v: Record<string, number>): ROIResultLine[] {
  const mensajesPerdidosMes = v.mensajes * 30 * (v.perdidos / 100);
  const ventasRecuperadas = mensajesPerdidosMes * 0.2;
  const ingresoPotencial = ventasRecuperadas * v.ticket;
  return [
    { label: 'Conversaciones perdidas al mes', value: Math.round(mensajesPerdidosMes).toString() },
    { label: 'Ventas que podrías recuperar', value: `~${Math.round(ventasRecuperadas)}` },
    {
      label: 'Ingreso potencial recuperado / mes',
      value: `$${Math.round(ingresoPotencial).toLocaleString('es-MX')} MXN`,
      highlight: true,
    },
  ];
}

const CONFIG: ProductLandingConfig = {
  slug: 'chatbot',
  analytics: 'landing-chatbot',
  waLabel: 'Chatbot WhatsApp',
  eyebrow: 'Chatbot WhatsApp con IA',
  headline: 'Contesta a tus clientes en WhatsApp las 24 horas, sin contratar a nadie más',
  lead: 'Un chatbot con IA que entiende tu catálogo, cotiza, agenda y solo te avisa cuando de verdad tiene que intervenir una persona. Con panel CRM para dar seguimiento a cada conversación.',
  badge: 'Partner oficial Meta. WhatsApp Cloud API',
  caseCards: [
    {
      nombre: 'CWF México',
      giro: 'Distribuidora de madera',
      detalle: 'Cotiza y contesta precios 24/7 con política WeShip integrada.',
    },
    {
      nombre: 'Deco House',
      giro: 'Vidrio y aluminio (Chile)',
      detalle: "Chatbot 'Elisa' atiende consultas técnicas de clientes.",
    },
    {
      nombre: 'Izzi (RGO)',
      giro: 'Telecomunicaciones',
      detalle: 'Primer cliente interno de Agentia: soporte y ventas.',
    },
    {
      nombre: 'Biovela',
      giro: 'Veladoras (CDMX)',
      detalle: 'Conecta catálogo, tienda y WhatsApp en un mismo flujo.',
    },
  ],
  differentiatorsTitle: 'Más allá de responder preguntas frecuentes',
  differentiators: [
    {
      titulo: 'OCR de documentos',
      texto:
        'El bot lee fotos de comprobantes, capturas o catálogos que el cliente envía y responde con base en lo que ve.',
    },
    {
      titulo: 'Toma de control humana',
      texto:
        'Cualquier agente puede pausar al bot y responder en persona desde el panel, sin que el cliente note la transición.',
    },
    {
      titulo: 'Cotizaciones en PDF',
      texto: 'Genera y envía cotizaciones formales por WhatsApp, listas para reenviar o imprimir.',
    },
  ],
  roiTitle: '¿Cuánto estás perdiendo por no contestar a tiempo?',
  roiFields: [
    { key: 'mensajes', label: 'Mensajes de WhatsApp por día', defaultValue: 40, min: 5, max: 300, step: 5 },
    { key: 'perdidos', label: '% que hoy se quedan sin respuesta', defaultValue: 30, min: 0, max: 90, suffix: '%' },
    { key: 'ticket', label: 'Ticket promedio por venta', defaultValue: 350, min: 50, max: 5000, step: 50, suffix: 'MXN' },
  ],
  calculateRoi: calculate,
  heroChat: {
    businessName: 'Agentia',
    messages: [
      { from: 'user', text: 'Hola, ¿tienen el producto X y a cómo está?' },
      { from: 'bot', text: 'Sí. Te cotizo en un momento. ¿Para cuántas piezas?' },
      { from: 'user', text: '12, para mañana si se puede' },
      { from: 'bot', text: 'Listo. Te mando la cotización en PDF y te agendo. ¿WhatsApp está bien?' },
    ],
  },
};

export default function ChatbotPage() {
  return <ProductLanding config={CONFIG} />;
}
