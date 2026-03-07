import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_auth';
const AUTH_SALT = 'agentia_admin_salt';

function getExpectedToken(secret: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(secret + AUTH_SALT).digest('hex');
}

export default async function DashboardAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    redirect('/login?from=/dashboard');
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const expected = getExpectedToken(secret);
  if (!token || token !== expected) {
    redirect('/login?from=/dashboard');
  }
  return <>{children}</>;
}
