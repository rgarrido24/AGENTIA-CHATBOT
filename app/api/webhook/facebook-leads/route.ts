import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getMongoDb } from '@/lib/mongodb';

// ─── Firma Meta (solo cuando viene cabecera x-hub-signature-256) ──────────────
function verifyMetaSignature(body: string, signature: string): boolean {
  const secret = process.env.FB_APP_SECRET;
  if (!secret) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── GET — Meta webhook verification ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  if (
    searchParams.get('hub.mode') === 'subscribe' &&
    searchParams.get('hub.verify_token') === process.env.FB_VERIFY_TOKEN
  ) {
    return new NextResponse(searchParams.get('hub.challenge'), { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ─── POST — Recibe leads de Meta Webhook O de Zapier (JSON plano) ─────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  console.log('[fb-leads] POST recibido, bytes:', rawBody.length);

  // Si llega firma de Meta, verificarla. Sin firma → Zapier/externo → continuar.
  const signature = req.headers.get('x-hub-signature-256');
  if (signature) {
    if (!verifyMetaSignature(rawBody, signature)) {
      console.error('[fb-leads] Firma Meta inválida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error('[fb-leads] JSON inválido:', rawBody.slice(0, 200));
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  console.log('[fb-leads] Payload:', JSON.stringify(payload).slice(0, 500));

  // Responder 200 inmediatamente y procesar en background
  processLead(payload).catch((err) => console.error('[fb-leads] Error al procesar:', err));
  return NextResponse.json({ ok: true });
}

/**
 * Respaldo permanente (solo lectura operativa): la colección `leads_backup` solo debe
 * recibir `insertOne` desde esta app — cero updates, cero deletes.
 * Cada copia conserva los campos del lead + `backedUpAt` + `source_collection`.
 */
async function insertLeadBackup(
  db: Awaited<ReturnType<typeof getMongoDb>>,
  snapshot: Record<string, unknown>
): Promise<void> {
  await db.collection('leads_backup').insertOne({
    ...snapshot,
    backedUpAt: new Date(),
    source_collection: 'leads',
  });
}

// ─── Lookup de reseller/cliente por formId ───────────────────────────────────
type ResellerMatch = { resellerId: string; clientSlug: string; alertNumber?: string } | null;

async function resolveResellerByFormId(formId: string): Promise<ResellerMatch> {
  if (!formId) return null;
  try {
    const db     = await getMongoDb();
    const client = await db.collection('leads').findOne({
      _collection_type:     'reseller_client',
      'formularios.formId': formId,
      'formularios.activo': true,
    });
    if (!client) return null;
    return {
      resellerId:  String(client.resellerId),
      clientSlug:  String(client.clientSlug),
      alertNumber: client.alertNumber ? String(client.alertNumber) : undefined,
    };
  } catch {
    return null;
  }
}

// ─── Normalización de teléfono ────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('54') && d.length >= 12) return d;
  if (d.length === 10) return `54${d}`;
  return d;
}

// ─── Router: detecta formato y deriva ────────────────────────────────────────
async function processLead(payload: Record<string, unknown>) {
  const isZapier =
    'full_name' in payload || 'phone_number' in payload || 'email' in payload ||
    'Nombre' in payload || 'Whatsapp' in payload || 'Email' in payload;

  if (isZapier) {
    await processZapierLead(payload);
  } else if (Array.isArray(payload.entry)) {
    await processMetaWebhook(payload);
  } else {
    console.warn('[fb-leads] Formato desconocido:', JSON.stringify(payload).slice(0, 200));
  }
}

// ─── Alerta WhatsApp al admin cuando llega un lead FB ────────────────────────
async function enqueueAdminAlert(
  db: Awaited<ReturnType<typeof getMongoDb>>,
  lead: {
    leadId:       string;
    clientId:     string;
    resellerMatch: { resellerId: string; clientSlug: string; alertNumber?: string } | null;
    dedupKey?:    string;
  }
) {
  const fromClient = lead.resellerMatch?.alertNumber?.trim();
  const alertNumber = fromClient || process.env.FB_ALERT_NUMBER;
  console.log(
    '[fb-leads] alerta WhatsApp:',
    fromClient
      ? `documento cliente (${lead.resellerMatch?.clientSlug})`
      : 'variable FB_ALERT_NUMBER (sin alertNumber en el cliente)',
    '→',
    alertNumber ?? '(no definido)'
  );
  if (!alertNumber) return;

  // Deduplicación: solo bloquear si ya existe OTRA ALERTA ADMIN para este leadId
  // (no confundir con el mensaje de bienvenida, que también lleva leadId)
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existing = await db.collection('outbound_messages').findOne(
    lead.dedupKey
      ? {
          source: 'admin-alert',
          dedupKey: lead.dedupKey,
          createdAt: { $gte: fiveMinAgo },
        }
      : {
          leadId: lead.leadId,
          source: 'admin-alert',
          createdAt: { $gte: fiveMinAgo },
        }
  );
  if (existing) {
    console.log(`[fb-leads] alerta bloqueada por duplicado — dedupKey/leadId: ${lead.dedupKey ?? lead.leadId}`);
    return;
  }

  const { resellerId, clientSlug } = lead.resellerMatch ?? { resellerId: '', clientSlug: '' };
  // WhatsApp/Facebook cachea el preview (Open Graph) por URL exacta.
  // Agregamos un cache-buster estable por leadId para que el logo/preview correcto se refresque.
  const portalUrl = resellerId && clientSlug
    ? `https://agentia.software/portal/${resellerId}/cliente/${clientSlug}?lid=${encodeURIComponent(lead.leadId)}`
    : `https://agentia.software/portal`;

  const message =
    `🚨 ATENCION🚨\n` +
    `¡Nuevo ingreso de LEAD!\n\n` +
    `Vistita tu panel para contactarlo👇\n` +
    portalUrl;

  await db.collection('outbound_messages').insertOne({
    senderId:  alertNumber,
    clientId:  lead.clientId,
    leadId:    lead.leadId,
    source:    'admin-alert',
    ...(lead.dedupKey ? { dedupKey: lead.dedupKey } : {}),
    message,
    createdAt: new Date(),
  });
  console.log(`[fb-leads] alerta encolada para ${alertNumber} → ${portalUrl}`);
}

// ─── Formato Zapier: JSON plano ───────────────────────────────────────────────
const ZAPIER_STANDARD_KEYS = new Set([
  'full_name','nombre','phone_number','phone','telefono','email','correo',
  'campaign_name','campaña','ad_name','anuncio','form_id','adset_name',
  'id','time','created_time',
  // Real Zapier format (capitalized/spaced keys)
  'Nombre','Whatsapp','Email','Form Id','Lead Id','Platform','Page Name','Form Name',
]);

async function processZapierLead(data: Record<string, unknown>) {
  console.log('[fb-leads/zapier] keys recibidos:', Object.keys(data).join(', '));

  const full_name     = String(data['Nombre']       ?? data.full_name     ?? data.nombre    ?? '').trim();
  // Try all known Whatsapp key variants from Zapier
  const phone_raw     = String(
    data['Whatsapp'] ?? data['whatsapp'] ?? data['WhatsApp'] ??
    data.phone_number ?? data.phone ?? data.telefono ?? ''
  ).trim();
  const email         = String(data['Email']        ?? data.email         ?? data.correo    ?? '').trim();
  const campaign_name = String(data.campaign_name   ?? data.campaña       ?? '').trim();
  const ad_name       = String(data.ad_name         ?? data.anuncio       ?? '').trim();
  const form_id       = String(data['Form Id']      ?? data.form_id       ?? '').trim();
  const adset_name    = String(data.adset_name      ?? '').trim();
  const lead_id_meta  = String(data['Lead Id']      ?? data['lead_id']    ?? '').trim();
  const platform_src  = String(data['Platform']     ?? 'facebook').trim();
  const page_name     = String(data['Page Name']    ?? '').trim();
  const form_name     = String(data['Form Name']    ?? '').trim();

  // Collect all non-standard fields as form_fields
  const form_fields: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!ZAPIER_STANDARD_KEYS.has(k) && v !== null && v !== undefined && v !== '') {
      form_fields[k] = String(v);
    }
  }

  console.log(`[fb-leads/zapier] nombre="${full_name}" tel="${phone_raw}" campaña="${campaign_name}"`);

  if (!phone_raw && !email && !full_name) {
    console.warn('[fb-leads/zapier] Sin datos de contacto, ignorando');
    return;
  }

  const clientId = process.env.FB_CLIENT_ID ?? 'agentia-ventas';
  const phone    = phone_raw ? normalizePhone(phone_raw) : '';
  // senderId: prefer real phone, then Zapier Lead Id, never Form Id
  const senderId = phone || (lead_id_meta ? `fb_lead_${lead_id_meta}` : `fb_ts_${Date.now()}`);
  // leadId: unique per submission — phone (or Lead Id) + timestamp
  const leadId   = `${senderId}_fb-zapier_${clientId}_${Date.now()}`;
  const now      = new Date();
  const db       = await getMongoDb();

  // Resolve reseller/client from form_id
  const resellerMatch = await resolveResellerByFormId(form_id);
  if (resellerMatch) {
    console.log(`[fb-leads/zapier] Reseller match: ${resellerMatch.resellerId}/${resellerMatch.clientSlug}`);
  } else if (form_id) {
    console.warn(`[fb-leads/zapier] form_id "${form_id}" no tiene reseller → resellerId: "unknown"`);
  }

  const leadDoc = {
    leadId,
    clientId,
    pageId:          'fb-zapier',
    senderId,
    senderName:      full_name    || undefined,
    nombre:          full_name    || undefined,
    telefono:        phone        || undefined,
    email:           email        || undefined,
    platform:        'facebook',
    source:          'facebook',
    source_meta:     true,
    pipeline:        'agentia',
    canal_origen:    'fb-ads',
    campana:         campaign_name || undefined,
    adset:           adset_name    || undefined,
    form_id:         form_id       || undefined,
    form_name:       form_name     || undefined,
    page_name:       page_name     || undefined,
    platform_src:    platform_src  || undefined,
    ...(Object.keys(form_fields).length > 0 ? { form_fields } : {}),
    resellerId:      resellerMatch?.resellerId  ?? 'unknown',
    clientSlug:      resellerMatch?.clientSlug  ?? undefined,
    lastMessage:     `Lead desde FB Ads — ${campaign_name || ad_name || 'Sin campaña'}`,
    lastMessageAt:   now,
    tags:            ['fb-ads', campaign_name].filter(Boolean),
    status:          'nuevos',
    status_vendedor: 'nuevo',
    bot_status:      'active',
    messageCount:    1,
    createdAt:       now,
    updatedAt:       now,
  };

  await db.collection('leads').insertOne(leadDoc);
  const savedZapier = await db.collection('leads').findOne({ leadId });
  if (savedZapier) {
    const snap = { ...savedZapier } as Record<string, unknown> & { _id?: unknown };
    delete snap._id;
    await insertLeadBackup(db, snap);
  }

  console.log(`[fb-leads/zapier] Lead insertado: ${leadId}`);

  // NO enviar ningún mensaje al lead. Solo alerta al admin (Luciano).
  const dedupKey = [
    'zapier',
    clientId,
    resellerMatch?.resellerId || 'unknown',
    resellerMatch?.clientSlug || 'unknown',
    form_id || 'noform',
    phone || senderId,
  ].join('|');
  await enqueueAdminAlert(db, { leadId, clientId, resellerMatch, dedupKey });
}

// ─── Formato Meta nativo (entry.changes[].field === 'leadgen') ────────────────
type FieldData = { name: string; values: string[] };

async function processMetaWebhook(payload: Record<string, unknown>) {
  const entries = (payload.entry as Array<Record<string, unknown>>) ?? [];
  const db = await getMongoDb();

  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];
    for (const change of changes) {
      if (change.field !== 'leadgen') continue;
      const value = change.value as Record<string, unknown>;

      const leadgen_id    = String(value.leadgen_id    ?? '');
      const form_id       = String(value.form_id       ?? '');
      const ad_id         = String(value.ad_id         ?? '');
      const ad_name       = String(value.ad_name       ?? '');
      const adset_name    = String(value.adset_name    ?? '');
      const campaign_name = String(value.campaign_name ?? '');
      const page_id       = String(value.page_id       ?? entry.id ?? '');

      const fieldData: FieldData[] = (value.field_data as FieldData[]) ?? [];
      const field = (name: string) => fieldData.find((f) => f.name === name)?.values?.[0] ?? '';

      const full_name = field('full_name') || field('nombre_completo') || field('name');
      const phone_raw = field('phone_number') || field('telefono') || field('phone');
      const email     = field('email') || field('correo');

      // Save ALL field_data entries (excluding the three standard ones)
      const STANDARD_META = new Set(['full_name','nombre_completo','name','phone_number','telefono','phone','email','correo']);
      const form_fields: Record<string, string> = {};
      for (const fd of fieldData) {
        if (!STANDARD_META.has(fd.name) && fd.values?.[0]) {
          form_fields[fd.name] = fd.values[0];
        }
      }

      if (!phone_raw && !email && !full_name) {
        console.warn('[fb-leads/meta] Sin datos en leadgen_id:', leadgen_id);
        continue;
      }

      const clientId      = process.env.FB_CLIENT_ID ?? 'agentia-ventas';
      const phone         = phone_raw ? normalizePhone(phone_raw) : '';
      const senderId      = phone || `fb_${leadgen_id}`;
      const leadId        = `${senderId}_${page_id}_${clientId}`;
      const now           = new Date();
      const resellerMatch = await resolveResellerByFormId(form_id);

      const result = await db.collection('leads').updateOne(
        { leadId },
        {
          $set: {
            senderName:    full_name || undefined,
            nombre:        full_name || undefined,
            telefono:      phone    || undefined,
            email:         email    || undefined,
            platform:      'facebook',
            source:        'facebook',
            source_meta:   true,
            pipeline:      'agentia',
            canal_origen:  'fb-ads',
            campana:       campaign_name || undefined,
            adset:         adset_name   || undefined,
            form_id:       form_id      || undefined,
            leadgen_id:    leadgen_id   || undefined,
            resellerId:    resellerMatch?.resellerId ?? 'unknown',
            clientSlug:    resellerMatch?.clientSlug ?? undefined,
            ...(Object.keys(form_fields).length > 0 ? { form_fields } : {}),
            lastMessage:   `Lead desde FB Ads — ${campaign_name || ad_name || 'Sin campaña'}`,
            lastMessageAt: now,
            tags:          ['fb-ads', campaign_name].filter(Boolean),
            updatedAt:     now,
          },
          $setOnInsert: {
            leadId,
            clientId,
            pageId:          page_id,
            senderId,
            status:          'nuevos',
            status_vendedor: 'nuevo',
            bot_status:      'active',
            createdAt:       now,
          },
          $inc: { messageCount: 1 },
        },
        { upsert: true }
      );

      // Respaldo solo en alta nueva (no en cada actualización del mismo leadId)
      if (result.upsertedCount > 0) {
        const saved = await db.collection('leads').findOne({ leadId });
        if (saved) {
          const snap = { ...saved } as Record<string, unknown> & { _id?: unknown };
          delete snap._id;
          await insertLeadBackup(db, snap);
        }
      }

      // NO enviar ningún mensaje al lead. Solo alerta al admin (Luciano).
      const dedupKey = [
        'meta',
        clientId,
        resellerMatch?.resellerId || 'unknown',
        resellerMatch?.clientSlug || 'unknown',
        form_id || 'noform',
        leadgen_id || senderId,
      ].join('|');
      await enqueueAdminAlert(db, { leadId, clientId, resellerMatch, dedupKey });

      console.log(`[fb-leads/meta] Lead guardado: ${leadId} | campaña: ${campaign_name}`);
    }
  }
}
