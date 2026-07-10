import type { Metadata } from 'next';
import { AgentiaChatWidget } from '@/components/AgentiaChatWidget';
import { resolveAgentiaWhatsAppDigits } from '@/lib/agentia-contact';
import { ReadyLanding } from './ReadyLanding';

export const metadata: Metadata = {
  title: 'Agentia — Listo para automatizar tu WhatsApp',
  description:
    'Deja de ser el esclavo de tu WhatsApp. Agentia: chatbots con IA para negocios. Demo en vivo por WhatsApp.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Agentia — Deja de ser el esclavo de tu WhatsApp',
    description: 'Lanzamiento Agentia. Demo en vivo por WhatsApp.',
    url: 'https://agentia.software/ready',
    type: 'website',
    locale: 'es_MX',
  },
};

function resolveWhatsAppDigits(): string {
  const raw =
    process.env.NEXT_PUBLIC_READY_WHATSAPP_NUMBER ||
    process.env.RODOLFO_WHATSAPP ||
    '';
  return resolveAgentiaWhatsAppDigits(raw);
}

export default function ReadyPage() {
  const whatsappDigits = resolveWhatsAppDigits();
  return (
    <>
      <ReadyLanding whatsappDigits={whatsappDigits} />
      <AgentiaChatWidget />
    </>
  );
}
