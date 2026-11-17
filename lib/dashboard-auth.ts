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

const REVIEWER_COOKIE = 'agentia_reviewer';
const REVIEWER_SALT = 'agentia_reviewer_v1';

/** Token del acceso de revisor (Meta App Review): solo da acceso a /agentia-panel y /api/agentia-panel. */
export function reviewerToken(): string | null {
  const user = process.env.REVIEWER_USER?.trim();
  const pass = process.env.REVIEWER_PASSWORD;
  if (!user || !pass) return null;
  return crypto.createHash('sha256').update(`${user}:${pass}:${REVIEWER_SALT}`).digest('hex');
}

export function isAgentiaReviewer(req: NextRequest): boolean {
  const expected = reviewerToken();
  const got = req.cookies.get(REVIEWER_COOKIE)?.value;
  return Boolean(expected && got && got === expected);
}

/** Admin/dashboard O revisor (solo rutas del panel Agentia). */
export function isAgentiaPanelAuthenticated(req: NextRequest): boolean {
  return isDashboardAuthenticated(req) || isAgentiaReviewer(req);
}
