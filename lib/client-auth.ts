import crypto from 'crypto';
import { getMongoDb } from './mongodb';

const PASS_SALT    = 'reseller_pass_salt_2026'; // shared with reseller-auth
const SESSION_SALT = 'client_session_2026';
export const CLIENT_COOKIE_NAME    = 'client_auth';
export const CLIENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function hashClientPassword(raw: string): string {
  return crypto.createHash('sha256').update(raw + PASS_SALT).digest('hex');
}

export function generateTempPassword(length = 10): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('');
}

export function buildClientCookieValue(
  resellerId: string,
  clientSlug: string,
  passwordHash: string
): string {
  const token = crypto
    .createHash('sha256')
    .update(`${resellerId}|${clientSlug}|${passwordHash}|${SESSION_SALT}`)
    .digest('hex');
  return `${resellerId}:${clientSlug}|${token}`;
}

export async function verifyClientCookie(
  cookieValue: string | undefined,
  resellerId: string,
  clientSlug: string
): Promise<boolean> {
  if (!cookieValue) return false;
  try {
    const db = await getMongoDb();
    const doc = await db.collection('leads').findOne({
      _collection_type: 'reseller_client',
      resellerId,
      clientSlug,
    });
    if (!doc?.clientPasswordHash) return false;
    const expected = buildClientCookieValue(resellerId, clientSlug, String(doc.clientPasswordHash));
    return cookieValue === expected;
  } catch {
    return false;
  }
}

export type ClientAuthInfo = { resellerId: string; clientSlug: string };

// Used when resellerId/clientSlug are NOT known from route params (e.g. /api/leads/[leadId])
export async function verifyAnyClientCookie(
  cookieValue: string | undefined
): Promise<ClientAuthInfo | null> {
  if (!cookieValue) return null;
  const barIdx = cookieValue.indexOf('|');
  if (barIdx < 1) return null;
  const prefix    = cookieValue.slice(0, barIdx);
  const colonIdx  = prefix.indexOf(':');
  if (colonIdx < 1) return null;
  const resellerId = prefix.slice(0, colonIdx);
  const clientSlug = prefix.slice(colonIdx + 1);
  if (!resellerId || !clientSlug) return null;
  const valid = await verifyClientCookie(cookieValue, resellerId, clientSlug);
  return valid ? { resellerId, clientSlug } : null;
}
