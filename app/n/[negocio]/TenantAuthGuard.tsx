import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';
import { hasTenantSession, isPanelActive } from '@/lib/loyalty-session';

export const dynamic = 'force-dynamic';

export default async function TenantAuthGuard({
  children,
  negocio,
  seccion,
}: {
  children: ReactNode;
  negocio: string;
  seccion: 'caja' | 'buscar' | 'clientes';
}) {
  const tenant = await getLoyaltyTenant(negocio);
  if (!tenant) redirect(`/n/${negocio}/login`);

  // Suspensión: se revisa en cada request, aunque la cookie siga vigente.
  if (!(await isPanelActive(tenant.id))) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold">Servicio suspendido</h1>
        <p className="mt-3 text-white/70">
          El acceso a la caja de lealtad está en pausa. Tus clientes y puntos siguen guardados.
        </p>
        <a className="mt-5 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-black" href={`/n/${negocio}/renovar`}>
          Reactivar mi tarjeta
        </a>
      </div>
    );
  }
  if (!(await hasTenantSession(tenant.id, tenant.isDemo))) {
    redirect(`/n/${negocio}/login?from=${encodeURIComponent(`/n/${negocio}/${seccion}`)}`);
  }
  return <>{children}</>;
}
