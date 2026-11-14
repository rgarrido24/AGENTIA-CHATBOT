import { redirect, notFound } from 'next/navigation';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';

export const dynamic = 'force-dynamic';

type Props = { params: { negocio: string } };

export default async function DemoNegocioPage({ params }: Props) {
  const tenant = await getLoyaltyTenant(params.negocio);
  if (!tenant) notFound();
  redirect(`${tenant.basePath}/caja`);
}
