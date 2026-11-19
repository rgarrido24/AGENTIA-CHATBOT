import { tarroSvg } from '@/lib/gamificacion/tarro';

export const runtime = 'nodejs';

/** Vista previa: todas las etapas del tarro (solo para revisar el diseño). */
export async function GET() {
  const items = Array.from({ length: 11 }, (_, i) => `<div><small>${i}/10</small>${tarroSvg({ etapa: i, total: 10, color: '#E2573A' })}</div>`).join('');
  return new Response(
    `<!doctype html><meta name=viewport content="width=device-width"><body style="margin:0;background:#111;color:#fff;font:14px sans-serif"><style>svg{width:100%;height:auto;display:block;border-radius:14px}div{margin:10px}</style>${items}`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
