import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { authWaRoute, type WaRouteCtx } from '@/lib/wa-route-auth';
import { WA_MESSAGES } from '@/lib/wa-accounts';

export const dynamic = 'force-dynamic';

/**
 * Consumo del mes (?month=YYYY-MM, por defecto el actual): mensajes salientes por categoría de cobro
 * y por estado de entrega. Son conteos reales de Meta; el costo exacto es la factura de Meta.
 */
export async function GET(req: NextRequest, ctx: WaRouteCtx) {
  const auth = await authWaRoute(req, ctx.params);
  if (auth.error) return auth.error;

  const m = /^(\d{4})-(\d{2})$/.exec(req.nextUrl.searchParams.get('month') ?? '');
  const now = new Date();
  const year = m ? Number(m[1]) : now.getUTCFullYear();
  const month = m ? Number(m[2]) - 1 : now.getUTCMonth();
  const from = new Date(Date.UTC(year, month, 1));
  const to = new Date(Date.UTC(year, month + 1, 1));

  const db = await getMongoDb();
  const match = {
    resellerId: ctx.params.resellerId,
    clientSlug: ctx.params.clientSlug,
    direction: 'out',
    createdAt: { $gte: from, $lt: to },
  };
  const [byCategory, byStatus] = await Promise.all([
    db
      .collection(WA_MESSAGES)
      .aggregate<{ _id: string | null; messages: number; billable: number }>([
        { $match: match },
        {
          $group: {
            _id: '$pricingCategory',
            messages: { $sum: 1 },
            billable: { $sum: { $cond: [{ $eq: ['$billable', true] }, 1, 0] } },
          },
        },
      ])
      .toArray(),
    db
      .collection(WA_MESSAGES)
      .aggregate<{ _id: string | null; n: number }>([{ $match: match }, { $group: { _id: '$status', n: { $sum: 1 } } }])
      .toArray(),
  ]);

  return NextResponse.json({
    ok: true,
    month: `${year}-${String(month + 1).padStart(2, '0')}`,
    byCategory: byCategory.map((r) => ({ category: r._id ?? 'sin_dato_aun', messages: r.messages, billable: r.billable })),
    byStatus: Object.fromEntries(byStatus.map((r) => [r._id ?? 'sin_estado', r.n])),
  });
}
