import { NextRequest, NextResponse } from 'next/server';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';
import { authWaRoute, type WaRouteCtx } from '@/lib/wa-route-auth';
import { runAutomationTest } from '@/lib/wa-automation';

export const dynamic = 'force-dynamic';

/**
 * Prueba de los mensajes automáticos sin necesidad de un lead real. Solo el revendedor (cada envío cuesta).
 * Body: { phone, name? }  → bienvenida a ese teléfono + avisos al número de alertas del cliente.
 */
export async function POST(req: NextRequest, ctx: WaRouteCtx) {
  const reseller = await verifyResellerCookie(req.cookies.get(COOKIE_NAME)?.value);
  if (!reseller || reseller.resellerId !== ctx.params.resellerId) {
    return NextResponse.json({ error: 'Solo el administrador del panel puede hacer pruebas' }, { status: 403 });
  }
  const auth = await authWaRoute(req, ctx.params, true);
  if (auth.error) return auth.error;

  const b = (await req.json().catch(() => ({}))) as { phone?: unknown; name?: unknown };
  const phone = String(b.phone ?? '').trim();
  if (!phone) return NextResponse.json({ error: 'Escribe el teléfono al que quieres mandar la prueba' }, { status: 400 });
  const name = String(b.name ?? '').trim().slice(0, 40) || undefined;
  const results = await runAutomationTest({ resellerId: ctx.params.resellerId, clientSlug: ctx.params.clientSlug, phone, name });
  return NextResponse.json({ ok: results.every((r) => r.ok || r.skipped), results });
}
