import Layout from '@/components/Layout';
import DashboardAuthGuard from './DashboardAuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <Layout brand={{ logoUrl: '/logo-agentia-2026.png', name: 'Agentia', logoOnly: true }}>
        {children}
      </Layout>
    </DashboardAuthGuard>
  );
}
