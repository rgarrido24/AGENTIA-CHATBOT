import AdminAuthGuard from '@/components/AdminAuthGuard';
import { DiagnosticBriefForm } from './DiagnosticBriefForm';

export const metadata = {
  title: 'Diagnóstico tecnológico · Agentia',
  robots: { index: false, follow: false },
};

export default function BriefDiagnosticPage() {
  return (
    <AdminAuthGuard fromPath="/brief">
      <DiagnosticBriefForm />
    </AdminAuthGuard>
  );
}
