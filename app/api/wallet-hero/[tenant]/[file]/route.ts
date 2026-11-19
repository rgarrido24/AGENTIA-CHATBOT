import sharp from 'sharp';
import { tarroSvg } from '@/lib/gamificacion/tarro';

export const runtime = 'nodejs';

const COLORES: Record<string, string> = { tostichelas: '#E2573A' };

/** /api/wallet-hero/<tenant>/tarro-<etapa>-<total>.png → hero de Wallet 1032×336 (URL fija por etapa). */
export async function GET(_req: Request, { params }: { params: { tenant: string; file: string } }) {
  const m = /^tarro-(\d{1,2})-(\d{1,2})\.png$/.exec(params.file);
  const color = COLORES[params.tenant];
  if (!m || !color) return new Response('No encontrado', { status: 404 });
  const png = await sharp(Buffer.from(tarroSvg({ etapa: +m[1], total: +m[2], color }))).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
