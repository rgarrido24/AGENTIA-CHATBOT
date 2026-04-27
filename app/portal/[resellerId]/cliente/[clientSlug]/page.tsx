import { requireResellerAuth } from '@/lib/reseller-auth';
import { LeadsPanel } from './LeadsPanel';

export default async function ClientPage({
  params,
}: {
  params: { resellerId: string; clientSlug: string };
}) {
  const { resellerId, clientSlug } = params;
  await requireResellerAuth(resellerId);
  return <LeadsPanel resellerId={resellerId} clientSlug={clientSlug} />;
}
