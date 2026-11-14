import { LoyaltyCajaPage } from '@/components/loyalty/LoyaltyCajaPage';

type Props = { params: { negocio: string } };

export default function CajaPage({ params }: Props) {
  return <LoyaltyCajaPage tenantId={params.negocio} />;
}
