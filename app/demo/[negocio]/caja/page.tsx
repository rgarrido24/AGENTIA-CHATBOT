import { LoyaltyCajaPage } from '@/components/loyalty/LoyaltyCajaPage';

type Props = { params: { negocio: string } };

export default function DemoCajaPage({ params }: Props) {
  return <LoyaltyCajaPage tenantId={params.negocio} />;
}
