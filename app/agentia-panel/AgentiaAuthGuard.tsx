import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const DASHBOARD_COOKIE_NAME = 'dashboard_auth';
const ADMIN_COOKIE_NAME = 'admin_auth';
const DASHBOARD_AUTH_SALT = 'agentia_dashboard_v2';
const ADMIN_AUTH_SALT = 'agentia_admin_salt';

function getDashboardToken(): string {
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update(user + ':' + pass + DASHBOARD_AUTH_SALT).digest('hex');
}

function getAdminToken(): string {
  const pass = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update(pass + ADMIN_AUTH_SALT).digest('hex');
}

export default async function AgentiaAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!process.env.ADMIN_PASSWORD) {
    redirect('/agentia-panel/login');
  }
  const cookieStore = await cookies();
  const dashboardToken = cookieStore.get(DASHBOARD_COOKIE_NAME)?.value;
  const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (
    dashboardToken !== getDashboardToken() &&
    adminToken !== getAdminToken()
  ) {
    redirect('/agentia-panel/login');
  }
  return <>{children}</>;
}
