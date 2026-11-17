/**
 * Fotos del menú de un restaurante (las sube el dueño). Fábrica: `crearImagenApi(servidorCfg, apiBase)`.
 *   POST { pin, data: "data:image/jpeg;base64,..." } → { url }
 *   GET  ?id=<id>                                    → la imagen
 */
import { NextRequest, NextResponse } from 'next/server';
import { Binary, ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { crearAuth } from './auth';
import { colImagenes, type ServidorConfig } from './servidor';

const MAX_BYTES = 700_000;

export function crearImagenApi(cfg: ServidorConfig, apiBase: string) {
const COLL = colImagenes(cfg);
const { perfilDeRequest } = crearAuth(cfg);

async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (perfilDeRequest(req) !== 'dueno') return NextResponse.json({ error: 'PIN incorrecto' }, { status: 403 });
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ''));
    if (!m) return NextResponse.json({ error: 'Imagen no válida' }, { status: 400 });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > MAX_BYTES) return NextResponse.json({ error: 'La imagen pesa mucho, usa una más chica' }, { status: 413 });
    const db = await getMongoDb();
    const r = await db.collection(COLL).insertOne({ mime: m[1], data: new Binary(buf), ts: new Date() });
    return NextResponse.json({ url: `${apiBase}/imagen?id=${r.insertedId.toString()}` });
  } catch (e) {
    console.error(`[restaurante:${cfg.slug}/imagen POST]`, e);
    return NextResponse.json({ error: 'No se pudo guardar la imagen' }, { status: 500 });
  }
}

async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id') || '';
    if (!ObjectId.isValid(id)) return new NextResponse('No encontrada', { status: 404 });
    const db = await getMongoDb();
    const doc = await db.collection(COLL).findOne({ _id: new ObjectId(id) });
    if (!doc) return new NextResponse('No encontrada', { status: 404 });
    const buf = Buffer.from((doc.data as Binary).buffer);
    return new NextResponse(buf, {
      headers: { 'Content-Type': doc.mime, 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return new NextResponse('Error', { status: 500 });
  }
}

return { GET, POST };
}
