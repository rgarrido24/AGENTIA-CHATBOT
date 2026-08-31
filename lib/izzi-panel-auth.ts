import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { IZZI_CLIENT_ID, izziTenantClientIdFromUsername } from '@/lib/izzi-panel';

export const IZZI_PANEL_COOKIE = 'izzi_panel_auth';
export const IZZI_PANEL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días
const IZZI_AUTH_SALT = 'agentia_izzi_panel_v1';

const DASHBOARD_COOKIE = 'dashboard_auth';
const ADMIN_COOKIE = 'admin_auth';
const DASHBOARD_AUTH_SALT = 'agentia_dashboard_v2';
const ADMIN_AUTH_SALT = 'agentia_admin_salt';

export type IzziPanelCredentials = { username: string; password: string };

export function listIzziPanelCredentials(): IzziPanelCredentials[] {
  const creds: IzziPanelCredentials[] = [];
  const seen = new Set<string>();

  const add = (username: string, password: string) => {
    const user = username.trim();
    const pass = password;
    if (!user || !pass) return;
    const key = `${user}\0${pass}`;
    if (seen.has(key)) return;
    seen.add(key);
    creds.push({ username: user, password: pass });
  };

  add(process.env.IZZI_PANEL_USER || 'izzi', process.env.IZZI_PANEL_PASSWORD || '');

  const extra = process.env.IZZI_PANEL_USERS?.trim();
  if (extra) {
    for (const pair of extra.split(',')) {
      const idx = pair.indexOf(':');
      if (idx <= 0) continue;
      add(pair.slice(0, idx).trim(), pair.slice(idx + 1));
    }
  }

  add(process.env.ADMIN_USER || 'admin', process.env.ADMIN_PASSWORD || '');
  return creds;
}

export function izziPanelToken(username: string, password: string): string {
  return crypto.createHash('sha256').update(`${username}:${password}:${IZZI_AUTH_SALT}`).digest('hex');
}

function dashboardToken(): string {
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update(user + ':' + pass + DASHBOARD_AUTH_SALT).digest('hex');
}

function adminToken(): string {
  const pass = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update(pass + ADMIN_AUTH_SALT).digest('hex');
}

export function expectedIzziPanelTokens(): Set<string> {
  return new Set(listIzziPanelCredentials().map((c) => izziPanelToken(c.username, c.password)));
}

export function matchIzziPanelCredentials(username: string, password: string): boolean {
  const user = username.trim();
  return listIzziPanelCredentials().some((c) => c.username === user && c.password === password);
}

export function isIzziPanelConfigured(): boolean {
  return listIzziPanelCredentials().length > 0;
}

/** Cookie propia del panel (30 días) o sesión admin/dashboard. */
export function matchIzziPanelUser(req: NextRequest): IzziPanelCredentials | null {
  const token = req.cookies.get(IZZI_PANEL_COOKIE)?.value;
  if (!token) return null;
  for (const c of listIzziPanelCredentials()) {
    if (izziPanelToken(c.username, c.password) === token) return c;
  }
  return null;
}

/** Tenant del panel: cada usuario ve solo su WhatsApp. Admin/dashboard → izzi original. */
export function getIzziPanelClientId(req: NextRequest): string | null {
  if (!isIzziPanelAuthenticated(req)) return null;
  const user = matchIzziPanelUser(req);
  if (user) return izziTenantClientIdFromUsername(user.username);
  return IZZI_CLIENT_ID;
}

export function isIzziPanelAuthenticated(req: NextRequest): boolean {
  if (!isIzziPanelConfigured()) return false;
  const izzi = req.cookies.get(IZZI_PANEL_COOKIE)?.value;
  if (izzi && expectedIzziPanelTokens().has(izzi)) return true;

  if (process.env.ADMIN_PASSWORD) {
    const dash = req.cookies.get(DASHBOARD_COOKIE)?.value;
    const admin = req.cookies.get(ADMIN_COOKIE)?.value;
    if (dash && dash === dashboardToken()) return true;
    if (admin && admin === adminToken()) return true;
  }
  return false;
}
