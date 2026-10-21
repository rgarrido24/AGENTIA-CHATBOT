import { getMongoDb } from '@/lib/mongodb';
import { isAddonEnabled } from '@/lib/client-addons';
import { getWaAccountByClient, WA_MESSAGES, type WaMessageDoc } from '@/lib/wa-accounts';
import { normalizeWaPhone, sendWaTemplate } from '@/lib/wa-campaigns';

/**
 * Mensajes automáticos cuando llega un lead, enviados desde el número de WhatsApp oficial del propio cliente:
 *  - welcome: confirmación a la PERSONA que llenó el formulario ("recibimos tus datos, te contactaremos").
 *  - advisorAlert: aviso a la asesora (alertNumber) de que entró un lead.
 * Ambos usan plantillas aprobadas por Meta (categoría Utilidad). Se activan por cliente en `wa_settings`.
 */
export type AutoMessageSetting = { enabled: boolean; templateName: string; language: string };
export type WaSettings = { welcome?: AutoMessageSetting; advisorAlert?: AutoMessageSetting };

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
};

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

    const business = String(client.negocio || client.nombre || 'nuestro negocio');
    const nombre = firstName(lead.nombre);
    const leadPhone = normalizeWaPhone(lead.telefono ?? '');

    const send = async (kind: 'welcome' | 'advisorAlert', to: string, params: string[]) => {
      const cfg = settings[kind]!;
      const flag = kind === 'welcome' ? 'wa_welcome' : 'wa_advisor_alert';
      // Marca atómica: si otro proceso ya lo envió (reintento del webhook) no se repite.
      const claim = await db
        .collection('leads')
        .updateOne({ leadId: lead.leadId, [`${flag}.claimedAt`]: { $exists: false } }, { $set: { [`${flag}.claimedAt`]: new Date() } });
      if (claim.matchedCount === 0) return;

      const out = await sendWaTemplate(account, to, { name: cfg.templateName, language: cfg.language }, params);
      const now = new Date();
      await db.collection('leads').updateOne(
        { leadId: lead.leadId },
        { $set: { [`${flag}.status`]: out.ok ? 'sent' : 'failed', [`${flag}.wamid`]: out.wamid ?? null, [`${flag}.error`]: out.error ?? null, [`${flag}.at`]: now } },
      );
      if (out.ok && out.wamid) {
        await db.collection<WaMessageDoc>(WA_MESSAGES).insertOne({
          resellerId: lead.resellerId,
          clientSlug: lead.clientSlug,
          phoneNumberId: account.phoneNumberId,
          direction: 'out',
          wamid: out.wamid,
          contact: to,
          type: 'template',
          text: cfg.templateName,
          status: 'sent',
          createdAt: now,
          updatedAt: now,
        });
      } else {
        console.error(`[wa-auto] ${kind} falló para ${lead.clientSlug}:`, out.error, out.code ?? '');
      }
    };

    if (wantsWelcome) {
      if (leadPhone.length >= 10) await send('welcome', leadPhone, [nombre, business]);
      else console.error('[wa-auto] lead sin teléfono válido, no se envía bienvenida:', lead.leadId);
    }
    if (wantsAlert) {
      const advisor = normalizeWaPhone(String(client.alertNumber ?? ''));
      if (advisor.length >= 10) await send('advisorAlert', advisor, [nombre, leadPhone || 'sin teléfono']);
      else console.error('[wa-auto] cliente sin alertNumber, no se avisa a la asesora:', lead.clientSlug);
    }
  } catch (err) {
    console.error('[wa-auto] error:', err instanceof Error ? err.message : err);
  }
}
