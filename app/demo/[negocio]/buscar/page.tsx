import { notFound } from 'next/navigation';
import { LoyaltyBuscarPage } from '@/components/loyalty/LoyaltyBuscarPage';
import { isDemoNegocio } from '@/lib/wallet-tenant';

type Props = { params: { negocio: string } };

export default function DemoBuscarPage({ params }: Props) {
  if (!isDemoNegocio(params.negocio)) notFound();
  return <LoyaltyBuscarPage tenantId={params.negocio} />;
}
