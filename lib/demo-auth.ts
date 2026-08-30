/**
 * Auth de las demos (café, barbería, abarrotes) — mismo esquema que SABUCAN,
 * con credenciales propias y compartidas entre las tres.
 *
 * Separado del login de SABUCAN y de Carnitas a propósito: son clientes reales
 * y no deben compartir credenciales con material de demostración.
 */

import { sha256Hex } from '@/lib/sabucan-auth';

export const DEMO_AUTH_COOKIE = 'demo_auth';
export const DEMO_AUTH_SALT = 'demo_lealtad_v1';
export const DEMO_AUTH_MAX_AGE = 60 * 60 * 12; // 12h

/** Credenciales de vitrina: hay default para que la demo nunca quede inaccesible. */
export function getDemoAdminUser(): string {
  return (process.env.DEMO_ADMIN_USER ?? '').trim() || 'demo';
}

export function getDemoAdminPassword(): string {
  const v = process.env.DEMO_ADMIN_PASSWORD ?? '';
  return v.trim() ? v : '1234';
}

export async function demoAuthToken(user: string, pass: string): Promise<string> {
  return sha256Hex(`${user}:${pass}${DEMO_AUTH_SALT}`);
}

export async function expectedDemoAuthToken(): Promise<string> {
  return demoAuthToken(getDemoAdminUser(), getDemoAdminPassword());
}
