/** Verificación en 2 pasos (TOTP, RFC 6238) compatible con Google Authenticator, Authy, Microsoft Authenticator, etc. */
import { createHmac, randomBytes } from 'crypto';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PASO = 30;

export function base32(buf: Buffer): string {
  let bits = 0, val = 0, out = '';
  for (const b of buf) {
    val = (val << 8) | b; bits += 8;
    while (bits >= 5) { out += ABC[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += ABC[(val << (5 - bits)) & 31];
  return out;
}
function deBase32(s: string): Buffer {
  let bits = 0, val = 0;
  const out: number[] = [];
  for (const ch of s.replace(/=+$/, '').toUpperCase()) {
    const i = ABC.indexOf(ch); if (i < 0) continue;
    val = (val << 5) | i; bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

export const nuevoSecreto = () => base32(randomBytes(20));

export function codigoEn(secreto: string, paso: number): string {
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(Math.floor(paso / 0x100000000), 0);
  msg.writeUInt32BE(paso >>> 0, 4);
  const h = createHmac('sha1', deBase32(secreto)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1000000).padStart(6, '0');
}

/** Devuelve el paso (ventana de 30 s) en que el código es válido (±1), o null. `ultimo` evita reutilizar el mismo código. */
export function verificar(secreto: string, codigo: unknown, ultimo = 0, ahora = Date.now()): number | null {
  const c = String(codigo ?? '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(c)) return null;
  const actual = Math.floor(ahora / 1000 / PASO);
  for (const d of [0, -1, 1]) {
    const p = actual + d;
    if (p > ultimo && codigoEn(secreto, p) === c) return p;
  }
  return null;
}

export const uriOtp = (secreto: string, cuenta: string, emisor: string) =>
  `otpauth://totp/${encodeURIComponent(emisor)}:${encodeURIComponent(cuenta)}?secret=${secreto}&issuer=${encodeURIComponent(emisor)}&algorithm=SHA1&digits=6&period=${PASO}`;

/** Códigos de respaldo de un solo uso, formato XXXXX-XXXXX (sin letras confusas). */
export function codigosRespaldo(n = 8): string[] {
  const set = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: n }, () => {
    const b = randomBytes(10);
    const s = Array.from(b, (x) => set[x % set.length]).join('');
    return `${s.slice(0, 5)}-${s.slice(5)}`;
  });
}
