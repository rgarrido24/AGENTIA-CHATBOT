import webpush from 'web-push';
import { getMongoDb } from '@/lib/mongodb';
import { PORTAL_PWA_ICON_192 } from '@/lib/portal-pwa-config';

/** @deprecated use PORTAL_PWA_ICON_192 */
export const PORTAL_PWA_ICON = PORTAL_PWA_ICON_192;

const DEFAULT_PUBLIC_ORIGIN = 'https://agentia.software';

export type PortalPushSubscriptionKeys = {
  p256dh: string;
  auth: string;
};

export type PortalPushSubscriptionDoc = {
  resellerId: string;
  clientSlug: string;
  endpoint: string;
  keys: PortalPushSubscriptionKeys;
  expirationTime?: number | null;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PortalPushPayload = {
  title: string;
  body: string;
  url: string;
  icon: string;
  badge: string;
  badgeCount: number;
  tag?: string;
};

function maskKey(key: string): string {
  if (key.length <= 12) return '(corta)';
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

function normalizePortalIds(resellerId: string, clientSlug: string): { resellerId: string; clientSlug: string } {
  return {
    resellerId: resellerId.trim().toLowerCase(),
    clientSlug: clientSlug.trim().toLowerCase(),
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getVapidKeys(): { publicKey: string; privateKey: string; subject: string } | null {
  const publicKey = (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    ''
  ).trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
  const subject = (process.env.VAPID_SUBJECT || 'mailto:admin@agentia.software').trim();

  console.log('[PWA PUSH] VAPID env', {
    publicKey: publicKey ? maskKey(publicKey) : '(vacío)',
    publicKeySource: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      ? 'NEXT_PUBLIC_VAPID_PUBLIC_KEY'
      : process.env.VAPID_PUBLIC_KEY
        ? 'VAPID_PUBLIC_KEY'
        : 'ninguna',
    privateKey: privateKey ? `SET (${privateKey.length} chars)` : '(vacío)',
    subject,
    ok: Boolean(publicKey && privateKey),
  });

  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

function configureWebPush(): boolean {
  const keys = getVapidKeys();
  if (!keys) {
    console.log('[PWA PUSH] configureWebPush: claves VAPID incompletas — push deshabilitado');
    return false;
  }
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
  console.log('[PWA PUSH] configureWebPush: VAPID configurado correctamente');
  return true;
}

function portalOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.AGENTIA_PUBLIC_URL || DEFAULT_PUBLIC_ORIGIN).replace(
    /\/$/,
    '',
  );
}

export async function isPortalPwaEnabled(resellerId: string, clientSlug: string): Promise<boolean> {
  const ids = normalizePortalIds(resellerId, clientSlug);
  const db = await getMongoDb();
  const doc = await db.collection('leads').findOne(
    { _collection_type: 'reseller_client', resellerId: ids.resellerId, clientSlug: ids.clientSlug },
    { projection: { pwa_enabled: 1 } },
  );
  return doc?.pwa_enabled === true;
}

export async function savePortalPushSubscription(
  resellerId: string,
  clientSlug: string,
  subscription: {
    endpoint: string;
    keys: PortalPushSubscriptionKeys;
    expirationTime?: number | null;
  },
  userAgent?: string,
): Promise<void> {
  const ids = normalizePortalIds(resellerId, clientSlug);
  const db = await getMongoDb();
  const now = new Date();
  await db.collection('portal_push_subscriptions').updateOne(
    { endpoint: subscription.endpoint },
    {
      $set: {
        resellerId: ids.resellerId,
        clientSlug: ids.clientSlug,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        expirationTime: subscription.expirationTime ?? null,
        userAgent: userAgent || undefined,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
}

async function removePortalPushSubscription(endpoint: string): Promise<void> {
  const db = await getMongoDb();
  await db.collection('portal_push_subscriptions').deleteOne({ endpoint });
}

async function listPortalPushSubscriptions(
  resellerId: string,
  clientSlug: string,
): Promise<PortalPushSubscriptionDoc[]> {
  const ids = normalizePortalIds(resellerId, clientSlug);
  const db = await getMongoDb();
  const docs = await db
    .collection('portal_push_subscriptions')
    .find({
      resellerId: { $regex: `^${escapeRegex(ids.resellerId)}$`, $options: 'i' },
      clientSlug: { $regex: `^${escapeRegex(ids.clientSlug)}$`, $options: 'i' },
    })
    .toArray();
  return docs.map((d) => ({
    resellerId: String(d.resellerId),
    clientSlug: String(d.clientSlug),
    endpoint: String(d.endpoint),
    keys: d.keys as PortalPushSubscriptionKeys,
    expirationTime: d.expirationTime as number | null | undefined,
    userAgent: d.userAgent ? String(d.userAgent) : undefined,
    createdAt: d.createdAt instanceof Date ? d.createdAt : new Date(),
    updatedAt: d.updatedAt instanceof Date ? d.updatedAt : new Date(),
  }));
}

async function incrementPortalBadgeCount(resellerId: string, clientSlug: string): Promise<number> {
  const ids = normalizePortalIds(resellerId, clientSlug);
  const db = await getMongoDb();
  const result = await db.collection('leads').findOneAndUpdate(
    { _collection_type: 'reseller_client', resellerId: ids.resellerId, clientSlug: ids.clientSlug, pwa_enabled: true },
    { $inc: { pwaBadgeCount: 1 } },
    { returnDocument: 'after', projection: { pwaBadgeCount: 1 } },
  );
  const count = result?.pwaBadgeCount;
  return typeof count === 'number' && count > 0 ? count : 1;
}

/** Invocar tras insertar un lead con resellerId/clientSlug (webhook, API u otra fuente). */
export async function notifyPortalNewLeadIfResellerClient(lead: {
  resellerId?: string | null;
  clientSlug?: string | null;
  leadId: string;
  nombre?: string;
  telefono?: string;
  senderName?: string;
}): Promise<void> {
  const resellerId = String(lead.resellerId ?? '').trim();
  const clientSlug = String(lead.clientSlug ?? '').trim();
  if (!resellerId || !clientSlug || resellerId === 'unknown') {
    console.error('[PWA PUSH] omitido post-insert: resellerId/clientSlug inválido', {
      leadId: lead.leadId,
      resellerId: resellerId || '(vacío)',
      clientSlug: clientSlug || '(vacío)',
    });
    return;
  }
  try {
    await notifyPortalNewLead({
      resellerId,
      clientSlug,
      leadId: lead.leadId,
      nombre: lead.nombre || lead.senderName,
      telefono: lead.telefono,
    });
  } catch (err) {
    console.error('[PWA PUSH] Error notifyPortalNewLead:', err instanceof Error ? err.message : err);
  }
}

/** Envía push a asesoras suscritas cuando llega un lead nuevo al portal. */
export async function notifyPortalNewLead(params: {
  resellerId: string;
  clientSlug: string;
  nombre?: string;
  telefono?: string;
  leadId: string;
}): Promise<void> {
  const ids = normalizePortalIds(params.resellerId, params.clientSlug);
  const { resellerId, clientSlug } = ids;
  const { leadId } = params;

  console.error('[PWA PUSH] notifyPortalNewLead llamado:', { resellerId, clientSlug });

  if (!resellerId || !clientSlug || resellerId === 'unknown') {
    console.error('[PWA PUSH] omitido: resellerId/clientSlug inválido', { leadId });
    return;
  }

  const enabled = await isPortalPwaEnabled(resellerId, clientSlug);
  if (!enabled) {
    console.log('[PWA PUSH] omitido: pwa_enabled=false para', clientSlug);
    return;
  }
  if (!configureWebPush()) return;

  const nombre = params.nombre?.trim() || 'Sin nombre';
  const telefono = params.telefono?.trim() || 'Sin teléfono';
  const badgeCount = await incrementPortalBadgeCount(resellerId, clientSlug);
  const url = `${portalOrigin()}/portal/${resellerId}/cliente/${clientSlug}?lid=${encodeURIComponent(leadId)}`;

  const payload: PortalPushPayload = {
    title: '🔔 Nuevo lead!',
    body: `Nuevo lead: ${nombre} - ${telefono}`,
    url,
    icon: PORTAL_PWA_ICON_192,
    badge: PORTAL_PWA_ICON_192,
    badgeCount,
    tag: `portal-lead-${leadId}`,
  };

  const subs = await listPortalPushSubscriptions(resellerId, clientSlug);
  console.log('[PWA PUSH] Enviando a clientSlug:', clientSlug, 'suscripciones:', subs.length);
  if (!subs.length) return;

  const json = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, json);
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        console.log('[PWA PUSH] fallo envío:', status ?? (err instanceof Error ? err.message : err));
        if (status === 404 || status === 410) {
          await removePortalPushSubscription(sub.endpoint);
        }
        throw err;
      }
    }),
  );
  const sent = results.filter((r) => r.status === 'fulfilled').length;
  console.log('[PWA PUSH] enviados:', sent, '/', subs.length);
}

export function getPortalVapidPublicKey(): string | null {
  return getVapidKeys()?.publicKey ?? null;
}
