import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getMongoDb } from '@/lib/mongodb';

// Only available in development OR when TEST_FORM_PASSWORD matches
function isAllowed(req: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const pwd = req.headers.get('x-test-password');
  const expected = process.env.TEST_FORM_PASSWORD;
  if (!expected) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(pwd ?? ''), Buffer.from(expected));
  } catch {
    return false;
  }
}

function buildMetaPayload(params: {
  nombre: string;
  telefono: string;
  email: string;
  campana: string;
  fuente: 'facebook' | 'instagram';
  pageId: string;
}) {
  return {
    object: 'page',
    entry: [
      {
        id: params.pageId,
        time: Date.now(),
        changes: [
          {
            field: 'leadgen',
            value: {
              leadgen_id: `test_${Date.now()}`,
              form_id: `form_test_${Date.now()}`,
              ad_id: `ad_test_001`,
              ad_name: `[TEST] Anuncio Demo`,
              adset_name: `[TEST] Conjunto de anuncios`,
              campaign_name: params.campana || '[TEST] Campaña Demo',
              page_id: params.pageId,
              field_data: [
                { name: 'full_name', values: [params.nombre] },
                { name: 'phone_number', values: [params.telefono] },
                ...(params.email ? [{ name: 'email', values: [params.email] }] : []),
              ],
            },
          },
        ],
      },
    ],
  };
}

export async function POST(req: NextRequest) {
  if (!isAllowed(req)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  const { nombre, telefono, email, campana, fuente } = body;
  if (!nombre || !telefono) {
    return NextResponse.json({ error: 'nombre y telefono son requeridos' }, { status: 400 });
  }

  const pageId = process.env.FB_TEST_PAGE_ID ?? 'test_page_001';
  const source = fuente === 'instagram' ? 'instagram' : 'facebook';
  const payload = buildMetaPayload({ nombre, telefono, email, campana, fuente: source, pageId });
  const payloadStr = JSON.stringify(payload);

  // Sign with FB_APP_SECRET (use dev fallback if not set)
  const secret = process.env.FB_APP_SECRET ?? 'dev_test_secret_agentia';
  const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

  // If no real secret, patch env temporarily so verifySignature passes
  const hadSecret = !!process.env.FB_APP_SECRET;
  if (!hadSecret) process.env.FB_APP_SECRET = 'dev_test_secret_agentia';

  // Call the real webhook endpoint internally
  const baseUrl = process.env.AGENTIA_CHATBOT_API_URL ?? `http://localhost:${process.env.PORT ?? 3010}`;
  let webhookStatus = 0;
  let webhookBody: unknown = null;
  try {
    const res = await fetch(`${baseUrl}/api/webhook/facebook-leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature,
      },
      body: payloadStr,
    });
    webhookStatus = res.status;
    webhookBody = await res.json();
  } catch (err) {
    if (!hadSecret) delete process.env.FB_APP_SECRET;
    return NextResponse.json({ error: `Webhook call failed: ${String(err)}` }, { status: 500 });
  }

  if (!hadSecret) delete process.env.FB_APP_SECRET;

  if (webhookStatus !== 200) {
    return NextResponse.json({ error: 'Webhook rejected', webhookBody }, { status: 502 });
  }

  // Wait briefly then fetch the saved lead
  await new Promise((r) => setTimeout(r, 800));

  const db = await getMongoDb();
  const clientId = process.env.FB_CLIENT_ID ?? 'trafficker';
  const normalizedPhone = (() => {
    const d = telefono.replace(/\D/g, '');
    if (d.startsWith('52') && d.length === 12) return d;
    if (d.length === 10) return `52${d}`;
    return d;
  })();

  const leadId = `${normalizedPhone}_${pageId}_${clientId}`;
  const lead = await db.collection('leads').findOne({ leadId });
  const queued = await db.collection('outbound_queue').findOne({ leadId }, { sort: { createdAt: -1 } });

  return NextResponse.json({ ok: true, lead, queued, webhookStatus });
}
