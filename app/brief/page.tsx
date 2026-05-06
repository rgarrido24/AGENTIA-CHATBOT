import { DiagnosticBriefForm } from './DiagnosticBriefForm';

export const metadata = {
  title: 'Diagnóstico tecnológico · Agentia',
  robots: { index: false, follow: false },
};

export default function BriefDiagnosticPage() {
  const salesWhatsapp =
    (process.env.ALERT_WHATSAPP_NUMBER ?? '').replace(/\D/g, '') || null;

  return <DiagnosticBriefForm salesWhatsapp={salesWhatsapp} />;
}
