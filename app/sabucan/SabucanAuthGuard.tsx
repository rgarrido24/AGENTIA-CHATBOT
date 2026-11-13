import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { hasValidSabucanSession, isTenantPanelActive } from '@/lib/sabucan-security';

export const dynamic = 'force-dynamic';

export default async function SabucanAuthGuard({
  children,
  from = '/sabucan/caja',
}: {
  children: ReactNode;
  from?: string;
}) {
  // Suspensión: se revisa en cada request, aunque la cookie siga vigente.
  if (!(await isTenantPanelActive())) {
    redirect('/sabucan/suspendido');
  }
  if (!(await hasValidSabucanSession())) {
    redirect(`/sabucan/login?from=${encodeURIComponent(from)}`);
  }
  return <>{children}</>;
}
