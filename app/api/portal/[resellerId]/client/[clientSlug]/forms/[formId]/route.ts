import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { authFormsRoute } from '@/lib/forms-route-auth';
import { WA_FORMS, sanitizeFormInput, type WaFormDoc } from '@/lib/wa-forms';

export const dynamic = 'force-dynamic';

type Ctx = { params: { resellerId: string; clientSlug: string; formId: string } };

function filterOf(p: Ctx['params']) {
  return { formId: p.formId, resellerId: p.resellerId, clientSlug: p.clientSlug };
}

/** Reemplaza la definición del formulario (el enlace público no cambia). */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await authFormsRoute(req, ctx.params);
  if (auth.error) return auth.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = sanitizeFormInput(body);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const db = await getMongoDb();
  const r = await db
    .collection<WaFormDoc>(WA_FORMS)
    .updateOne(filterOf(ctx.params), { $set: { ...parsed.value, updatedAt: new Date() } });
  if (r.matchedCount === 0) return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

/** Elimina el formulario. Las respuestas ya guardadas y los leads se conservan. */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await authFormsRoute(req, ctx.params);
  if (auth.error) return auth.error;
  const db = await getMongoDb();
  const r = await db.collection<WaFormDoc>(WA_FORMS).deleteOne(filterOf(ctx.params));
  if (r.deletedCount === 0) return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
