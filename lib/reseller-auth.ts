import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMongoDb } from './mongodb';

const PASS_SALT    = 'reseller_pass_salt_2026';
const SESSION_SALT = 'reseller_session_2026';
export const COOKIE_NAME    = 'reseller_auth';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Reseller {
  resellerId:    string;
  nombre:        string;
  email:         string;
  passwordHash:  string;
  plan:          'basic' | 'pro';
  status:        'activo' | 'suspendido';
  whatsappNumber?: string;
  alertNumber?:  string;
  comisionPct?:  number;
  brandLogo?:    string;
  brandName?:    string;
  brandColor?:   string;
  createdAt:     Date;
  updatedAt:     Date;
}

export interface ResellerClient {
  /** Discriminador en la colección `leads` para documentos de cliente de reseller. */
  _collection_type?: 'reseller_client';
  resellerId:   string;
  clientSlug:   string;
  nombre:       string;
  negocio:      string;
  email?:       string;
  telefono?:    string;
  formularios:  Array<{
    formId:      string;
    formName:    string;
    plataforma:  string;
    activo:      boolean;
  }>;
  alertNumber?:        string;
  clientPasswordHash?: string;
  status:              'activo' | 'suspendido';
  /** Habilita PWA + push para asesoras de este cliente (default: true si no se define). */
  pwa_enabled?:        boolean;
  pwaBadgeCount?:      number;
  legacyQuery?:        Record<string, unknown>;
  createdAt:           Date;
}

// ─── Hashing ───────────────────────────────────────────────────────────────

export function hashPassword(raw: string): string {
  return crypto.createHash('sha256').update(raw + PASS_SALT).digest('hex');
}

export function buildCookieValue(resellerId: string, passwordHash: string): string {
  const token = crypto
    .createHash('sha256')
    .update(`${resellerId}|${passwordHash}|${SESSION_SALT}`)
    .digest('hex');
  return `${resellerId}|${token}`;
}

function parseCookieValue(value: string): { resellerId: string; token: string } | null {
  const idx = value.indexOf('|');
  if (idx < 1) return null;
  return { resellerId: value.slice(0, idx), token: value.slice(idx + 1) };
}

// Documento en la colección `leads` cuando representa un reseller (no un lead de chat).
type ResellerLeadDoc = Reseller & { _collection_type: 'reseller' };

// ─── Verification ──────────────────────────────────────────────────────────

export async function verifyResellerCookie(cookieValue: string | undefined): Promise<Reseller | null> {
  if (!cookieValue) return null;
  const parsed = parseCookieValue(cookieValue);
  if (!parsed) return null;
  try {
    const db = await getMongoDb();
    const reseller = await db.collection<ResellerLeadDoc>('leads').findOne({
      resellerId: parsed.resellerId,
      _collection_type: 'reseller',
    });
    if (!reseller || reseller.status !== 'activo') return null;
    const expected = buildCookieValue(parsed.resellerId, reseller.passwordHash);
    if (cookieValue !== expected) return null;
    return reseller;
  } catch {
    return null;
  }
}

// For server components — reads cookie via next/headers
export async function getResellerAuth(resellerId: string): Promise<Reseller | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  const reseller = await verifyResellerCookie(value);
  if (!reseller || reseller.resellerId !== resellerId) return null;
  return reseller;
}

// For server component pages — redirects if not authenticated
export async function requireResellerAuth(resellerId: string): Promise<Reseller> {
  const reseller = await getResellerAuth(resellerId);
  if (!reseller) {
    redirect(`/portal/${resellerId}`);
  }
  return reseller;
}
