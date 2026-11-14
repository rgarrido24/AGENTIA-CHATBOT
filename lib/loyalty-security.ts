/** Bloqueo por intentos fallidos + alerta al dueño para logins de paneles /n/[negocio]. Solo servidor. */
import { getMongoDb } from '@/lib/mongodb';
import { bridgeSendMessage } from '@/lib/baileys-bridge-client';

export const MAX_FAILS = 3;
const LOCK_MS = 30 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;

type AttemptDoc = { _id: string; fails: number; firstAt: Date; lockedUntil?: Date };

async function col() {
  return (await getMongoDb()).collection<AttemptDoc>('loyalty_login_attempts');
}

export async function notifyOwner(message: string): Promise<void> {
  try {
    const to = process.env.ALERT_WHATSAPP_NUMBER?.trim();
    if (!to) {
      console.warn('[loyalty-security] ALERT_WHATSAPP_NUMBER no configurado:', message);
      return;
    }
    await bridgeSendMessage(process.env.AGENTIA_ALERTS_SENDER_CLIENT_ID || 'agentia-ventas', to, message);
  } catch (e) {
    console.error('[loyalty-security] alerta WhatsApp falló', e);
  }
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

export async function lockMinutesLeft(key: string, ip: string): Promise<number> {
  try {
    const doc = await (await col()).findOne({ _id: `${key}:${ip}` });
    if (doc?.lockedUntil && doc.lockedUntil.getTime() > Date.now()) {
      return Math.ceil((doc.lockedUntil.getTime() - Date.now()) / 60000);
    }
  } catch (e) {
    console.error('[loyalty-security] lockMinutesLeft', e);
  }
  return 0;
}

export async function recordFail(
  key: string,
  nombre: string,
  ip: string,
  userAgent: string,
  userTried: string,
): Promise<{ locked: boolean }> {
  const c = await col();
  const id = `${key}:${ip}`;
  const now = new Date();
  const prev = await c.findOne({ _id: id });
  const fresh = !prev || now.getTime() - prev.firstAt.getTime() > WINDOW_MS;
  const fails = fresh ? 1 : prev.fails + 1;
  const locked = fails >= MAX_FAILS;
  await c.updateOne(
    { _id: id },
    {
      $set: {
        fails,
        firstAt: fresh ? now : prev!.firstAt,
        ...(locked ? { lockedUntil: new Date(now.getTime() + LOCK_MS) } : {}),
      },
    },
    { upsert: true },
  );
  try {
    await (await getMongoDb())
      .collection('security_events')
      .insertOne({ app: 'loyalty', tenant: key, type: 'login_fallido', ip, userAgent, userTried: userTried.slice(0, 40), fails, locked, at: now });
  } catch {
    /* best effort */
  }
  const hora = now.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
  await notifyOwner(
    locked
      ? `🚨 ${nombre} — IP BLOQUEADA 30 min tras ${fails} intentos fallidos.\nIP: ${ip}\nUsuario probado: "${userTried.slice(0, 40)}"\n${hora}`
      : `⚠️ ${nombre} — intento fallido de acceso (${fails}/${MAX_FAILS}).\nIP: ${ip}\nUsuario probado: "${userTried.slice(0, 40)}"\n${hora}`,
  );
  return { locked };
}

export async function clearFails(key: string, ip: string): Promise<void> {
  try {
    await (await col()).deleteOne({ _id: `${key}:${ip}` });
  } catch {
    /* best effort */
  }
}
