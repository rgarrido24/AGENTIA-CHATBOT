import { notFound } from 'next/navigation';
import { LoyaltyCajaPage } from '@/components/loyalty/LoyaltyCajaPage';
import { isDemoNegocio } from '@/lib/wallet-tenant';

type Props = { params: { negocio: string } };

export default function DemoCajaPage({ params }: Props) {
  if (!isDemoNegocio(params.negocio)) notFound();
  return <LoyaltyCajaPage tenantId={params.negocio} />;
}
