import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const COOKIE_NAME = 'admin_auth';
const AUTH_SALT = 'agentia_admin_salt';

function expectedToken(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return '';
  return crypto.createHash('sha256').update(secret + AUTH_SALT).digest('hex');
}

/** Valida cookie `admin_auth` en rutas API (misma lógica que login admin). */
export function isAdminRequest(req: NextRequest): boolean {
  const exp = expectedToken();
  if (!exp) return false;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return Boolean(token && token === exp);
}
