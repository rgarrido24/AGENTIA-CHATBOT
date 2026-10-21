import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { isAddonEnabled } from '@/lib/client-addons';
import { notifyPortalNewLeadAfterInsert } from '@/lib/portal-push';
import {
  WA_FORMS,
  WA_FORM_RESPONSES,
  buildWaMeUrl,
  buildWhatsAppMessage,
  validateAnswers,
  type WaFormDoc,
  type WaFormResponseDoc,
} from '@/lib/wa-forms';

export const dynamic = 'force-dynamic';

type Ctx = { params: { slug: string } };

// Límite simple por IP y formulario (por instancia del servidor).
const HITS = new Map<string, { n: number; resetAt: number }>();
function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const e = HITS.get(key);
  if (!e || e.resetAt < now) {
    HITS.set(key, { n: 1, resetAt: now + windowMs });
    return true;
  }
  if (e.n >= limit) return false;
  e.n++;
  return true;
}

/** Devuelve el formulario solo si está activo, su cliente activo y el add-on encendido. */
async function loadPublicForm(slug: string) {
  const db = await getMongoDb();
  const form = await db.collection<WaFormDoc>(WA_FORMS).findOne({ publicSlug: slug, active: true });
  if (!form) return null;
  const client = await db.collection('leads').findOne(
    { _collection_type: 'reseller_client', resellerId: form.resellerId, clientSlug: form.clientSlug },
    { projection: { addons: 1, status: 1, nombre: 1 } },
  );
  if (!client || !isAddonEnabled(client, 'forms') || String(client.status || 'activo') !== 'activo') return null;
  return { form, clientName: client.nombre ? String(client.nombre) : '' };
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const found = await loadPublicForm(ctx.params.slug);
  if (!found) return NextResponse.json({ error: 'Formulario no disponible' }, { status: 404 });
  const { form, clientName } = found;
  return NextResponse.json({
    ok: true,
    title: form.title,
    description: form.description ?? '',
    fields: form.fields,
    submitText: form.submitText,
    clientName,
  });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!allow(`${ip}:${ctx.params.slug}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Demasiados envíos. Intenta más tarde.' }, { status: 429 });
  }
  const found = await loadPublicForm(ctx.params.slug);
  if (!found) return NextResponse.json({ error: 'Formulario no disponible' }, { status: 404 });
  const { form } = found;

  const body = (await req.json().catch(() => ({}))) as { answers?: Record<string, unknown>; website?: unknown };
  // Campo trampa para bots: las personas no lo ven ni lo llenan.
  if (typeof body.website === 'string' && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }
  const checked = validateAnswers(form, body.answers && typeof body.answers === 'object' ? body.answers : {});
  if ('error' in checked) return NextResponse.json({ error: checked.error }, { status: 400 });
  const { answers } = checked;

  const nameField = form.fields.find((f) => f.type === 'name');
  const phoneField = form.fields.find((f) => f.type === 'phone');
  const emailField = form.fields.find((f) => f.type === 'email');
  const nombre = (nameField && answers[nameField.id]) || 'Contacto de formulario';
  const telefono = phoneField ? (answers[phoneField.id] ?? '').replace(/\D/g, '') : '';

  const now = new Date();
  const leadId = `wf_${form.formId}_${now.getTime()}_${crypto.randomBytes(3).toString('hex')}`;
  const form_fields: Record<string, string> = {};
  for (const f of form.fields) if (answers[f.id]) form_fields[f.label] = answers[f.id];

  const db = await getMongoDb();
  const leadDoc = {
    leadId,
    clientId: form.resellerId,
    pageId: 'whatsapp-form',
    senderId: telefono || leadId,
    senderName: nombre,
    nombre,
    telefono: telefono || undefined,
    email: emailField ? answers[emailField.id] : undefined,
    platform: 'web',
    source: 'formulario-whatsapp',
    pipeline: 'agentia',
    canal_origen: 'formulario-whatsapp',
    form_id: form.formId,
    form_name: form.title,
    form_fields,
    resellerId: form.resellerId,
    clientSlug: form.clientSlug,
    lastMessage: `Formulario "${form.title}"`,
    lastMessageAt: now,
    tags: ['formulario-whatsapp'],
    status: 'nuevos',
    status_vendedor: 'nuevo',
    bot_status: 'active',
    messageCount: 1,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('leads').insertOne({ ...leadDoc });
  await db
    .collection('leads_backup')
    .insertOne({ ...leadDoc, backedUpAt: new Date(), source_collection: 'leads' })
    .catch((e) => console.error('[public-forms] backup:', e instanceof Error ? e.message : e));
  await db.collection<WaFormResponseDoc>(WA_FORM_RESPONSES).insertOne({
    formId: form.formId,
    resellerId: form.resellerId,
    clientSlug: form.clientSlug,
    leadId,
    answers,
    createdAt: now,
  });

  void notifyPortalNewLeadAfterInsert(leadId);

  const message = buildWhatsAppMessage(form, answers);
  return NextResponse.json({
    ok: true,
    thankYouText: form.thankYouText,
    whatsappUrl: buildWaMeUrl(form.whatsappNumber, message),
  });
}
