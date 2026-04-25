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

// ─── Normalización de teléfono ────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('54') && d.length >= 12) return d;
  if (d.length === 10) return `54${d}`;
  return d;
}

// ─── Router: detecta formato y deriva ────────────────────────────────────────
async function processLead(payload: Record<string, unknown>) {
  const isZapier = 'full_name' in payload || 'phone_number' in payload || 'email' in payload;

  if (isZapier) {
    await processZapierLead(payload);
  } else if (Array.isArray(payload.entry)) {
    await processMetaWebhook(payload);
  } else {
    console.warn('[fb-leads] Formato desconocido:', JSON.stringify(payload).slice(0, 200));
  }
}

// ─── Formato Zapier: JSON plano ───────────────────────────────────────────────
const ZAPIER_STANDARD_KEYS = new Set([
  'full_name','nombre','phone_number','phone','telefono','email','correo',
  'campaign_name','campaña','ad_name','anuncio','form_id','adset_name',
  'id','time','created_time',
]);

async function processZapierLead(data: Record<string, unknown>) {
  const full_name     = String(data.full_name     ?? data.nombre    ?? '').trim();
  const phone_raw     = String(data.phone_number  ?? data.phone     ?? data.telefono ?? '').trim();
  const email         = String(data.email         ?? data.correo    ?? '').trim();
  const campaign_name = String(data.campaign_name ?? data.campaña   ?? '').trim();
  const ad_name       = String(data.ad_name       ?? data.anuncio   ?? '').trim();
  const form_id       = String(data.form_id       ?? '').trim();
  const adset_name    = String(data.adset_name    ?? '').trim();

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
  const senderId = phone || `fb_form_${form_id || Date.now()}`;
  const leadId   = `${senderId}_fb-zapier_${clientId}`;
  const now      = new Date();
  const db       = await getMongoDb();

  await db.collection('leads').updateOne(
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
        ...(Object.keys(form_fields).length > 0 ? { form_fields } : {}),
        lastMessage:   `Lead desde FB Ads — ${campaign_name || ad_name || 'Sin campaña'}`,
        lastMessageAt: now,
        tags:          ['fb-ads', campaign_name].filter(Boolean),
        updatedAt:     now,
      },
      $setOnInsert: {
        leadId,
        clientId,
        pageId:          'fb-zapier',
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

  console.log(`[fb-leads/zapier] Lead guardado: ${leadId}`);

  if (phone) {
    await db.collection('outbound_queue').insertOne({
      to:        phone,
      clientId,
      leadId,
      type:      'welcome_fb_lead',
      context:   { full_name, campaign_name, ad_name, form_id },
      status:    'pending',
      attempts:  0,
      createdAt: now,
    });
    console.log(`[fb-leads/zapier] Bienvenida encolada para ${phone}`);
  }
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

      const clientId = process.env.FB_CLIENT_ID ?? 'agentia-ventas';
      const phone    = phone_raw ? normalizePhone(phone_raw) : '';
      const senderId = phone || `fb_${leadgen_id}`;
      const leadId   = `${senderId}_${page_id}_${clientId}`;
      const now      = new Date();

      await db.collection('leads').updateOne(
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

      if (phone) {
        await db.collection('outbound_queue').insertOne({
          to: phone, clientId, leadId,
          type:      'welcome_fb_lead',
          context:   { full_name, campaign_name, ad_name, ad_id, form_id, leadgen_id },
          status:    'pending',
          attempts:  0,
          createdAt: now,
        });
      }

      console.log(`[fb-leads/meta] Lead guardado: ${leadId} | campaña: ${campaign_name}`);
    }
  }
}
