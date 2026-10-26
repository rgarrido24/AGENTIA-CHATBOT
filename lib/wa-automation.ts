import { getMongoDb } from '@/lib/mongodb';
import { isAddonEnabled } from '@/lib/client-addons';
import { getWaAccountByClient, WA_MESSAGES, type WaAccountDoc, type WaMessageDoc } from '@/lib/wa-accounts';
import { accountCountryCode, findTemplateBody, looksLikeName, normalizeWaPhone, renderTemplateText, sendWaTemplate } from '@/lib/wa-campaigns';
import { WA_CONVERSATIONS, contactKey, touchConversation } from '@/lib/wa-inbox';

/**
 * Mensajes automáticos desde el número de WhatsApp oficial del propio cliente:
 *  - welcome: confirmación a la PERSONA que llenó el formulario ("recibimos tus datos, te contactaremos").
 *  - advisorAlert: aviso a la asesora (alertNumber) de que entró un lead.
 *  - replyAlert: aviso a la asesora de que la persona CONTESTÓ (máx. uno por conversación cada hora).
 * Todos usan plantillas aprobadas por Meta (categoría Utilidad). Se activan por cliente en `wa_settings`.
 */
export type AutoMessageSetting = { enabled: boolean; templateName: string; language: string };
export type WaSettings = { welcome?: AutoMessageSetting; advisorAlert?: AutoMessageSetting; replyAlert?: AutoMessageSetting };
export type AutoKind = 'welcome' | 'advisorAlert' | 'replyAlert';

export const DEFAULT_TEMPLATES = {
  welcome: {
    name: 'bienvenida_lead_v1',
    language: 'es_MX',
    category: 'UTILITY' as const,
    bodyText:
      'Hola {{1}}, recibimos tus datos en el formulario de {{2}}. En unos momentos un asesor te va a contactar por llamada o por WhatsApp, como te quede más cómodo. ¡Gracias por tu interés!',
    examples: ['María', 'Seguros Gredillas'],
  },
  advisorAlert: {
    name: 'aviso_nuevo_lead_v1',
    language: 'es_MX',
    category: 'UTILITY' as const,
    bodyText: 'Nuevo lead en tu panel: {{1}}, teléfono {{2}}. Contáctalo lo antes posible.',
    examples: ['María', '5491112345678'],
  },
  replyAlert: {
    name: 'respuesta_lead_v1',
    language: 'es_MX',
    category: 'UTILITY' as const,
    bodyText: '{{1}} respondió a tu mensaje por WhatsApp. Ábrelo en la bandeja de tu panel y contéstale.',
    examples: ['María'],
  },
};

/** Tiempo mínimo entre dos avisos de respuesta de la misma conversación (evita un aviso por cada mensaje). */
const REPLY_ALERT_COOLDOWN_MS = 60 * 60 * 1000;

const NAME_RE = /^[a-z0-9_]{1,512}$/;

export function sanitizeSetting(raw: unknown): AutoMessageSetting | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const templateName = String(o.templateName ?? '').trim();
  const language = String(o.language ?? 'es_MX').trim() || 'es_MX';
  if (!NAME_RE.test(templateName)) return undefined;
  return { enabled: o.enabled === true, templateName, language };
}

function firstName(full: unknown): string {
  const t = String(full ?? '').trim();
  if (!t || /sin nombre|test lead|prueba/i.test(t)) return 'cliente';
  return t.split(/\s+/)[0].slice(0, 40);
}

type DeliverOpts = {
  account: WaAccountDoc;
  resellerId: string;
  clientSlug: string;
  kind: AutoKind;
  cfg: AutoMessageSetting;
  to: string;
  params: string[];
  /** Si viene, el envío se marca de forma atómica en el lead para no repetirlo (reintentos del webhook). */
  leadId?: string;
};

/** Envía una plantilla automática y deja registro en la bandeja. Nunca lanza. */
async function deliver(o: DeliverOpts): Promise<{ ok: boolean; error?: string }> {
  const db = await getMongoDb();
  const flag = o.kind === 'welcome' ? 'wa_welcome' : 'wa_advisor_alert';
  if (o.leadId && o.kind !== 'replyAlert') {
    const claim = await db
      .collection('leads')
      .updateOne({ leadId: o.leadId, [`${flag}.claimedAt`]: { $exists: false } }, { $set: { [`${flag}.claimedAt`]: new Date() } });
    if (claim.matchedCount === 0) return { ok: true };
  }

  const out = await sendWaTemplate(o.account, o.to, { name: o.cfg.templateName, language: o.cfg.language }, o.params);
  const now = new Date();
  if (o.leadId && o.kind !== 'replyAlert') {
    await db.collection('leads').updateOne(
      { leadId: o.leadId },
      { $set: { [`${flag}.status`]: out.ok ? 'sent' : 'failed', [`${flag}.wamid`]: out.wamid ?? null, [`${flag}.error`]: out.error ?? null, [`${flag}.at`]: now } },
    );
  }
  if (!out.ok || !out.wamid) {
    console.error(`[wa-auto] ${o.kind} falló para ${o.clientSlug}:`, out.error, out.code ?? '');
    return { ok: false, error: out.error || 'Meta no aceptó el mensaje' };
  }

  // Texto real que recibió la persona (para la bandeja); si no se puede leer, se muestra el nombre de la plantilla.
  const def = Object.values(DEFAULT_TEMPLATES).find((t) => t.name === o.cfg.templateName);
  const body = def?.bodyText ?? (await findTemplateBody(o.account, o.cfg.templateName, o.cfg.language));
  await db.collection<WaMessageDoc>(WA_MESSAGES).insertOne({
    resellerId: o.resellerId,
    clientSlug: o.clientSlug,
    phoneNumberId: o.account.phoneNumberId,
    direction: 'out',
    wamid: out.wamid,
    contact: o.to,
    contactKey: contactKey(o.to),
    type: 'template',
    text: body ? renderTemplateText(body, o.params) : o.cfg.templateName,
    status: 'sent',
    createdAt: now,
    updatedAt: now,
  });
  // La bienvenida abre la conversación con la persona; los avisos a la asesora no.
  if (o.kind === 'welcome') {
    await touchConversation({
      resellerId: o.resellerId,
      clientSlug: o.clientSlug,
      contact: o.to,
      direction: 'out',
      text: 'Mensaje de bienvenida enviado',
      name: looksLikeName(o.params[0]),
      at: now,
    }).catch(() => undefined);
  }
  return { ok: true };
}

type LeadInfo = { resellerId: string; clientSlug: string; leadId: string; nombre?: string; telefono?: string };

/**
 * Se llama sin esperar (void) cuando entra un lead nuevo. Nunca lanza: cualquier fallo se registra y listo.
 * Cada mensaje se envía una sola vez por lead (marca atómica en el documento del lead).
 */
export async function runLeadWhatsAppAutomation(lead: LeadInfo): Promise<void> {
  try {
    if (!lead.resellerId || !lead.clientSlug || lead.resellerId === 'unknown') return;
    const db = await getMongoDb();
    const client = await db.collection('leads').findOne(
      { _collection_type: 'reseller_client', resellerId: lead.resellerId, clientSlug: lead.clientSlug },
      { projection: { addons: 1, wa_settings: 1, nombre: 1, negocio: 1, alertNumber: 1, status: 1 } },
    );
    if (!client || !isAddonEnabled(client, 'whatsappApi') || String(client.status || 'activo') !== 'activo') return;

    const settings = (client.wa_settings ?? {}) as WaSettings;
    const wantsWelcome = settings.welcome?.enabled === true;
    const wantsAlert = settings.advisorAlert?.enabled === true;
    if (!wantsWelcome && !wantsAlert) return;

    const account = await getWaAccountByClient(lead.resellerId, lead.clientSlug);
    if (!account || !account.subscribed || !account.registered) {
      console.error('[wa-auto] sin número conectado y listo para', lead.clientSlug);
      return;
    }

    const cc = accountCountryCode(account);
    const business = String(client.negocio || client.nombre || 'nuestro negocio');
    const nombre = firstName(lead.nombre);
    const leadPhone = normalizeWaPhone(lead.telefono ?? '', cc);
    const base = { account, resellerId: lead.resellerId, clientSlug: lead.clientSlug, leadId: lead.leadId };

    if (wantsWelcome) {
      if (leadPhone.length >= 10) await deliver({ ...base, kind: 'welcome', cfg: settings.welcome!, to: leadPhone, params: [nombre, business] });
      else console.error('[wa-auto] lead sin teléfono válido, no se envía bienvenida:', lead.leadId);
    }
    if (wantsAlert) {
      const advisor = normalizeWaPhone(String(client.alertNumber ?? ''), cc);
      if (advisor.length >= 10) await deliver({ ...base, kind: 'advisorAlert', cfg: settings.advisorAlert!, to: advisor, params: [nombre, leadPhone || 'sin teléfono'] });
      else console.error('[wa-auto] cliente sin alertNumber, no se avisa a la asesora:', lead.clientSlug);
    }
  } catch (err) {
    console.error('[wa-auto] error:', err instanceof Error ? err.message : err);
  }
}

/**
 * La persona contestó: avisa a la asesora por WhatsApp (una vez por conversación cada hora).
 * Se llama sin esperar desde el webhook. Nunca lanza.
 */
export async function maybeSendReplyAlert(account: WaAccountDoc, who: { contact: string; name?: string }): Promise<void> {
  try {
    const db = await getMongoDb();
    const { resellerId, clientSlug } = account;
    const client = await db.collection('leads').findOne(
      { _collection_type: 'reseller_client', resellerId, clientSlug },
      { projection: { addons: 1, wa_settings: 1, alertNumber: 1, status: 1 } },
    );
    if (!client || !isAddonEnabled(client, 'whatsappApi') || String(client.status || 'activo') !== 'activo') return;
    const cfg = (client.wa_settings as WaSettings | undefined)?.replyAlert;
    if (!cfg?.enabled) return;

    const advisor = normalizeWaPhone(String(client.alertNumber ?? ''), accountCountryCode(account));
    if (advisor.length < 10) return;
    const key = contactKey(who.contact);
    if (key === contactKey(advisor)) return; // la propia asesora escribiendo al número

    // Un aviso por conversación cada hora: la marca se toma de forma atómica.
    const claim = await db.collection(WA_CONVERSATIONS).updateOne(
      {
        resellerId,
        clientSlug,
        contactKey: key,
        $or: [{ replyAlertAt: { $exists: false } }, { replyAlertAt: { $lt: new Date(Date.now() - REPLY_ALERT_COOLDOWN_MS) } }],
      },
      { $set: { replyAlertAt: new Date() } },
    );
    if (claim.matchedCount === 0) return;

    const conv = await db.collection(WA_CONVERSATIONS).findOne({ resellerId, clientSlug, contactKey: key }, { projection: { name: 1 } });
    const shown = String(conv?.name || who.name || '').trim() || `+${key}`;
    await deliver({ account, resellerId, clientSlug, kind: 'replyAlert', cfg, to: advisor, params: [shown.slice(0, 60)] });
  } catch (err) {
    console.error('[wa-auto] reply alert:', err instanceof Error ? err.message : err);
  }
}

export type AutomationTestResult = Array<{ kind: AutoKind; ok: boolean; error?: string; skipped?: string }>;

/**
 * Prueba sin necesitar un lead real: manda la bienvenida al teléfono indicado y los avisos al número de alertas
 * del cliente, con las plantillas elegidas (aunque la casilla de activar aún no esté marcada).
 */
export async function runAutomationTest(opts: { resellerId: string; clientSlug: string; phone: string; name?: string }): Promise<AutomationTestResult> {
  const db = await getMongoDb();
  const client = await db.collection('leads').findOne(
    { _collection_type: 'reseller_client', resellerId: opts.resellerId, clientSlug: opts.clientSlug },
    { projection: { wa_settings: 1, nombre: 1, negocio: 1, alertNumber: 1 } },
  );
  const account = await getWaAccountByClient(opts.resellerId, opts.clientSlug);
  if (!client || !account) return [{ kind: 'welcome', ok: false, error: 'No hay un número de WhatsApp conectado' }];

  const settings = (client.wa_settings ?? {}) as WaSettings;
  const cc = accountCountryCode(account);
  const phone = normalizeWaPhone(opts.phone, cc);
  const nombre = firstName(opts.name || 'Prueba');
  const business = String(client.negocio || client.nombre || 'nuestro negocio');
  const base = { account, resellerId: opts.resellerId, clientSlug: opts.clientSlug };
  const results: AutomationTestResult = [];

  if (phone.length < 10) return [{ kind: 'welcome', ok: false, error: 'El teléfono no es válido' }];

  if (settings.welcome?.templateName) {
    const r = await deliver({ ...base, kind: 'welcome', cfg: settings.welcome, to: phone, params: [nombre, business] });
    results.push({ kind: 'welcome', ...r });
  } else results.push({ kind: 'welcome', ok: false, skipped: 'No elegiste plantilla de bienvenida' });

  const advisor = normalizeWaPhone(String(client.alertNumber ?? ''), cc);
  for (const kind of ['advisorAlert', 'replyAlert'] as const) {
    const cfg = settings[kind];
    if (!cfg?.templateName) results.push({ kind, ok: false, skipped: 'No elegiste plantilla' });
    else if (advisor.length < 10) results.push({ kind, ok: false, skipped: 'El cliente no tiene número de alertas' });
    else {
      const params = kind === 'advisorAlert' ? [nombre, phone] : [nombre];
      const r = await deliver({ ...base, kind, cfg, to: advisor, params });
      results.push({ kind, ...r });
    }
  }
  return results;
}
