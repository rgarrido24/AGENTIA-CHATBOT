import { createHash } from 'crypto';
import { getMongoDb } from '@/lib/mongodb';

/** PIN efectivo por perfil: el que el dueño cambió en el sistema (guardado con hash) > variable de entorno > valor inicial. */
export type Rol = 'dueno' | 'caja' | 'mesero' | 'cocina';
export const ROLES_PIN: Rol[] = ['dueno', 'caja', 'mesero', 'cocina'];

const hash = (pin: string) => createHash('sha256').update('tostichelas:' + pin).digest('hex');
const env = (r: Rol): string | undefined =>
  ({
    dueno: process.env.TOSTICHELAS_PIN_DUENO || process.env.TOSTICHELAS_DUENO_PIN,
    caja: process.env.TOSTICHELAS_PIN_CAJA,
    mesero: process.env.TOSTICHELAS_PIN_MESERO,
    cocina: process.env.TOSTICHELAS_PIN_COCINA,
  })[r];
const inicial: Record<Rol, string> = { dueno: '2222', caja: '1111', mesero: '3333', cocina: '4444' };

async function guardados(): Promise<Record<string, string>> {
  const db = await getMongoDb();
  const d = await db.collection<any>('demo_tostichelas_estado').findOne({ _id: 'main' }, { projection: { pins: 1 } });
  return (d && d.pins) || {};
}

export async function pinOk(rol: Rol, pin: unknown): Promise<boolean> {
  if (typeof pin !== 'string' || !/^\d{4,8}$/.test(pin)) return false;
  const g = (await guardados())[rol];
  return g ? g === hash(pin) : pin === (env(rol) || inicial[rol]);
}

/** true si ese perfil todavía usa el PIN inicial (nadie lo ha cambiado). */
export async function pinPorDefecto(rol: Rol): Promise<boolean> {
  const g = (await guardados())[rol];
  return !g && !env(rol);
}

export async function cambiarPin(rol: Rol, nuevo: string): Promise<void> {
  const db = await getMongoDb();
  await db.collection<any>('demo_tostichelas_estado').updateOne({ _id: 'main' }, { $set: { ['pins.' + rol]: hash(nuevo) } }, { upsert: true });
}

/** Rechaza PINs obvios: repetidos, secuencias, los iniciales y los típicos. */
export function pinDebil(pin: string): boolean {
  if (/^(\d)\1+$/.test(pin)) return true;
  const asc = '0123456789012345678901', desc = '9876543210987654321';
  if (asc.includes(pin) || desc.includes(pin)) return true;
  return ['1111', '2222', '3333', '4444', '1234', '0000', '2580', '1212', '2020', '2026', '123456', '654321', '000000'].includes(pin);
}
