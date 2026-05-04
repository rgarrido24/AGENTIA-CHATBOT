import type { Metadata } from 'next';
import DemoEstrategiaClient from './ui/DemoEstrategiaClient';

export const metadata: Metadata = {
  title: 'Agentia x María Sol Gómez — Brief de Estrategia',
  description:
    'Herramienta de captación: brief por pasos para campañas y estrategia de performance.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Agentia x María Sol Gómez — Brief de Estrategia',
    description: 'Completa el brief por pasos y recibe una recomendación inicial.',
    url: 'https://agentia.software/demo-estrategia',
    type: 'website',
    locale: 'es_MX',
  },
};

function resolveWhatsAppDigits(): string {
  const raw =
    process.env.NEXT_PUBLIC_MARIA_SOL_WHATSAPP_DIGITS ||
    process.env.NEXT_PUBLIC_READY_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_WIDGET_WHATSAPP_DIGITS ||
    '';
  return String(raw).replace(/\D/g, '');
}

export default function DemoEstrategiaPage() {
  const whatsappDigits = resolveWhatsAppDigits();
  return <DemoEstrategiaClient whatsappDigits={whatsappDigits} />;
}

