import type { Metadata } from 'next';
import ChatbotLanding from './ChatbotLanding';

export const metadata: Metadata = {
  title: 'Chatbot WhatsApp con IA | Agentia',
  description:
    'Chatbot con IA que entiende tu catálogo, cotiza, agenda y solo te avisa cuando tiene que intervenir una persona. Partner oficial Meta. WhatsApp Cloud API.',
  alternates: { canonical: 'https://agentia.software/chatbot' },
  openGraph: {
    title: 'Chatbot WhatsApp con IA | Agentia',
    description:
      'Contesta a tus clientes las 24 horas sin contratar a nadie más. Panel CRM incluido.',
    url: 'https://agentia.software/chatbot',
    siteName: 'Agentia',
    locale: 'es_MX',
    type: 'website',
  },
};

export default function Page() {
  return <ChatbotLanding />;
}
