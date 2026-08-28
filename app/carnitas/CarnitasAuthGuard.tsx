import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import {
  CARNITAS_AUTH_COOKIE,
  expectedCarnitasAuthToken,
  isCarnitasAuthConfigured,
} from '@/lib/carnitas-auth';

export default async function CarnitasAuthGuard({
  children,
  from = '/carnitas/caja',
}: {
  children: ReactNode;
  from?: string;
}) {
  const loginUrl = `/carnitas/login?from=${encodeURIComponent(from)}`;

  if (!isCarnitasAuthConfigured()) {
    redirect(loginUrl);
  }

  const expected = await expectedCarnitasAuthToken();
  const cookieStore = await cookies();
  const token = cookieStore.get(CARNITAS_AUTH_COOKIE)?.value;

  if (!expected || token !== expected) {
    redirect(loginUrl);
  }

  return <>{children}</>;
}
