import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { FB_GRAPH_VERSION } from '@/lib/facebook-lead-connect';
import { decryptWaToken, WA_MESSAGES, type WaAccountDoc, type WaMessageDoc } from '@/lib/wa-accounts';

export const WA_CAMPAIGNS = 'wa_campaigns';
export const WA_CAMPAIGN_RECIPIENTS = 'wa_campaign_recipients';

/** Contactos por llamada a /run. Se envía en serie con pausa para no pasar de ~10 msg/s. */
export const CAMPAIGN_BATCH_SIZE = 25;
const SEND_PAUSE_MS = 120;
/** Tope de contactos por campaña mientras dura el piloto. */
export const CAMPAIGN_MAX_RECIPIENTS = 2000;

type GraphErr = { error?: { message?: string; code?: number; error_user_msg?: string } };

async function graphCall<T extends GraphErr>(
  path: string,
  token: string,
  init?: { method?: 'GET' | 'POST'; body?: Record<string, unknown> },
): Promise<T> {
  const res = await fetch(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${path}`, {
    method: init?.method ?? 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as T;
  if (!res.ok && !json.error) (json as GraphErr).error = { message: `HTTP ${res.status}` };
  return json;
}

function graphErrorText(e: GraphErr['error']): string {
  return (e?.error_user_msg || e?.message || 'Error de Meta').slice(0, 300);
}

// ─── Plantillas ──────────────────────────────────────────────────────────────

export type WaTemplate = {
  id?: string;
  name: string;
  status: string;
  category: string;
  language: string;
  bodyText: string;
  variables: number;
  rejectedReason?: string;
};

export function countTemplateVariables(text: string): number {
  const found = text.match(/\{\{\s*(\d+)\s*\}\}/g) ?? [];
  return found.length ? Math.max(...found.map((m) => Number(m.replace(/\D/g, '')))) : 0;
}

export async function listWaTemplates(acc: WaAccountDoc): Promise<{ templates: WaTemplate[]; error?: string }> {
  const token = decryptWaToken(acc);
  const json = await graphCall<
    GraphErr & {
      data?: Array<{
        id?: string;
        name: string;
        status: string;
        category: string;
        language: string;
        rejected_reason?: string;
        components?: Array<{ type: string; text?: string }>;
      }>;
    }
  >(`${acc.wabaId}/message_templates?fields=name,status,category,language,rejected_reason,components&limit=100`, token);
  if (json.error) return { templates: [], error: graphErrorText(json.error) };
  const templates = (json.data ?? []).map((t) => {
    const body = t.components?.find((c) => c.type === 'BODY')?.text ?? '';
    return {
      id: t.id,
      name: t.name,
      status: t.status,
      category: t.category,
      language: t.language,
      bodyText: body,
      variables: countTemplateVariables(body),
      rejectedReason: t.rejected_reason && t.rejected_reason !== 'NONE' ? t.rejected_reason : undefined,
    };
  });
  return { templates };
}

export async function createWaTemplate(
  acc: WaAccountDoc,
  input: { name: string; category: 'MARKETING' | 'UTILITY'; language: string; bodyText: string; examples: string[] },
): Promise<{ ok: boolean; status?: string; error?: string }> {
  const vars = countTemplateVariables(input.bodyText);
  const body: Record<string, unknown> = { type: 'BODY', text: input.bodyText };
  if (vars > 0) body.example = { body_text: [input.examples.slice(0, vars)] };
  const json = await graphCall<GraphErr & { status?: string }>(`${acc.wabaId}/message_templates`, decryptWaToken(acc), {
    method: 'POST',
    body: { name: input.name, category: input.category, language: input.language, components: [body] },
  });
  if (json.error) return { ok: false, error: graphErrorText(json.error) };
  return { ok: true, status: json.status ?? 'PENDING' };
}

// ─── Envío ───────────────────────────────────────────────────────────────────

/** Deja solo dígitos y quita ceros/+ iniciales. No inventa prefijos de país. */
export function normalizeWaPhone(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '').replace(/^0+/, '');
}

export async function sendWaTemplate(
  acc: WaAccountDoc,
  to: string,
  template: { name: string; language: string },
  params: string[],
): Promise<{ ok: boolean; wamid?: string; error?: string; code?: number }> {
  const json = await graphCall<GraphErr & { messages?: Array<{ id?: string }> }>(`${acc.phoneNumberId}/messages`, decryptWaToken(acc), {
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template.name,
        language: { code: template.language },
        ...(params.length
          ? { components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }] }
          : {}),
      },
    },
  });
  if (json.error) return { ok: false, error: graphErrorText(json.error), code: json.error.code };
  const wamid = json.messages?.[0]?.id;
  return wamid ? { ok: true, wamid } : { ok: false, error: 'Meta no devolvió id de mensaje' };
}

// ─── Campañas ────────────────────────────────────────────────────────────────

export type CampaignDoc = {
  _id?: ObjectId;
  resellerId: string;
  clientSlug: string;
  name: string;
  templateName: string;
  language: string;
  /** El revendedor confirma que los contactos dieron su consentimiento. */
  optInConfirmed: true;
  status: 'running' | 'done' | 'paused';
  total: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CampaignRecipient = {
  campaignId: ObjectId;
  phone: string;
  params: string[];
  status: 'pending' | 'sent' | 'failed';
  wamid?: string;
  error?: string;
  sentAt?: Date;
};

export async function createCampaign(opts: {
  resellerId: string;
  clientSlug: string;
  name: string;
  templateName: string;
  language: string;
  recipients: Array<{ phone: string; params: string[] }>;
}): Promise<{ campaignId: string; total: number; skipped: number }> {
  const db = await getMongoDb();
  const seen = new Set<string>();
  const valid: Array<{ phone: string; params: string[] }> = [];
  let skipped = 0;
  for (const r of opts.recipients) {
    const phone = normalizeWaPhone(r.phone);
    if (phone.length < 10 || phone.length > 15 || seen.has(phone)) {
      skipped++;
      continue;
    }
    seen.add(phone);
    valid.push({ phone, params: r.params });
  }
  const now = new Date();
  const campaign: CampaignDoc = {
    resellerId: opts.resellerId,
    clientSlug: opts.clientSlug,
    name: opts.name,
    templateName: opts.templateName,
    language: opts.language,
    optInConfirmed: true,
    status: valid.length ? 'running' : 'done',
    total: valid.length,
    createdAt: now,
    updatedAt: now,
  };
  const ins = await db.collection<CampaignDoc>(WA_CAMPAIGNS).insertOne(campaign);
  if (valid.length) {
    await db.collection<CampaignRecipient>(WA_CAMPAIGN_RECIPIENTS).insertMany(
      valid.map((r) => ({ campaignId: ins.insertedId, phone: r.phone, params: r.params, status: 'pending' as const })),
    );
    await db.collection(WA_CAMPAIGN_RECIPIENTS).createIndex({ campaignId: 1, status: 1 }).catch(() => undefined);
  }
  return { campaignId: ins.insertedId.toHexString(), total: valid.length, skipped };
}

export async function campaignProgress(campaignId: ObjectId) {
  const db = await getMongoDb();
  const rows = await db
    .collection(WA_CAMPAIGN_RECIPIENTS)
    .aggregate<{ _id: string; n: number }>([{ $match: { campaignId } }, { $group: { _id: '$status', n: { $sum: 1 } } }])
    .toArray();
  const by = Object.fromEntries(rows.map((r) => [r._id, r.n])) as Record<string, number>;
  return { pending: by.pending ?? 0, sent: by.sent ?? 0, failed: by.failed ?? 0 };
}

/** Envía un lote. Si Meta rechaza por límite/calidad se pausa la campaña para no seguir quemando el número. */
export async function runCampaignBatch(acc: WaAccountDoc, campaign: CampaignDoc & { _id: ObjectId }) {
  const db = await getMongoDb();
  const recipients = db.collection<CampaignRecipient>(WA_CAMPAIGN_RECIPIENTS);
  const batch = await recipients.find({ campaignId: campaign._id, status: 'pending' }).limit(CAMPAIGN_BATCH_SIZE).toArray();
  let paused = false;
  let lastError: string | undefined;

  for (const r of batch) {
    const out = await sendWaTemplate(acc, r.phone, { name: campaign.templateName, language: campaign.language }, r.params);
    const now = new Date();
    if (out.ok && out.wamid) {
      await recipients.updateOne({ _id: r._id }, { $set: { status: 'sent', wamid: out.wamid, sentAt: now } });
      await db.collection<WaMessageDoc>(WA_MESSAGES).insertOne({
        resellerId: campaign.resellerId,
        clientSlug: campaign.clientSlug,
        phoneNumberId: acc.phoneNumberId,
        direction: 'out',
        wamid: out.wamid,
        contact: r.phone,
        type: 'template',
        text: campaign.templateName,
        campaignId: campaign._id.toHexString(),
        status: 'sent',
        createdAt: now,
        updatedAt: now,
      });
    } else {
      lastError = out.error;
      await recipients.updateOne({ _id: r._id }, { $set: { status: 'failed', error: out.error } });
      // 130429 límite de velocidad, 131048/131056 spam o par con demasiados envíos, 131026 no entregable (ese solo cuenta como fallo)
      if (out.code === 130429 || out.code === 131048 || out.code === 131056 || out.code === 368) {
        paused = true;
        break;
      }
    }
    await new Promise((res) => setTimeout(res, SEND_PAUSE_MS));
  }

  const progress = await campaignProgress(campaign._id);
  const status: CampaignDoc['status'] = paused ? 'paused' : progress.pending === 0 ? 'done' : 'running';
  await db.collection(WA_CAMPAIGNS).updateOne({ _id: campaign._id }, { $set: { status, updatedAt: new Date() } });
  return { status, ...progress, lastError };
}
