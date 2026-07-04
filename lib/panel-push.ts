import webpush from 'web-push';
import { getMongoDb } from '@/lib/mongodb';
import {
  AGENTIA_PANEL_PWA,
  clientIdToPanel,
  CWF_PANEL_PWA,
  type PanelPushId,
} from '@/lib/panel-pwa-config';

export type PushSubscriptionKeys = {
  p256dh: string;
  auth: string;
};

export type PushSubscriptionDoc = {
  panel: PanelPushId;
  endpoint: string;
  keys: PushSubscriptionKeys;
  expirationTime?: number | null;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PushPayload = {
  title: string;
  body: string;
  url: string;
  icon: string;
  tag?: string;
};

function panelConfig(panel: PanelPushId) {
  return panel === 'cwf' ? CWF_PANEL_PWA : AGENTIA_PANEL_PWA;
}

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

function configureWebPush() {
  const keys = getVapidKeys();
  if (!keys) return false;
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
  return true;
}

export async function savePanelPushSubscription(
  panel: PanelPushId,
  subscription: {
    endpoint: string;
    keys: PushSubscriptionKeys;
    expirationTime?: number | null;
  },
  userAgent?: string,
): Promise<void> {
  const db = await getMongoDb();
  const now = new Date();
  await db.collection('panel_push_subscriptions').updateOne(
    { endpoint: subscription.endpoint },
    {
      $set: {
        panel,
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

export async function removePanelPushSubscription(endpoint: string): Promise<void> {
  const db = await getMongoDb();
  await db.collection('panel_push_subscriptions').deleteOne({ endpoint });
}

async function listPanelPushSubscriptions(panel: PanelPushId): Promise<PushSubscriptionDoc[]> {
  const db = await getMongoDb();
  const docs = await db.collection('panel_push_subscriptions').find({ panel }).toArray();
  return docs.map((d) => ({
    panel: d.panel as PanelPushId,
    endpoint: String(d.endpoint),
    keys: d.keys as PushSubscriptionKeys,
    expirationTime: d.expirationTime as number | null | undefined,
    userAgent: d.userAgent ? String(d.userAgent) : undefined,
    createdAt: d.createdAt instanceof Date ? d.createdAt : new Date(),
    updatedAt: d.updatedAt instanceof Date ? d.updatedAt : new Date(),
  }));
}

/** Envía notificación push a todos los dispositivos suscritos del panel. */
export async function notifyPanelNewInbound(params: {
  clientId: string;
  senderName?: string;
  senderId: string;
  message: string;
}): Promise<void> {
  const panel = clientIdToPanel(params.clientId);
  if (!panel) return;
  if (!configureWebPush()) return;

  const cfg = panelConfig(panel);
  const name = params.senderName?.trim() || params.senderId;
  const body = params.message.trim().slice(0, 160) || 'Nuevo mensaje';
  const payload: PushPayload = {
    title: `${name} — nuevo mensaje`,
    body,
    url: cfg.startUrl,
    icon: `${cfg.iconBase}/icon-192.png`,
    tag: `panel-${panel}-${params.senderId}`,
  };

  const subs = await listPanelPushSubscriptions(panel);
  if (!subs.length) return;

  const json = JSON.stringify(payload);
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          json,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await removePanelPushSubscription(sub.endpoint);
        }
      }
    }),
  );
}

export function getVapidPublicKey(): string | null {
  return getVapidKeys()?.publicKey ?? null;
}
