import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { authFormsRoute } from '@/lib/forms-route-auth';
import { WA_FORMS, WA_FORM_RESPONSES, csvEscape, type WaFormDoc, type WaFormResponseDoc } from '@/lib/wa-forms';

export const dynamic = 'force-dynamic';

type Ctx = { params: { resellerId: string; clientSlug: string; formId: string } };

/** Historial de respuestas. ?format=csv descarga todas en CSV (hasta 5000). */
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authFormsRoute(req, ctx.params);
  if (auth.error) return auth.error;
  const db = await getMongoDb();
  const form = await db.collection<WaFormDoc>(WA_FORMS).findOne({
    formId: ctx.params.formId,
    resellerId: ctx.params.resellerId,
    clientSlug: ctx.params.clientSlug,
  });
  if (!form) return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 });

  const csv = req.nextUrl.searchParams.get('format') === 'csv';
  const rows = await db
    .collection<WaFormResponseDoc>(WA_FORM_RESPONSES)
    .find({ formId: form.formId })
    .sort({ createdAt: -1 })
    .limit(csv ? 5000 : 100)
    .toArray();

  if (!csv) {
    return NextResponse.json({
      ok: true,
      fields: form.fields.map((f) => ({ id: f.id, label: f.label })),
      responses: rows.map((r) => ({ createdAt: r.createdAt, answers: r.answers })),
    });
  }

  const header = ['Fecha', ...form.fields.map((f) => f.label)].map(csvEscape).join(',');
  const lines = rows.map((r) =>
    [r.createdAt.toISOString(), ...form.fields.map((f) => r.answers[f.id] ?? '')].map(csvEscape).join(','),
  );
  // BOM para que Excel abra bien los acentos.
  const body = '﻿' + [header, ...lines].join('\r\n');
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="respuestas-${form.publicSlug}.csv"`,
    },
  });
}
