import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { DEMO_AUTH_COOKIE, expectedDemoAuthToken } from '@/lib/demo-auth';

export default async function DemoAuthGuard({
  children,
  negocio,
  seccion,
}: {
  children: ReactNode;
  negocio: string;
  seccion: 'caja' | 'buscar' | 'clientes';
}) {
  const from = `/demo/${negocio}/${seccion}`;
  const loginUrl = `/demo/${negocio}/login?from=${encodeURIComponent(from)}`;

  const expected = await expectedDemoAuthToken();
  const token = (await cookies()).get(DEMO_AUTH_COOKIE)?.value;

  if (token !== expected) {
    redirect(loginUrl);
  }

  return <>{children}</>;
}
