import { LoyaltyClientesPage } from '@/components/loyalty/LoyaltyClientesPage';

type Props = { params: { negocio: string } };

export default function DemoClientesPage({ params }: Props) {
  return <LoyaltyClientesPage tenantId={params.negocio} />;
}
