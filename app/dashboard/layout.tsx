import Layout from '@/components/Layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout brand={{ logoUrl: '/logo-agentia-2026.png', name: 'Agentia', logoOnly: true }}>

      {children}
    </Layout>
  );
}
