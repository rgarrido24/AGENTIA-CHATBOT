import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { authWaRoute } from '@/lib/wa-route-auth';
import { WA_MESSAGES, type WaMessageDoc } from '@/lib/wa-accounts';
import { fetchWaMedia } from '@/lib/wa-media';

export const dynamic = 'force-dynamic';

type Ctx = { params: { resellerId: string; clientSlug: string; mediaId: string } };

/** Tipos que el navegador puede mostrar sin riesgo. Todo lo demás se descarga (nunca se ejecuta en nuestro dominio). */
const INLINE_OK = /^(image\/(jpeg|png|gif|webp)|audio\/[\w.+-]+|video\/(mp4|3gpp|webm)|application\/pdf)$/;

/**
 * Descarga un archivo de la bandeja desde Meta con el token del cliente y lo entrega al navegador.
 * Solo sirve archivos que pertenecen a ESTE cliente (están en sus mensajes).
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authWaRoute(req, ctx.params, true);
  if (auth.error) return auth.error;
  const { resellerId, clientSlug, mediaId } = ctx.params;
  if (!/^\d{5,30}$/.test(mediaId)) return NextResponse.json({ error: 'Archivo no válido' }, { status: 400 });

  const db = await getMongoDb();
  const msg = await db
    .collection<WaMessageDoc>(WA_MESSAGES)
    .findOne({ resellerId, clientSlug, 'media.id': mediaId }, { projection: { media: 1 } });
  if (!msg) return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });

  const got = await fetchWaMedia(auth.account!, mediaId);
  if (!got.ok) return NextResponse.json({ error: got.error }, { status: got.status });

  const declared = got.mime.split(';')[0].trim().toLowerCase();
  const inline = INLINE_OK.test(declared) && req.nextUrl.searchParams.get('download') !== '1';
  const filename = (msg.media?.filename || `archivo-${mediaId}`).replace(/[^\w.\- ]/g, '_').slice(0, 120);
  const headers: Record<string, string> = {
    'Content-Type': inline ? got.mime : 'application/octet-stream',
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
    'Cache-Control': 'private, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  };
  // El visor de PDF del navegador no funciona dentro de un sandbox; el resto sí va aislado.
  if (declared !== 'application/pdf') headers['Content-Security-Policy'] = "sandbox; default-src 'none'; img-src 'self' data:; media-src 'self'";

  // Safari/iPhone pide audio y video por rangos.
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '');
  const total = got.bytes.length;
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : Math.max(0, total - Number(range[2]));
    let end = range[1] && range[2] ? Number(range[2]) : total - 1;
    end = Math.min(end, total - 1);
    if (start > end || start >= total) {
      return new NextResponse(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${total}` } });
    }
    start = Math.max(0, start);
    const part = got.bytes.subarray(start, end + 1);
    return new NextResponse(new Uint8Array(part), {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': String(part.length) },
    });
  }
  return new NextResponse(new Uint8Array(got.bytes), { status: 200, headers: { ...headers, 'Content-Length': String(total) } });
}
