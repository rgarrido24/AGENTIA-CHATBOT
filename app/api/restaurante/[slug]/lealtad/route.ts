/** API de lealtad de cualquier restaurante registrado en `lib/restaurantes/servidor.ts` (excepto Tostichelas, que conserva su ruta). */
import { NextRequest, NextResponse } from 'next/server';
import { crearLealtadApi } from '@/lib/restaurantes/api-lealtad';
import { servidorDe, type ServidorConfig } from '@/lib/restaurantes/servidor';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ slug: string }> };
const cache = new Map<string, ReturnType<typeof crearLealtadApi>>();

function apiDe(cfg: ServidorConfig) {
  let a = cache.get(cfg.slug);
  if (!a) {
    a = crearLealtadApi(cfg);
    cache.set(cfg.slug, a);
  }
  return a;
}

async function resolver(ctx: Ctx) {
  const { slug } = await ctx.params;
  const cfg = slug === 'tostichelas' ? null : servidorDe(slug);
  return cfg ? apiDe(cfg) : null;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const a = await resolver(ctx);
  return a ? a.GET(req) : NextResponse.json({ error: 'No encontrado' }, { status: 404 });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const a = await resolver(ctx);
  return a ? a.POST(req) : NextResponse.json({ error: 'No encontrado' }, { status: 404 });
}
