import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import {
  SABUCAN_AUTH_COOKIE,
  expectedSabucanAuthToken,
  isSabucanAuthConfigured,
} from '@/lib/sabucan-auth';

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

  const expected = await expectedSabucanAuthToken();
  const cookieStore = await cookies();
  const token = cookieStore.get(SABUCAN_AUTH_COOKIE)?.value;

  if (!expected || token !== expected) {
    redirect(loginUrl);
  }

  return <>{children}</>;
}
