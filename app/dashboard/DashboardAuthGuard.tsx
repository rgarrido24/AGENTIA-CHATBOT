import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE_NAME = 'dashboard_auth';
const AUTH_SALT = 'agentia_dashboard_v2';

function getDashboardToken(): string {
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update(user + ':' + pass + AUTH_SALT).digest('hex');
}

export default async function DashboardAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!process.env.ADMIN_PASSWORD) {
    redirect('/dashboard/login');
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const expected = getDashboardToken();
  if (!token || token !== expected) {
    redirect('/dashboard/login');
  }
  return <>{children}</>;
}
