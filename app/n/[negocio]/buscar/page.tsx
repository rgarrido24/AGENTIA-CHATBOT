import { LoyaltyBuscarPage } from '@/components/loyalty/LoyaltyBuscarPage';

type Props = { params: { negocio: string } };

export default function BuscarPage({ params }: Props) {
  return <LoyaltyBuscarPage tenantId={params.negocio} />;
}
