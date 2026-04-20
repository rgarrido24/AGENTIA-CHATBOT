import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getMongoDb } from '@/lib/mongodb';

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.FB_APP_SECRET;
  if (!secret || !signature) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// GET — Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST — Receive lead events
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');

  if (!verifySignature(rawBody, signature)) {
    console.error('[fb-leads] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  // Respond 200 immediately — process async
  processLeads(payload).catch((err) => console.error('[fb-leads] Processing error:', err));
  return NextResponse.json({ ok: true });
}

type FieldData = { name: string; values: string[] };

async function processLeads(payload: Record<string, unknown>) {
  const entries = (payload.entry as Array<Record<string, unknown>>) ?? [];
  const db = await getMongoDb();

  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];
    for (const change of changes) {
      if (change.field !== 'leadgen') continue;
      const value = change.value as Record<string, unknown>;

      const leadgen_id = String(value.leadgen_id ?? '');
      const form_id = String(value.form_id ?? '');
      const ad_id = String(value.ad_id ?? '');
      const ad_name = String(value.ad_name ?? '');
      const adset_name = String(value.adset_name ?? '');
      const campaign_name = String(value.campaign_name ?? '');
      const page_id = String(value.page_id ?? entry.id ?? '');

      // Extract contact fields
      const fieldData: FieldData[] = (value.field_data as FieldData[]) ?? [];
      const field = (name: string) =>
        fieldData.find((f) => f.name === name)?.values?.[0] ?? '';

      const full_name = field('full_name') || field('nombre_completo') || field('name');
      const phone = field('phone_number') || field('telefono') || field('phone');
      const email = field('email') || field('correo');

      if (!phone && !email && !full_name) {
        console.warn('[fb-leads] No contact data in leadgen_id:', leadgen_id);
        continue;
      }

      const clientId = process.env.FB_CLIENT_ID ?? 'trafficker';
      const senderId = phone
        ? phone.replace(/\D/g, '').replace(/^52/, '') // normalize MX number
        : `fb_${leadgen_id}`;
      const leadId = `${senderId}_${page_id}_${clientId}`;
      const now = new Date();

      const leads = db.collection('leads');

      await leads.updateOne(
        { leadId },
        {
          $set: {
            senderName: full_name || undefined,
            platform: 'facebook',
            source: 'facebook' as const,
            source_meta: true,
            campana: campaign_name || undefined,
            adset: adset_name || undefined,
            form_id: form_id || undefined,
            leadgen_id: leadgen_id || undefined,
            lastMessage: `Lead desde Facebook Ads — ${campaign_name || ad_name || 'Sin nombre'}`,
            lastMessageAt: now,
            tags: ['fb-ads', campaign_name].filter(Boolean),
            updatedAt: now,
          },
          $setOnInsert: {
            leadId,
            clientId,
            pageId: page_id,
            senderId,
            status: 'nuevos',
            bot_status: 'active',
            messageCount: 0,
            createdAt: now,
          },
        },
        { upsert: true }
      );

      // Enqueue welcome WhatsApp message if phone available
      if (phone) {
        const normalizedPhone = (() => {
          const d = phone.replace(/\D/g, '');
          if (d.startsWith('52') && d.length === 12) return d;
          if (d.length === 10) return `52${d}`;
          return d;
        })();

        await db.collection('outbound_queue').insertOne({
          to: normalizedPhone,
          clientId,
          leadId,
          type: 'welcome_fb_lead',
          context: { full_name, campaign_name, ad_name, ad_id, form_id, leadgen_id },
          status: 'pending',
          attempts: 0,
          createdAt: now,
        });
      }

      console.log(`[fb-leads] Lead saved: ${leadId} | campaign: ${campaign_name} | phone: ${phone}`);
    }
  }
}
