import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const DASHBOARD_COOKIE = 'dashboard_auth';
const ADMIN_COOKIE = 'admin_auth';
const DASHBOARD_AUTH_SALT = 'agentia_dashboard_v2';
const ADMIN_AUTH_SALT = 'agentia_admin_salt';

function dashboardToken(): string {
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update(user + ':' + pass + DASHBOARD_AUTH_SALT).digest('hex');
}

function adminToken(): string {
  const pass = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update(pass + ADMIN_AUTH_SALT).digest('hex');
}

/** Misma sesión que /dashboard (cookie dashboard_auth o admin_auth). */
export function isDashboardAuthenticated(req: NextRequest): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  const dash = req.cookies.get(DASHBOARD_COOKIE)?.value;
  const admin = req.cookies.get(ADMIN_COOKIE)?.value;
  return (!!dash && dash === dashboardToken()) || (!!admin && admin === adminToken());
}
