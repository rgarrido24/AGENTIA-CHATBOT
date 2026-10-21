import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { authWaRoute } from '@/lib/wa-route-auth';
import { WA_CAMPAIGNS, runCampaignBatch, type CampaignDoc } from '@/lib/wa-campaigns';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Ctx = { params: { resellerId: string; clientSlug: string; campaignId: string } };

/**
 * Envía un lote (25 contactos). El panel lo llama en bucle hasta que status sea done o paused.
 * Body opcional { resume: true } para reanudar una campaña pausada.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await authWaRoute(req, ctx.params, true);
  if (auth.error) return auth.error;
  if (!ObjectId.isValid(ctx.params.campaignId)) {
    return NextResponse.json({ error: 'Campaña inválida' }, { status: 400 });
  }
  const db = await getMongoDb();
  const campaign = await db.collection<CampaignDoc>(WA_CAMPAIGNS).findOne({
    _id: new ObjectId(ctx.params.campaignId),
    resellerId: ctx.params.resellerId,
    clientSlug: ctx.params.clientSlug,
  });
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { resume?: unknown };
  if (campaign.status === 'paused' && body.resume !== true) {
    return NextResponse.json({ error: 'La campaña está pausada (Meta limitó los envíos). Revisa la calidad del número antes de reanudar.', status: 'paused' }, { status: 409 });
  }
  if (campaign.status === 'done') return NextResponse.json({ ok: true, status: 'done', pending: 0 });

  const out = await runCampaignBatch(auth.account!, campaign as CampaignDoc & { _id: ObjectId });
  return NextResponse.json({ ok: true, ...out });
}
