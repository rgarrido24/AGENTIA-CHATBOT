/** Auth Carnitas Granada — mismo esquema que SABUCAN, credenciales propias. */

import { sha256Hex } from '@/lib/sabucan-auth';

export const CARNITAS_AUTH_COOKIE = 'carnitas_auth';
export const CARNITAS_AUTH_SALT = 'carnitas_granada_caja_v1';
export const CARNITAS_AUTH_MAX_AGE = 60 * 60 * 12; // 12h

export function getCarnitasAdminUser(): string {
  return (process.env.CARNITAS_ADMIN_USER ?? '').trim();
}

export function getCarnitasAdminPassword(): string {
  return process.env.CARNITAS_ADMIN_PASSWORD ?? '';
}

export function isCarnitasAuthConfigured(): boolean {
  return Boolean(getCarnitasAdminUser() && getCarnitasAdminPassword());
}

export async function carnitasAuthToken(user: string, pass: string): Promise<string> {
  return sha256Hex(`${user}:${pass}${CARNITAS_AUTH_SALT}`);
}

export async function expectedCarnitasAuthToken(): Promise<string | null> {
  if (!isCarnitasAuthConfigured()) return null;
  return carnitasAuthToken(getCarnitasAdminUser(), getCarnitasAdminPassword());
}
