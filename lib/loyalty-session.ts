/**
 * Sesión y credenciales para paneles de lealtad por negocio (/n/[negocio]).
 * Solo servidor.
 *  - Cookie firmada (HMAC) `lty_session` = key.exp.firma
 *  - Contraseñas con scrypt
 *  - requireTenantApi(): protege /api/loyalty/[tenant]/* (sesión nueva o cookies legacy)
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';
import { DEMO_AUTH_COOKIE, expectedDemoAuthToken } from '@/lib/demo-auth';
import { CARNITAS_AUTH_COOKIE, expectedCarnitasAuthToken } from '@/lib/carnitas-auth';
import { hasValidSabucanSession } from '@/lib/sabucan-security';
import { vigenciaVencida } from '@/lib/lealtad-suscripcion';

export const LTY_COOKIE = 'lty_session';
export const LTY_MAX_AGE = 60 * 60 * 12;

function secret(): string {
  const s =
    process.env.LOYALTY_SESSION_SECRET || process.env.ADMIN_PASSWORD || process.env.MONGODB_URI || '';
  if (!s) throw new Error('Falta LOYALTY_SESSION_SECRET');
  return `lty:${s}`;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createSessionToken(key: string): string {
  const exp = Math.floor(Date.now() / 1000) + LTY_MAX_AGE;
  const payload = `${key}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function readSessionKey(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const j = payload.lastIndexOf('.');
  const exp = Number(payload.slice(j + 1));
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return null;
  return payload.slice(0, j);
}

export async function setSessionCookie(key: string): Promise<void> {
  (await cookies()).set(LTY_COOKIE, createSessionToken(key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: LTY_MAX_AGE,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(LTY_COOKIE);
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pw, salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(pw: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const [alg, salt, hash] = stored.split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const test = scryptSync(pw, salt, 32);
  const real = Buffer.from(hash, 'hex');
  return test.length === real.length && timingSafeEqual(test, real);
}

/** Contraseña legible (sin 0/O/1/l/I). */
export function randomPassword(len = 10): string {
  const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += abc[bytes[i] % abc.length];
  return out;
}

/** true = el panel del negocio está activo (sin caché). Sin documento → activo (legacy). */
export async function isPanelActive(key: string): Promise<boolean> {
  try {
    const db = await getMongoDb();
    const doc = await db.collection('loyalty_tenants').findOne({ key });
    if (!doc) return true;
    if (doc.panelActivo === false) return false;
    // Prueba / suscripción vencida: se corta al instante aunque el cron no haya corrido.
    if (vigenciaVencida(doc as { vigenteHasta?: Date; plan?: string })) return false;
    return true;
  } catch (e) {
    console.error('[loyalty-session] isPanelActive', e);
    return false;
  }
}

/** ¿La petición actual tiene sesión válida para este negocio? */
export async function hasTenantSession(tenantId: string, isDemo: boolean): Promise<boolean> {
  const jar = await cookies();
  if (readSessionKey(jar.get(LTY_COOKIE)?.value) === tenantId) return true;
  // Legacy: cookies de los paneles anteriores
  if (isDemo && jar.get(DEMO_AUTH_COOKIE)?.value === (await expectedDemoAuthToken())) return true;
  if (tenantId === 'carnitas_granada') {
    const exp = await expectedCarnitasAuthToken();
    if (exp && jar.get(CARNITAS_AUTH_COOKIE)?.value === exp) return true;
  }
  if (tenantId === 'sabucan' && (await hasValidSabucanSession())) return true;
  return false;
}

/** Para API routes: devuelve respuesta de error, o null si todo bien. */
export async function requireTenantApi(tenantParam: string): Promise<NextResponse | null> {
  const cfg = await getLoyaltyTenant(tenantParam);
  if (!cfg) return NextResponse.json({ error: 'Tenant inválido' }, { status: 404 });
  if (!(await isPanelActive(cfg.id))) {
    return NextResponse.json(
      { error: 'Servicio suspendido. Contacta a Agentia para reactivarlo.', suspendido: true },
      { status: 403 },
    );
  }
  if (!(await hasTenantSession(cfg.id, cfg.isDemo))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}
