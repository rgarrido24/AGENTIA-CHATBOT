import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME, type ResellerClient } from '@/lib/reseller-auth';
import { decryptFbToken } from '@/lib/fb-token-crypto';
import { createMetaTestLead } from '@/lib/facebook-test-lead';

export const dynamic = 'force-dynamic';

const MAX_FORMS = 5;

type RunForm = {
  formId: string;
  formName: string;
  created: boolean;
  error?: string;
};

async function authorize(req: NextRequest, resellerId: string) {
  const reseller = await verifyResellerCookie(req.cookies.get(COOKIE_NAME)?.value);
  return reseller && reseller.resellerId === resellerId ? reseller : null;
}

/** Crea un lead de prueba por cada formulario activo del cliente. */
export async function POST(
  req: NextRequest,
  { params }: { params: { resellerId: string; clientSlug: string } },
) {
  const { resellerId, clientSlug } = params;
  if (!(await authorize(req, resellerId))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db = await getMongoDb();
  const client = await db.collection<ResellerClient>('leads').findOne({
    resellerId,
    clientSlug,
    _collection_type: 'reseller_client',
  });
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const fb = client.fb_connection;
  if (!fb?.page_access_token || fb.status !== 'connected') {
    return NextResponse.json(
      { error: 'Este cliente no tiene Facebook conectado. Tocá Conectar Facebook primero.' },
      { status: 400 },
    );
  }

  const activeForms = (client.formularios || []).filter((f) => f.activo).slice(0, MAX_FORMS);
  if (!activeForms.length) {
    return NextResponse.json(
      { error: 'No hay ningún formulario activo en este cliente. Reconectá Facebook.' },
      { status: 400 },
    );
  }

  let token: string;
  try {
    token = decryptFbToken(fb.page_access_token);
  } catch {
    return NextResponse.json(
      { error: 'No se pudo leer el token guardado. Reconectá Facebook.' },
      { status: 400 },
    );
  }

  const startedAt = new Date();
  const forms: RunForm[] = [];
  for (const f of activeForms) {
    const formId = String(f.formId);
    const r = await createMetaTestLead(formId, token);
    forms.push({
      formId,
      formName: String(f.formName || formId),
      created: r.ok,
      ...(r.ok ? {} : { error: r.error }),
    });
  }

  const runId = randomUUID();
  await db.collection('fb_test_runs').insertOne({
    runId,
    resellerId,
    clientSlug,
    startedAt,
    forms,
    results: {},
  });

  return NextResponse.json({ ok: true, runId, forms });
}

/**
 * Consulta si ya llegó el lead de prueba de cada formulario.
 * Cuando llega, se borra solo para no dejar basura en el panel del cliente.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { resellerId: string; clientSlug: string } },
) {
  const { resellerId, clientSlug } = params;
  if (!(await authorize(req, resellerId))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const runId = String(req.nextUrl.searchParams.get('runId') || '').trim();
  if (!runId) return NextResponse.json({ error: 'Falta runId' }, { status: 400 });

  const db = await getMongoDb();
  const run = await db.collection('fb_test_runs').findOne({ runId, resellerId, clientSlug });
  if (!run) return NextResponse.json({ error: 'Prueba no encontrada' }, { status: 404 });

  const startedAt: Date = run.startedAt;
  const results: Record<string, { arrived: boolean; routed?: boolean; seconds?: number }> =
    { ...(run.results || {}) };
  const leads = db.collection('leads');

  for (const f of (run.forms || []) as RunForm[]) {
    if (!f.created || results[f.formId]) continue;
    const lead = await leads.findOne({
      es_prueba: true,
      form_id: f.formId,
      createdAt: { $gte: new Date(startedAt.getTime() - 10_000) },
    });
    if (!lead) continue;

    const seconds = Math.max(0, Math.round((Date.now() - startedAt.getTime()) / 1000));
    results[f.formId] = {
      arrived: true,
      routed: String(lead.clientSlug || '') === clientSlug,
      seconds,
    };
    await leads.deleteMany({ leadId: lead.leadId, es_prueba: true });
    await db.collection('leads_backup').deleteMany({ leadId: lead.leadId, es_prueba: true });
  }

  await db.collection('fb_test_runs').updateOne({ runId }, { $set: { results } });

  const forms = ((run.forms || []) as RunForm[]).map((f) => ({
    ...f,
    result: results[f.formId] || null,
  }));
  const pending = forms.filter((f) => f.created && !f.result).length;
  return NextResponse.json({ ok: true, done: pending === 0, forms });
}
