import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { authFormsRoute } from '@/lib/forms-route-auth';
import { WA_FORMS, WA_FORM_RESPONSES, ensureFormIndexes, newFormId, sanitizeFormInput, slugify, type WaFormDoc } from '@/lib/wa-forms';

export const dynamic = 'force-dynamic';

type Ctx = { params: { resellerId: string; clientSlug: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authFormsRoute(req, ctx.params);
  if (auth.error) return auth.error;
  const db = await getMongoDb();
  const forms = await db
    .collection<WaFormDoc>(WA_FORMS)
    .find({ resellerId: ctx.params.resellerId, clientSlug: ctx.params.clientSlug })
    .sort({ createdAt: -1 })
    .toArray();
  const counts = await db
    .collection(WA_FORM_RESPONSES)
    .aggregate<{ _id: string; n: number }>([
      { $match: { resellerId: ctx.params.resellerId, clientSlug: ctx.params.clientSlug } },
      { $group: { _id: '$formId', n: { $sum: 1 } } },
    ])
    .toArray();
  const byForm = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  return NextResponse.json({
    ok: true,
    forms: forms.map((f) => ({ ...f, _id: undefined, responses: byForm[f.formId] ?? 0 })),
  });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await authFormsRoute(req, ctx.params);
  if (auth.error) return auth.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = sanitizeFormInput(body);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await ensureFormIndexes();
  const now = new Date();
  const doc: WaFormDoc = {
    ...parsed.value,
    formId: newFormId(),
    publicSlug: slugify(parsed.value.title),
    resellerId: ctx.params.resellerId,
    clientSlug: ctx.params.clientSlug,
    createdAt: now,
    updatedAt: now,
  };
  const db = await getMongoDb();
  await db.collection<WaFormDoc>(WA_FORMS).insertOne(doc);
  return NextResponse.json({ ok: true, formId: doc.formId, publicSlug: doc.publicSlug });
}
