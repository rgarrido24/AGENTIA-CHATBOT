/**
 * Seguridad SABUCAN (solo servidor):
 *  - Suspensión real: lee `loyalty_tenants.panelActivo` en CADA request (sin caché).
 *  - Sesión para APIs (antes /api/sabucan/* no validaban nada).
 *  - Bloqueo por intentos fallidos de login + alerta WhatsApp al dueño.
 */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { bridgeSendMessage } from '@/lib/baileys-bridge-client';
import {
  SABUCAN_AUTH_COOKIE,
  getSabucanAdminUser,
  isSabucanAuthConfigured,
  sabucanAuthToken,
} from '@/lib/sabucan-auth';
import { getEffectiveSabucanPassword } from '@/app/api/sabucan/auth/password/route';

export const SABUCAN_TENANT_KEY = 'sabucan';
export const MAX_FAILED_ATTEMPTS = 3;
const LOCK_MS = 30 * 60 * 1000; // 30 min de bloqueo por IP
const WINDOW_MS = 15 * 60 * 1000; // ventana para contar fallos

/** true = panel activo. Sin documento → activo (legacy). Error de Mongo → cerrado. */
export async function isTenantPanelActive(key: string = SABUCAN_TENANT_KEY): Promise<boolean> {
  try {
    const db = await getMongoDb();
    const doc = await db.collection('loyalty_tenants').findOne({ key });
    if (!doc) return true;
    return doc.panelActivo !== false;
  } catch (e) {
    console.error('[sabucan-security] no se pudo leer tenant', e);
    return false;
  }
}

/** ¿La cookie actual es una sesión válida? (no revisa suspensión) */
export async function hasValidSabucanSession(): Promise<boolean> {
  if (!isSabucanAuthConfigured()) return false;
  const expected = await sabucanAuthToken(getSabucanAdminUser(), await getEffectiveSabucanPassword());
  const token = (await cookies()).get(SABUCAN_AUTH_COOKIE)?.value;
  return Boolean(token && token === expected);
}

/** Para API routes: devuelve una respuesta de error, o null si todo está bien. */
export async function requireSabucanApi(): Promise<NextResponse | null> {
  if (!(await isTenantPanelActive())) {
    return NextResponse.json(
      { error: 'Servicio suspendido. Contacta a Agentia para reactivarlo.', suspendido: true },
      { status: 403 },
    );
  }
  if (!(await hasValidSabucanSession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

export function requestIp(req: Request): string {
  const h = req.headers;
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'desconocida'
  );
}

type AttemptDoc = { _id: string; fails: number; firstAt: Date; lockedUntil?: Date };

async function attempts() {
  const db = await getMongoDb();
  return db.collection<AttemptDoc>('sabucan_login_attempts');
}

/** Minutos restantes de bloqueo (0 = no bloqueado). */
export async function lockMinutesLeft(ip: string): Promise<number> {
  try {
    const doc = await (await attempts()).findOne({ _id: ip });
    if (doc?.lockedUntil && doc.lockedUntil.getTime() > Date.now()) {
      return Math.ceil((doc.lockedUntil.getTime() - Date.now()) / 60000);
    }
  } catch (e) {
    console.error('[sabucan-security] lockMinutesLeft', e);
  }
  return 0;
}

async function notifyOwner(message: string): Promise<void> {
  try {
    const to = process.env.ALERT_WHATSAPP_NUMBER?.trim();
    if (!to) {
      console.warn('[sabucan-security] ALERT_WHATSAPP_NUMBER no configurado; alerta solo en log:', message);
      return;
    }
    await bridgeSendMessage(process.env.AGENTIA_ALERTS_SENDER_CLIENT_ID || 'agentia-ventas', to, message);
  } catch (e) {
    console.error('[sabucan-security] no se pudo enviar alerta WhatsApp', e);
  }
}

async function logEvent(type: string, data: Record<string, unknown>) {
  try {
    const db = await getMongoDb();
    await db.collection('security_events').insertOne({ app: 'sabucan', type, ...data, at: new Date() });
  } catch {
    /* best effort */
  }
}

/** Registra un fallo; alerta al dueño; bloquea la IP al llegar a 3. */
export async function recordFailedLogin(
  ip: string,
  userAgent: string,
  usernameTried: string,
  source: 'login' | 'cambio-password' = 'login',
): Promise<{ locked: boolean; remaining: number }> {
  const col = await attempts();
  const now = new Date();
  const prev = await col.findOne({ _id: ip });
  const fresh = !prev || now.getTime() - prev.firstAt.getTime() > WINDOW_MS;
  const fails = fresh ? 1 : prev.fails + 1;
  const locked = fails >= MAX_FAILED_ATTEMPTS;

  await col.updateOne(
    { _id: ip },
    {
      $set: {
        fails,
        firstAt: fresh ? now : prev!.firstAt,
        ...(locked ? { lockedUntil: new Date(now.getTime() + LOCK_MS) } : {}),
      },
    },
    { upsert: true },
  );

  await logEvent('login_fallido', { ip, userAgent, usernameTried: usernameTried.slice(0, 40), fails, locked, source });

  const hora = now.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
  await notifyOwner(
    locked
      ? `🚨 SABUCAN — IP BLOQUEADA ${LOCK_MS / 60000} min tras ${fails} intentos fallidos (${source}).\nIP: ${ip}\nUsuario probado: "${usernameTried.slice(0, 40)}"\n${hora}`
      : `⚠️ SABUCAN — intento fallido de acceso (${fails}/${MAX_FAILED_ATTEMPTS}, ${source}).\nIP: ${ip}\nUsuario probado: "${usernameTried.slice(0, 40)}"\n${hora}`,
  );

  return { locked, remaining: Math.max(0, MAX_FAILED_ATTEMPTS - fails) };
}

export async function clearFailedLogins(ip: string): Promise<void> {
  try {
    await (await attempts()).deleteOne({ _id: ip });
  } catch {
    /* best effort */
  }
}

/** Aviso de un login exitoso mientras el panel está suspendido (alguien con credenciales insiste). */
export async function reportSuspendedAccess(ip: string): Promise<void> {
  await logEvent('acceso_suspendido', { ip });
  await notifyOwner(`🔒 SABUCAN — alguien intentó entrar con el panel SUSPENDIDO.\nIP: ${ip}`);
}
