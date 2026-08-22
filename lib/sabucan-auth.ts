/** Auth SABUCAN caja — Web Crypto (Edge-safe), sin Node.js crypto */

export const SABUCAN_AUTH_COOKIE = 'sabucan_auth';
export const SABUCAN_AUTH_SALT = 'sabucan_caja_v1';
export const SABUCAN_AUTH_MAX_AGE = 60 * 60 * 12; // 12h

export function getSabucanAdminUser(): string {
  return (process.env.SABUCAN_ADMIN_USER ?? '').trim();
}

export function getSabucanAdminPassword(): string {
  return process.env.SABUCAN_ADMIN_PASSWORD ?? '';
}

export function isSabucanAuthConfigured(): boolean {
  return Boolean(getSabucanAdminUser() && getSabucanAdminPassword());
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sabucanAuthToken(user: string, pass: string): Promise<string> {
  return sha256Hex(`${user}:${pass}${SABUCAN_AUTH_SALT}`);
}

export async function expectedSabucanAuthToken(): Promise<string | null> {
  if (!isSabucanAuthConfigured()) return null;
  return sabucanAuthToken(getSabucanAdminUser(), getSabucanAdminPassword());
}
