import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { Binary } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';

export const COTIZACION_PUBLIC_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const PUBLIC_DIR = path.join(process.cwd(), 'public', 'cotizaciones');

type PublicPdfDoc = {
  token: string;
  folio: string;
  expiresAt: Date;
  createdAt: Date;
  pdf: Binary;
  fileName: string;
};

function siteBaseUrl(): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/$/, '');
  if (env) return env;
  return 'https://agentia.software';
}

export function publicCotizacionUrl(token: string): string {
  const t = token.replace(/\.pdf$/i, '');
  return `${siteBaseUrl()}/cotizaciones/${t}.pdf`;
}

export function normalizePublicToken(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\.pdf$/i, '')
    .toLowerCase();
}

async function ensurePublicDir() {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
}

async function tryWritePublicFile(token: string, pdf: Buffer): Promise<boolean> {
  try {
    await ensurePublicDir();
    await fs.writeFile(path.join(PUBLIC_DIR, `${token}.pdf`), pdf);
    return true;
  } catch {
    return false;
  }
}

async function tryReadPublicFile(token: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(PUBLIC_DIR, `${token}.pdf`));
  } catch {
    return null;
  }
}

async function tryDeletePublicFile(token: string): Promise<void> {
  try {
    await fs.unlink(path.join(PUBLIC_DIR, `${token}.pdf`));
  } catch {
    /* ignore */
  }
}

/** Elimina PDFs públicos vencidos (Mongo + disco). */
export async function purgeExpiredPublicCotizacionPdfs(): Promise<number> {
  const db = await getMongoDb();
  const coll = db.collection<PublicPdfDoc>('cwf_cotizacion_public_pdfs');
  const now = new Date();
  const expired = await coll.find({ expiresAt: { $lte: now } }).project({ token: 1 }).toArray();
  for (const doc of expired) {
    await tryDeletePublicFile(doc.token);
  }
  const result = await coll.deleteMany({ expiresAt: { $lte: now } });
  return result.deletedCount ?? 0;
}

export type PublishPublicPdfResult = {
  token: string;
  publicUrl: string;
  expiresAt: Date;
};

/** Guarda PDF público con token UUID (disco best-effort + Mongo). */
export async function publishCotizacionPdf(params: {
  folio: string;
  pdf: Buffer;
}): Promise<PublishPublicPdfResult> {
  await purgeExpiredPublicCotizacionPdfs().catch(() => 0);

  const token = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + COTIZACION_PUBLIC_TTL_MS);
  const fileName = `cotizacion-${params.folio}.pdf`;

  await tryWritePublicFile(token, params.pdf);

  const db = await getMongoDb();
  await db.collection<PublicPdfDoc>('cwf_cotizacion_public_pdfs').insertOne({
    token,
    folio: params.folio,
    expiresAt,
    createdAt: now,
    pdf: new Binary(params.pdf),
    fileName,
  });

  // Actualiza metadatos en la cotización
  await db.collection('cwf_cotizaciones').updateOne(
    { folio: params.folio },
    {
      $set: {
        publicToken: token,
        publicUrl: publicCotizacionUrl(token),
        publicExpiresAt: expiresAt,
        updatedAt: now,
      },
    },
  );

  return {
    token,
    publicUrl: publicCotizacionUrl(token),
    expiresAt,
  };
}

/** Sirve PDF público si el token es válido y no expiró. */
export async function getPublicCotizacionPdf(
  rawToken: string,
): Promise<{ buffer: Buffer; fileName: string } | null> {
  const token = normalizePublicToken(rawToken);
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return null;

  await purgeExpiredPublicCotizacionPdfs().catch(() => 0);

  const fromDisk = await tryReadPublicFile(token);
  const db = await getMongoDb();
  const doc = await db.collection<PublicPdfDoc>('cwf_cotizacion_public_pdfs').findOne({ token });

  if (!doc) {
    if (fromDisk) await tryDeletePublicFile(token);
    return null;
  }

  if (doc.expiresAt.getTime() <= Date.now()) {
    await tryDeletePublicFile(token);
    await db.collection('cwf_cotizacion_public_pdfs').deleteOne({ token });
    return null;
  }

  if (fromDisk) {
    return { buffer: fromDisk, fileName: doc.fileName || `cotizacion-${doc.folio}.pdf` };
  }

  const buf = Buffer.from(doc.pdf.buffer);
  // Rehidrata disco si es posible (para servir estático en próximos hits)
  await tryWritePublicFile(token, buf);
  return { buffer: buf, fileName: doc.fileName || `cotizacion-${doc.folio}.pdf` };
}
