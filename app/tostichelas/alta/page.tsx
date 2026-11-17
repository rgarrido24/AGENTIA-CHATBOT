import { notFound } from 'next/navigation';
import { AltaClienteForm } from '@/components/loyalty/AltaClienteForm';
import { ensureTostichelasTenant } from '@/lib/tostichelas-tenant';

export const dynamic = 'force-dynamic';

/** Registro público de la tarjeta de lealtad de Tostichelas (el QR del banner apunta aquí). */
export default async function TostichelasAltaPage() {
  const tenant = await ensureTostichelasTenant();
  if (!tenant) notFound();
  return <AltaClienteForm tenantId={tenant.id} tenant={tenant} />;
}
