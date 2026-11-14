import { NextResponse } from 'next/server';
import { uploadPanelAttachment } from '@/lib/cloudinary-panel';

export const dynamic = 'force-dynamic';

const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + 10 * 60 * 1000 });
    return false;
  }
  h.n += 1;
  return h.n > 6;
}

/** POST multipart (campo "file") — normaliza a PNG cuadrado 512×512 y lo sube a Cloudinary. */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'x';
  if (limited(ip)) return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 });
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
    if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Máximo 4 MB' }, { status: 400 });
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      return NextResponse.json({ error: 'Usa PNG, JPG o WebP' }, { status: 400 });
    }
    const sharp = (await import('sharp')).default;
    const png = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const up = await uploadPanelAttachment(png, { folder: 'lealtad-logos', fileName: 'logo.png', mimeType: 'image/png' });
    return NextResponse.json({ ok: true, url: up.url });
  } catch (e) {
    console.error('[lealtad/logo]', e);
    return NextResponse.json({ error: 'No se pudo procesar el logo' }, { status: 500 });
  }
}
