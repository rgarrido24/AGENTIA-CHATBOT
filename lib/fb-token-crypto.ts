import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;

function getKey(): Buffer {
  const raw =
    process.env.FB_TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.FB_APP_SECRET?.trim() ||
    '';
  if (!raw) {
    throw new Error('Falta FB_TOKEN_ENCRYPTION_KEY o FB_APP_SECRET para cifrar tokens');
  }
  return crypto.createHash('sha256').update(raw).digest();
}

/** Cifra un Page Access Token. Formato: iv:tag:ciphertext (hex). */
export function encryptFbToken(plain: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptFbToken(packed: string): string {
  const parts = String(packed || '').split(':');
  if (parts.length !== 3) throw new Error('Token cifrado inválido');
  const [ivH, tagH, dataH] = parts;
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivH, 'hex'));
  decipher.setAuthTag(Buffer.from(tagH, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataH, 'hex')), decipher.final()]).toString('utf8');
}

export function isEncryptedFbToken(value: string | undefined): boolean {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/i.test(p));
}
