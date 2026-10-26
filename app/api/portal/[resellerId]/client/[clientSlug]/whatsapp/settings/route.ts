import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { authWaRoute, type WaRouteCtx } from '@/lib/wa-route-auth';
import { sanitizeSetting, type WaSettings } from '@/lib/wa-automation';

export const dynamic = 'force-dynamic';

const filter = (p: WaRouteCtx['params']) => ({ _collection_type: 'reseller_client' as const, resellerId: p.resellerId, clientSlug: p.clientSlug });

export async function GET(req: NextRequest, ctx: WaRouteCtx) {
  const auth = await authWaRoute(req, ctx.params);
  if (auth.error) return auth.error;
  const db = await getMongoDb();
  const c = await db.collection('leads').findOne(filter(ctx.params), { projection: { wa_settings: 1, alertNumber: 1 } });
  return NextResponse.json({ ok: true, settings: (c?.wa_settings ?? {}) as WaSettings, alertNumber: c?.alertNumber ? String(c.alertNumber) : '' });
}

/** Body: { welcome?: {enabled, templateName, language}, advisorAlert?: {...}, replyAlert?: {...} } */
export async function PUT(req: NextRequest, ctx: WaRouteCtx) {
  const auth = await authWaRoute(req, ctx.params, true);
  if (auth.error) return auth.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const $set: Record<string, unknown> = {};
  for (const key of ['welcome', 'advisorAlert', 'replyAlert'] as const) {
    if (!(key in body)) continue;
    const s = sanitizeSetting(body[key]);
    if (!s) return NextResponse.json({ error: `Configuración inválida en ${key}: elige una plantilla` }, { status: 400 });
    $set[`wa_settings.${key}`] = s;
  }
  if (!Object.keys($set).length) return NextResponse.json({ error: 'Nada que guardar' }, { status: 400 });
  const db = await getMongoDb();
  await db.collection('leads').updateOne(filter(ctx.params), { $set: { ...$set, updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
