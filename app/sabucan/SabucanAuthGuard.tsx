import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import {
  SABUCAN_AUTH_COOKIE,
  getSabucanAdminUser,
  isSabucanAuthConfigured,
  sabucanAuthToken,
} from '@/lib/sabucan-auth';
import { getEffectiveSabucanPassword } from '@/app/api/sabucan/auth/password/route';

export default async function SabucanAuthGuard({
  children,
  from = '/sabucan/caja',
}: {
  children: ReactNode;
  from?: string;
}) {
  const loginUrl = `/sabucan/login?from=${encodeURIComponent(from)}`;

  if (!isSabucanAuthConfigured()) {
    redirect(loginUrl);
  }

  const effectivePass = await getEffectiveSabucanPassword();
  const expected = await sabucanAuthToken(getSabucanAdminUser(), effectivePass);
  const cookieStore = await cookies();
  const token = cookieStore.get(SABUCAN_AUTH_COOKIE)?.value;

  if (!expected || token !== expected) {
    redirect(loginUrl);
  }

  return <>{children}</>;
}
