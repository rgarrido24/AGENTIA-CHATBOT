import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import SabucanAuthGuard from '@/app/sabucan/SabucanAuthGuard';
import { LoyaltyShell } from '@/components/loyalty/LoyaltyShell';
import { getTenant, isDemoNegocio } from '@/lib/wallet-tenant';

type Props = {
  children: ReactNode;
  params: { negocio: string };
};

export function generateMetadata({ params }: Props): Metadata {
  const tenant = isDemoNegocio(params.negocio) ? getTenant(params.negocio) : null;
  return {
    title: tenant
      ? `${tenant.nombre} · Caja de lealtad (demo)`
      : 'Demo lealtad',
    description: tenant
      ? `Registro de ventas y puntos — ${tenant.nombre}`
      : 'Demo de lealtad',
    robots: { index: false, follow: false },
  };
}

export default function DemoNegocioLayout({ children, params }: Props) {
  if (!isDemoNegocio(params.negocio)) {
    notFound();
  }

  const from = `/demo/${params.negocio}/caja`;

  return (
    <SabucanAuthGuard from={from}>
      <LoyaltyShell tenantId={params.negocio}>{children}</LoyaltyShell>
    </SabucanAuthGuard>
  );
}
