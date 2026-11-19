import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { getMongoDb } from '@/lib/mongodb';
import { colEstado, type ServidorConfig } from './servidor';
import { ROLES_PIN, type Rol } from './tipos';
import { setVerSesion } from './auth';
import { nuevoSecreto, uriOtp, verificar, codigosRespaldo } from './totp';

/**
 * PIN efectivo por perfil: el que el dueño cambió en el sistema (guardado con hash)
 * > variable de entorno `${ENV}_PIN_<ROL>` > valor inicial de la config.
 */
export { ROLES_PIN };
export type { Rol };

export function crearPins(cfg: ServidorConfig) {
  const hashViejo = (pin: string) => createHash('sha256').update(cfg.salPin + pin).digest('hex');
  const igual = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
  const scr = (pw: string, salt: Buffer) => scryptSync(pw, salt, 32, { N: 16384, r: 8, p: 1 });
  /** Hash actual: scrypt con sal propia por contraseña (`s2$sal$hash`). */
  const hash = (pw: string) => { const salt = randomBytes(16); return `s2$${salt.toString('base64')}$${scr(pw, salt).toString('base64')}`; };
  const coincide = (pw: string, g: string) => {
    if (g.startsWith('s2$')) { const [, s, h] = g.split('$'); const a = scr(pw, Buffer.from(s, 'base64')), b = Buffer.from(h, 'base64'); return a.length === b.length && timingSafeEqual(a, b); }
    return igual(g, hashViejo(pw));
  };
  const env = (r: Rol): string | undefined => {
    const base = process.env[`${cfg.env}_PIN_${r.toUpperCase()}`];
    if (base) return base;
    if (r === 'dueno') for (const n of cfg.envLegacyDueno || []) if (process.env[n]) return process.env[n];
    return undefined;
  };

  async function guardados(): Promise<Record<string, string>> {
    const db = await getMongoDb();
    const d = await db.collection<any>(colEstado(cfg)).findOne({ _id: 'main' }, { projection: { pins: 1 } });
    const p = (d && d.pins) || {};
    setVerSesion(cfg.slug, createHash('sha1').update(JSON.stringify(p)).digest('hex').slice(0, 8));
    return p;
  }

  let ultimaVer = 0;
  /** Mantiene al día (con 5 s de caché) la versión de contraseñas que usan los tokens de sesión. */
  async function refrescarVer(forzar?: boolean): Promise<void> {
    if (!forzar && Date.now() - ultimaVer < 5000) return;
    ultimaVer = Date.now();
    await guardados();
  }

  async function pinOk(rol: Rol, pin: unknown): Promise<boolean> {
    if (typeof pin !== 'string' || pin.length < 4 || pin.length > 64) return false;
    const g = (await guardados())[rol];
    if (!g) return igual(pin, env(rol) || cfg.pinesIniciales[rol]);
    if (!coincide(pin, g)) return false;
    if (!g.startsWith('s2$')) void cambiarPin(rol, pin).catch(() => {}); // sube el hash viejo al nuevo sin que nadie se entere
    return true;
  }

  /** true si ese perfil todavía usa el PIN inicial (nadie lo ha cambiado). */
  async function pinPorDefecto(rol: Rol): Promise<boolean> {
    const g = (await guardados())[rol];
    return !g && !env(rol);
  }

  async function cambiarPin(rol: Rol, nuevo: string): Promise<void> {
    const db = await getMongoDb();
    await db.collection<any>(colEstado(cfg)).updateOne({ _id: 'main' }, { $set: { ['pins.' + rol]: hash(nuevo) } }, { upsert: true });
    await guardados();
  }

  /**
   * Política de contraseñas. Devuelve el motivo si no cumple, o null si está bien.
   * Dueño: mínimo 10 caracteres con letras y números. Resto del equipo: mínimo 6, también letras y números.
   */
  function claveDebil(rol: Rol, pw: string): string | null {
    if (typeof pw !== 'string' || pw.length > 64) return 'La contraseña es demasiado larga (máximo 64)';
    const min = rol === 'dueno' ? 10 : 6;
    if (pw.length < min) return `Mínimo ${min} caracteres${rol === 'dueno' ? ' en la del dueño' : ''}`;
    if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Debe llevar letras y números';
    if (/^(.)\1+$/.test(pw)) return 'Esa contraseña es muy fácil de adivinar (caracteres repetidos)';
    const l = pw.toLowerCase();
    const iniciales = (Object.values(cfg.pinesIniciales || {}) as string[]).map((x) => String(x).toLowerCase());
    const tipicas = ['password', 'contrasena', 'contraseña', 'qwerty', 'abc123', '123456', 'admin', cfg.slug.toLowerCase(), 'agentia'];
    if (iniciales.includes(l) || tipicas.some((t) => l.includes(t)) || /(0123|1234|2345|3456|4567|5678|6789)/.test(l)) return 'Esa contraseña es muy fácil de adivinar. Elige otra';
    return null;
  }

  /** Contraseña vieja que ya no cumple la política (p. ej. 4 números): se le pide cambiarla. */
  const debilLogin = (rol: Rol, pw: string) => claveDebil(rol, pw) !== null;

  // ---- verificación en 2 pasos (solo dueño) ----
  type Dos = { on?: boolean; secret?: string; pend?: string; last?: number; rec?: string[] };
  const hRec = (c: string) => createHash('sha256').update(cfg.salPin + 'rec:' + c.replace(/[\s-]/g, '').toUpperCase()).digest('hex');
  async function dosLeer(): Promise<Dos> {
    const db = await getMongoDb();
    const d = await db.collection<any>(colEstado(cfg)).findOne({ _id: 'main' }, { projection: { totp: 1 } });
    return (d && d.totp) || {};
  }
  async function dosGuardar(t: Dos) {
    const db = await getMongoDb();
    await db.collection<any>(colEstado(cfg)).updateOne({ _id: 'main' }, { $set: { totp: t } }, { upsert: true });
  }
  /** Reseteo de emergencia: poner `${ENV}_RESET_2FA=1` en el servidor apaga el segundo paso. */
  const dosForzadoOff = () => process.env[`${cfg.env}_RESET_2FA`] === '1';
  async function dosActivo() { return !dosForzadoOff() && !!(await dosLeer()).on; }
  async function dosEstado() { const t = await dosLeer(); return { on: !dosForzadoOff() && !!t.on, respaldo: (t.rec || []).length, forzadoOff: dosForzadoOff() }; }
  async function dosIniciar() {
    const secret = nuevoSecreto();
    const t = await dosLeer();
    await dosGuardar({ ...t, pend: secret });
    return { secret, uri: uriOtp(secret, 'Dueño', cfg.nombre || cfg.slug) };
  }
  async function dosActivar(code: unknown): Promise<string[] | null> {
    const t = await dosLeer();
    if (!t.pend) return null;
    const p = verificar(t.pend, code, 0);
    if (p === null) return null;
    const codes = codigosRespaldo(8);
    await dosGuardar({ on: true, secret: t.pend, last: p, rec: codes.map(hRec) });
    return codes;
  }
  /** Código de la app o un código de respaldo (de un solo uso). */
  async function dosVerificar(code: unknown): Promise<boolean> {
    const t = await dosLeer();
    if (!t.on || !t.secret) return false;
    const p = verificar(t.secret, code, t.last || 0);
    if (p !== null) { await dosGuardar({ ...t, last: p }); return true; }
    const c = String(code ?? '').trim();
    if (/^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/.test(c)) {
      const h = hRec(c);
      if ((t.rec || []).includes(h)) { await dosGuardar({ ...t, rec: (t.rec || []).filter((x) => x !== h) }); return true; }
    }
    return false;
  }
  async function dosApagar() { await dosGuardar({}); }

  return { refrescarVer, pinOk, pinPorDefecto, cambiarPin, claveDebil, debilLogin, dosActivo, dosEstado, dosIniciar, dosActivar, dosVerificar, dosApagar };
}
