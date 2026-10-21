import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { authWaRoute, type WaRouteCtx } from '@/lib/wa-route-auth';
import {
  CAMPAIGN_MAX_RECIPIENTS,
  WA_CAMPAIGNS,
  campaignProgress,
  createCampaign,
  countTemplateVariables,
  listWaTemplates,
  type CampaignDoc,
} from '@/lib/wa-campaigns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: WaRouteCtx) {
  const auth = await authWaRoute(req, ctx.params);
  if (auth.error) return auth.error;
  const db = await getMongoDb();
  const docs = await db
    .collection<CampaignDoc>(WA_CAMPAIGNS)
    .find({ resellerId: ctx.params.resellerId, clientSlug: ctx.params.clientSlug })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  const campaigns = await Promise.all(
    docs.map(async (c) => ({
      id: c._id!.toHexString(),
      name: c.name,
      templateName: c.templateName,
      status: c.status,
      total: c.total,
      createdAt: c.createdAt,
      ...(await campaignProgress(c._id!)),
    })),
  );
  return NextResponse.json({ ok: true, campaigns });
}

/**
 * Crea una campaña (no envía todavía; se envía con /campaigns/<id>/run).
 * Body: { name, templateName, language, optInConfirmed: true, recipients: [{ phone, params?: string[] }] }
 */
export async function POST(req: NextRequest, ctx: WaRouteCtx) {
  const auth = await authWaRoute(req, ctx.params, true);
  if (auth.error) return auth.error;

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (b.optInConfirmed !== true) {
    return NextResponse.json(
      { error: 'Debes confirmar que todos los contactos aceptaron recibir mensajes de este negocio' },
      { status: 400 },
    );
  }
  const name = String(b.name ?? '').trim();
  const templateName = String(b.templateName ?? '').trim();
  const rawRecipients = Array.isArray(b.recipients) ? b.recipients : [];
  if (!name || !templateName) {
    return NextResponse.json({ error: 'Faltan nombre de campaña o plantilla' }, { status: 400 });
  }
  if (rawRecipients.length === 0 || rawRecipients.length > CAMPAIGN_MAX_RECIPIENTS) {
    return NextResponse.json({ error: `Entre 1 y ${CAMPAIGN_MAX_RECIPIENTS} contactos por campaña` }, { status: 400 });
  }

  // La plantilla debe existir y estar aprobada: Meta rechaza el envío en cualquier otro estado.
  const tpls = await listWaTemplates(auth.account!);
  if (tpls.error) return NextResponse.json({ error: tpls.error }, { status: 502 });
  const tpl = tpls.templates.find((t) => t.name === templateName && (!b.language || t.language === b.language)) ??
    tpls.templates.find((t) => t.name === templateName);
  if (!tpl) return NextResponse.json({ error: 'Esa plantilla no existe en la cuenta del cliente' }, { status: 400 });
  if (tpl.status !== 'APPROVED') {
    return NextResponse.json({ error: `La plantilla está en estado ${tpl.status}; debe estar APPROVED` }, { status: 400 });
  }

  const vars = countTemplateVariables(tpl.bodyText);
  const recipients = rawRecipients.map((r) => {
    const o = (r ?? {}) as { phone?: unknown; params?: unknown };
    const params = Array.isArray(o.params) ? o.params.map((p) => String(p ?? '').trim()) : [];
    return { phone: String(o.phone ?? ''), params: params.slice(0, vars) };
  });
  if (vars > 0 && recipients.some((r) => r.params.length < vars || r.params.some((p) => !p))) {
    return NextResponse.json({ error: `La plantilla necesita ${vars} variable(s) para cada contacto` }, { status: 400 });
  }

  const out = await createCampaign({
    resellerId: ctx.params.resellerId,
    clientSlug: ctx.params.clientSlug,
    name,
    templateName: tpl.name,
    language: tpl.language,
    recipients,
  });
  return NextResponse.json({ ok: true, ...out });
}
