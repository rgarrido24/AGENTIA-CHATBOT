import { notFound } from 'next/navigation';
import { AltaClienteForm } from '@/components/loyalty/AltaClienteForm';
import { getTenantByPublicSlug } from '@/lib/wallet-tenant';

type Props = { params: { negocio: string } };

export default function AltaPublicPage({ params }: Props) {
  const tenant = getTenantByPublicSlug(params.negocio);
  if (!tenant) notFound();
  return <AltaClienteForm tenantId={tenant.id} />;
}

