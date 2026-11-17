import { createHash } from 'crypto';
import { getMongoDb } from '@/lib/mongodb';
import { colEstado, type ServidorConfig } from './servidor';
import { ROLES_PIN, type Rol } from './tipos';

/**
 * PIN efectivo por perfil: el que el dueño cambió en el sistema (guardado con hash)
 * > variable de entorno `${ENV}_PIN_<ROL>` > valor inicial de la config.
 */
export { ROLES_PIN };
export type { Rol };

export function crearPins(cfg: ServidorConfig) {
  const hash = (pin: string) => createHash('sha256').update(cfg.salPin + pin).digest('hex');
  const env = (r: Rol): string | undefined => {
    const base = process.env[`${cfg.env}_PIN_${r.toUpperCase()}`];
    if (base) return base;
    if (r === 'dueno') for (const n of cfg.envLegacyDueno || []) if (process.env[n]) return process.env[n];
    return undefined;
  };

  async function guardados(): Promise<Record<string, string>> {
    const db = await getMongoDb();
    const d = await db.collection<any>(colEstado(cfg)).findOne({ _id: 'main' }, { projection: { pins: 1 } });
    return (d && d.pins) || {};
  }

  async function pinOk(rol: Rol, pin: unknown): Promise<boolean> {
    if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) return false;
    const g = (await guardados())[rol];
    return g ? g === hash(pin) : pin === (env(rol) || cfg.pinesIniciales[rol]);
  }

  /** true si ese perfil todavía usa el PIN inicial (nadie lo ha cambiado). */
  async function pinPorDefecto(rol: Rol): Promise<boolean> {
    const g = (await guardados())[rol];
    return !g && !env(rol);
  }

  async function cambiarPin(rol: Rol, nuevo: string): Promise<void> {
    const db = await getMongoDb();
    await db.collection<any>(colEstado(cfg)).updateOne({ _id: 'main' }, { $set: { ['pins.' + rol]: hash(nuevo) } }, { upsert: true });
  }

  return { pinOk, pinPorDefecto, cambiarPin };
}
