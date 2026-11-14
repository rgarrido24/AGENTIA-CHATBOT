import { BannerTenant } from './BannerTenant';

type Props = { params: { negocio: string } };

export default function BannerPage({ params }: Props) {
  return <BannerTenant tenantId={params.negocio} />;
}
