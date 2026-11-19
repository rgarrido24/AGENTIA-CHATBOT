import { createHmac, createHash, timingSafeEqual } from 'crypto';
import { getMongoDb } from '@/lib/mongodb';
import type { NextRequest } from 'next/server';
import { colIntentos, type ServidorConfig } from './servidor';
import type { Rol } from './tipos';

/**
 * Sesiones del equipo: al meter el PIN correcto el servidor entrega un token firmado (HMAC) con el
 * perfil y una caducidad. Las rutas de datos lo exigen; los clientes (sin token) solo ven y escriben
 * lo suyo. Un token de un restaurante NO sirve en otro (el secreto lleva la sal del restaurante).
 */
export type Perfil = Rol;
const TTL_MS = 14 * 60 * 60 * 1000;
const MAX_FALLOS = 6;
const BLOQUEO_MS = 15 * 60 * 1000;
const PERFILES = ['dueno', 'caja', 'mesero', 'cocina'];

export const ipDe = (req: NextRequest) => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'x';

/** El dueño puede todo; los demás solo lo suyo. */
export const puede = (perfil: Perfil | null, ...permitidos: Perfil[]) =>
  !!perfil && (perfil === 'dueno' || permitidos.includes(perfil));

export function crearAuth(cfg: ServidorConfig) {
  const secret = () =>
    process.env[`${cfg.env}_SECRET`] ||
    createHash('sha256').update(cfg.salSecreto + (process.env.MONGODB_URI || '') + (process.env.ADMIN_PASSWORD || '')).digest('hex');
  const mac = (s: string) => createHmac('sha256', secret()).update(s).digest('hex').slice(0, 32);

  function firmarToken(rol: Perfil): string {
    const exp = Date.now() + TTL_MS;
    return `${rol}.${exp}.${mac(`${rol}.${exp}`)}`;
  }

  function perfilDeToken(tok: unknown): Perfil | null {
    if (typeof tok !== 'string') return null;
    const [rol, exp, firma] = tok.split('.');
    if (!PERFILES.includes(rol) || !firma) return null;
    if (!(Number(exp) > Date.now())) return null;
    const esperado = mac(`${rol}.${exp}`);
    const a = Buffer.from(firma), b = Buffer.from(esperado);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return rol as Perfil;
  }

  const perfilDeRequest = (req: NextRequest): Perfil | null => perfilDeToken(req.headers.get('x-tos-token'));

  /** Token de mesa para el QR: no se puede adivinar sin el secreto. */
  const tokenMesa = (k: string) => mac('mesa:' + k).slice(0, 10);

  /** Boleto de 5 minutos entre la contraseña correcta y el código de 2 pasos. */
  function firmarBoleto(rol: Perfil): string {
    const exp = Date.now() + 5 * 60 * 1000;
    return `2fa.${rol}.${exp}.${mac(`2fa.${rol}.${exp}`)}`;
  }
  function rolDeBoleto(t: unknown): Perfil | null {
    if (typeof t !== 'string') return null;
    const [k, rol, exp, firma] = t.split('.');
    if (k !== '2fa' || !PERFILES.includes(rol) || !firma || !(Number(exp) > Date.now())) return null;
    const a = Buffer.from(firma), b = Buffer.from(mac(`2fa.${rol}.${exp}`));
    return a.length === b.length && timingSafeEqual(a, b) ? (rol as Perfil) : null;
  }

  async function bloqueado(ip: string): Promise<boolean> {
    const db = await getMongoDb();
    const d = await db.collection<any>(colIntentos(cfg)).findOne({ _id: ip });
    return !!d && d.hasta > Date.now();
  }
  async function registrarFallo(ip: string, max = MAX_FALLOS) {
    const db = await getMongoDb();
    const c = db.collection<any>(colIntentos(cfg));
    const d = await c.findOne({ _id: ip });
    const reciente = d && Date.now() - d.ts < BLOQUEO_MS;
    const n = (reciente ? d.n : 0) + 1;
    await c.updateOne({ _id: ip }, { $set: { n, ts: Date.now(), hasta: n >= max ? Date.now() + BLOQUEO_MS : 0 } }, { upsert: true });
  }
  async function limpiarFallos(ip: string) {
    const db = await getMongoDb();
    await db.collection<any>(colIntentos(cfg)).deleteOne({ _id: ip });
  }

  return { firmarBoleto, rolDeBoleto, firmarToken, perfilDeToken, perfilDeRequest, tokenMesa, bloqueado, registrarFallo, limpiarFallos };
}

export type Auth = ReturnType<typeof crearAuth>;
