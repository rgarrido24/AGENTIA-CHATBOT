import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { LoyaltyShell } from '@/components/loyalty/LoyaltyShell';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';

export const dynamic = 'force-dynamic';

type Props = {
  children: ReactNode;
  params: { negocio: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tenant = await getLoyaltyTenant(params.negocio);
  return {
    title: tenant
      ? `${tenant.nombre} · Caja de lealtad${tenant.isDemo ? ' (demo)' : ''}`
      : 'Lealtad',
    description: tenant
      ? `Registro de ventas y puntos — ${tenant.nombre}`
      : 'Lealtad',
    robots: { index: false, follow: false },
  };
}

export default async function DemoNegocioLayout({ children, params }: Props) {
  const tenant = await getLoyaltyTenant(params.negocio);
  if (!tenant) notFound();

  const demoTenant = {
    ...tenant,
    basePath: `/demo/${params.negocio}`,
  };

  // El guard vive en cada sección (caja/buscar/clientes) para que /login
  // quede accesible con el branding del negocio.
  return (
    <LoyaltyShell tenantId={tenant.id} tenant={demoTenant}>
      {children}
    </LoyaltyShell>
  );
}
