import webpush from 'web-push';
import { getMongoDb } from '@/lib/mongodb';

export const PORTAL_PWA_ICON =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1782579834/WhatsApp_Image_2026-06-27_at_11.03.20_AM_tzq2rn.jpg';

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

function getVapidKeys(): { publicKey: string; privateKey: string; subject: string } | null {
  const publicKey = (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    ''
  ).trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
  const subject = (process.env.VAPID_SUBJECT || 'mailto:admin@agentia.software').trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

function configureWebPush(): boolean {
  const keys = getVapidKeys();
  if (!keys) return false;
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
  return true;
}

function portalOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.AGENTIA_PUBLIC_URL || DEFAULT_PUBLIC_ORIGIN).replace(
    /\/$/,
    '',
  );
}

export async function isPortalPwaEnabled(resellerId: string, clientSlug: string): Promise<boolean> {
  const db = await getMongoDb();
  const doc = await db.collection('leads').findOne(
    { _collection_type: 'reseller_client', resellerId, clientSlug },
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
  const db = await getMongoDb();
  const now = new Date();
  await db.collection('portal_push_subscriptions').updateOne(
    { endpoint: subscription.endpoint },
    {
      $set: {
        resellerId,
        clientSlug,
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
  const db = await getMongoDb();
  const docs = await db
    .collection('portal_push_subscriptions')
    .find({ resellerId, clientSlug })
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
  const db = await getMongoDb();
  const result = await db.collection('leads').findOneAndUpdate(
    { _collection_type: 'reseller_client', resellerId, clientSlug, pwa_enabled: true },
    { $inc: { pwaBadgeCount: 1 } },
    { returnDocument: 'after', projection: { pwaBadgeCount: 1 } },
  );
  const count = result?.pwaBadgeCount;
  return typeof count === 'number' && count > 0 ? count : 1;
}

/** Envía push a asesoras suscritas cuando llega un lead nuevo al portal. */
export async function notifyPortalNewLead(params: {
  resellerId: string;
  clientSlug: string;
  nombre?: string;
  telefono?: string;
  leadId: string;
}): Promise<void> {
  const { resellerId, clientSlug, leadId } = params;
  if (!resellerId || !clientSlug || resellerId === 'unknown') return;

  const enabled = await isPortalPwaEnabled(resellerId, clientSlug);
  if (!enabled) return;
  if (!configureWebPush()) return;

  const nombre = params.nombre?.trim() || 'Sin nombre';
  const telefono = params.telefono?.trim() || 'Sin teléfono';
  const badgeCount = await incrementPortalBadgeCount(resellerId, clientSlug);
  const url = `${portalOrigin()}/portal/${resellerId}/cliente/${clientSlug}?lid=${encodeURIComponent(leadId)}`;

  const payload: PortalPushPayload = {
    title: '🔔 Nuevo lead!',
    body: `Nuevo lead: ${nombre} - ${telefono}`,
    url,
    icon: PORTAL_PWA_ICON,
    badge: PORTAL_PWA_ICON,
    badgeCount,
    tag: `portal-lead-${leadId}`,
  };

  const subs = await listPortalPushSubscriptions(resellerId, clientSlug);
  if (!subs.length) return;

  const json = JSON.stringify(payload);
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, json);
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await removePortalPushSubscription(sub.endpoint);
        }
      }
    }),
  );
}

export function getPortalVapidPublicKey(): string | null {
  return getVapidKeys()?.publicKey ?? null;
}
