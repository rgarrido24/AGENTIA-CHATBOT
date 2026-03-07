import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_auth';
const AUTH_SALT = 'agentia_admin_salt';

function getExpectedToken(secret: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(secret + AUTH_SALT).digest('hex');
}

/**
 * Protege rutas que requieren ADMIN_PASSWORD.
 * Redirige a /login si no hay cookie válida.
 */
export default async function AdminAuthGuard({
  children,
  fromPath = '/dashboard',
}: {
  children: React.ReactNode;
  fromPath?: string;
}) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    redirect(`/login?from=${encodeURIComponent(fromPath)}`);
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const expected = getExpectedToken(secret);
  if (!token || token !== expected) {
    redirect(`/login?from=${encodeURIComponent(fromPath)}`);
  }
  return <>{children}</>;
}
