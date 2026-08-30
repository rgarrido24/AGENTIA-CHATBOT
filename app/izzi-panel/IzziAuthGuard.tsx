import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { PanelPwaProvider } from '@/components/panel/PanelPwaProvider';
import { IZZI_PANEL_PWA } from '@/lib/panel-pwa-config';
import {
  expectedIzziPanelTokens,
  isIzziPanelConfigured,
  IZZI_PANEL_COOKIE,
} from '@/lib/izzi-panel-auth';

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

export default async function IzziAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isIzziPanelConfigured()) {
    redirect('/izzi-panel/login');
  }
  const cookieStore = await cookies();
  const izziToken = cookieStore.get(IZZI_PANEL_COOKIE)?.value;
  const dashboardToken = cookieStore.get(DASHBOARD_COOKIE_NAME)?.value;
  const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const izziOk = !!izziToken && expectedIzziPanelTokens().has(izziToken);
  const dashOk = !!dashboardToken && dashboardToken === getDashboardToken();
  const adminOk = !!adminToken && adminToken === getAdminToken();
  if (!izziOk && !dashOk && !adminOk) {
    redirect('/izzi-panel/login');
  }
  return (
    <>
      {children}
      <PanelPwaProvider
        config={IZZI_PANEL_PWA}
        vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
      />
    </>
  );
}
