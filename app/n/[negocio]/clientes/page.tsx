import { LoyaltyClientesPage } from '@/components/loyalty/LoyaltyClientesPage';

type Props = { params: { negocio: string } };

export default function ClientesPage({ params }: Props) {
  return <LoyaltyClientesPage tenantId={params.negocio} />;
}
