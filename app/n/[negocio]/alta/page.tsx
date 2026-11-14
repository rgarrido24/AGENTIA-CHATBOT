import { notFound } from 'next/navigation';
import { AltaClienteForm } from '@/components/loyalty/AltaClienteForm';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';

export const dynamic = 'force-dynamic';

type Props = { params: { negocio: string } };

export default async function AltaPublicPage({ params }: Props) {
  const tenant = await getLoyaltyTenant(params.negocio);
  if (!tenant) notFound();
  return <AltaClienteForm tenantId={tenant.id} tenant={tenant} />;
}
