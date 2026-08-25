import { notFound } from 'next/navigation';
import { LoyaltyClientesPage } from '@/components/loyalty/LoyaltyClientesPage';
import { isDemoNegocio } from '@/lib/wallet-tenant';

type Props = { params: { negocio: string } };

export default function DemoClientesPage({ params }: Props) {
  if (!isDemoNegocio(params.negocio)) notFound();
  return <LoyaltyClientesPage tenantId={params.negocio} />;
}
