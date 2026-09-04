import { LoyaltyBuscarPage } from '@/components/loyalty/LoyaltyBuscarPage';

type Props = { params: { negocio: string } };

export default function DemoBuscarPage({ params }: Props) {
  return <LoyaltyBuscarPage tenantId={params.negocio} />;
}
