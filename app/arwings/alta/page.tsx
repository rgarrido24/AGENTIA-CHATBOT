import { notFound } from 'next/navigation';
import { AltaClienteForm } from '@/components/loyalty/AltaClienteForm';
import { ensureTenant } from '@/lib/restaurantes/tenant';
import { SERVIDOR } from '@/lib/restaurantes/servidor';

export const dynamic = 'force-dynamic';

/** Registro público de la tarjeta de lealtad de Arwings. */
export default async function ArwingsAltaPage() {
  const tenant = await ensureTenant(SERVIDOR.arwings);
  if (!tenant) notFound();
  return <AltaClienteForm tenantId={tenant.id} tenant={tenant} />;
}
