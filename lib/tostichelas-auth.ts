import { createHmac, createHash, timingSafeEqual } from 'crypto';
import { getMongoDb } from '@/lib/mongodb';
import type { NextRequest } from 'next/server';

/**
 * Sesiones del equipo de Tostichelas: al meter el PIN correcto el servidor entrega un token firmado
 * (HMAC) con el perfil y una caducidad. Las rutas de datos lo exigen; los clientes (sin token) solo
 * ven y escriben lo suyo.
 */
export type Perfil = 'dueno' | 'caja' | 'mesero' | 'cocina';
const TTL_MS = 14 * 60 * 60 * 1000;

const secret = () =>
  process.env.TOSTICHELAS_SECRET ||
  createHash('sha256').update('tostichelas-v2:' + (process.env.MONGODB_URI || '') + (process.env.ADMIN_PASSWORD || '')).digest('hex');
const mac = (s: string) => createHmac('sha256', secret()).update(s).digest('hex').slice(0, 32);

export function firmarToken(rol: Perfil): string {
  const exp = Date.now() + TTL_MS;
  return `${rol}.${exp}.${mac(`${rol}.${exp}`)}`;
}

export function perfilDeToken(tok: unknown): Perfil | null {
  if (typeof tok !== 'string') return null;
  const [rol, exp, firma] = tok.split('.');
  if (!['dueno', 'caja', 'mesero', 'cocina'].includes(rol) || !firma) return null;
  if (!(Number(exp) > Date.now())) return null;
  const esperado = mac(`${rol}.${exp}`);
  const a = Buffer.from(firma), b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return rol as Perfil;
}

export const perfilDeRequest = (req: NextRequest): Perfil | null => perfilDeToken(req.headers.get('x-tos-token'));

/** El dueño puede todo; los demás solo lo suyo. */
export const puede = (perfil: Perfil | null, ...permitidos: Perfil[]) =>
  !!perfil && (perfil === 'dueno' || permitidos.includes(perfil));

/** Token de mesa para el QR: no se puede adivinar sin el secreto. */
export const tokenMesa = (k: string) => mac('mesa:' + k).slice(0, 10);

/* ---- bloqueo contra adivinar PIN ---- */
const COLL_INT = 'demo_tostichelas_intentos';
const MAX_FALLOS = 6;
const BLOQUEO_MS = 15 * 60 * 1000;
export const ipDe = (req: NextRequest) => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'x';

export async function bloqueado(ip: string): Promise<boolean> {
  const db = await getMongoDb();
  const d = await db.collection<any>(COLL_INT).findOne({ _id: ip });
  return !!d && d.hasta > Date.now();
}
export async function registrarFallo(ip: string) {
  const db = await getMongoDb();
  const c = db.collection<any>(COLL_INT);
  const d = await c.findOne({ _id: ip });
  const reciente = d && Date.now() - d.ts < BLOQUEO_MS;
  const n = (reciente ? d.n : 0) + 1;
  await c.updateOne({ _id: ip }, { $set: { n, ts: Date.now(), hasta: n >= MAX_FALLOS ? Date.now() + BLOQUEO_MS : 0 } }, { upsert: true });
}
export async function limpiarFallos(ip: string) {
  const db = await getMongoDb();
  await db.collection<any>(COLL_INT).deleteOne({ _id: ip });
}
