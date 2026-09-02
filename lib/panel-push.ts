import webpush from 'web-push';
import { getMongoDb } from '@/lib/mongodb';
import {
  AGENTIA_PANEL_PWA,
  clientIdToPanel,
  CWF_PANEL_PWA,
  IZZI_PANEL_PWA,
  type PanelPushId,
} from '@/lib/panel-pwa-config';
import { izziPanelBrand } from '@/lib/izzi-panel-brand';

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
  if (panel === 'cwf') return CWF_PANEL_PWA;
  if (panel === 'izzi') return IZZI_PANEL_PWA;
  return AGENTIA_PANEL_PWA;
}

function maskKey(key: string): string {
  if (key.length <= 12) return '(corta)';
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

function getVapidKeys(): { publicKey: string; privateKey: string; subject: string } | null {
  const publicKey = (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    ''
  ).trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
  const subject = (process.env.VAPID_SUBJECT || 'mailto:admin@agentia.software').trim();

  console.error('[panel-push] VAPID env', {
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

function configureWebPush() {
  const keys = getVapidKeys();
  if (!keys) {
    console.error('[panel-push] configureWebPush: claves VAPID incompletas — push deshabilitado');
    return false;
  }
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
  console.error('[panel-push] configureWebPush: VAPID configurado correctamente');
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
  const result = await db.collection('panel_push_subscriptions').updateOne(
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

  console.error('[panel-push] Suscripción guardada en MongoDB', {
    panel,
    endpoint: maskKey(subscription.endpoint),
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedId: result.upsertedId?.toString() ?? null,
    collection: 'panel_push_subscriptions',
  });
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
export async function sendPushNotification(params: {
  clientId: string;
  senderName?: string;
  senderId: string;
  message: string;
}): Promise<void> {
  console.error('[panel-push] sendPushNotification() llamado', {
    clientId: params.clientId,
    senderId: params.senderId,
    senderName: params.senderName ?? null,
    messagePreview: params.message.trim().slice(0, 80),
    at: new Date().toISOString(),
  });

  const panel = clientIdToPanel(params.clientId);
  if (!panel) {
    console.error('[panel-push] sendPushNotification: clientId sin panel PWA', params.clientId);
    return;
  }
  if (!configureWebPush()) return;

  const cfg = panelConfig(panel);
  const name = params.senderName?.trim() || params.senderId;
  const body = params.message.trim().slice(0, 160) || 'Nuevo mensaje';
  const payload: PushPayload = {
    title: `${name} — nuevo mensaje`,
    body,
    url: cfg.startUrl,
    icon: `${izziPanelBrand(params.clientId).iconBase}/icon-192.png`,
    tag: `panel-${panel}-${params.senderId}`,
  };

  const subs = await listPanelPushSubscriptions(panel);
  console.error('[panel-push] sendPushNotification: suscriptores', {
    panel,
    count: subs.length,
  });
  if (!subs.length) {
    console.error('[panel-push] sendPushNotification: sin suscriptores — no se envía push');
    return;
  }

  const json = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          json,
        );
        console.error('[panel-push] sendPushNotification: enviado OK', {
          panel,
          endpoint: maskKey(sub.endpoint),
        });
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        console.error('[panel-push] sendPushNotification: error al enviar', {
          panel,
          endpoint: maskKey(sub.endpoint),
          statusCode: status ?? null,
          message: err instanceof Error ? err.message : String(err),
        });
        if (status === 404 || status === 410) {
          await removePanelPushSubscription(sub.endpoint);
          console.error('[panel-push] sendPushNotification: suscripción expirada eliminada', {
            endpoint: maskKey(sub.endpoint),
          });
        }
      }
    }),
  );

  const ok = results.filter((r) => r.status === 'fulfilled').length;
  console.error('[panel-push] sendPushNotification: resumen', {
    panel,
    total: subs.length,
    ok,
    failed: subs.length - ok,
  });
}

/** @deprecated Usar sendPushNotification */
export const notifyPanelNewInbound = sendPushNotification;

export function getVapidPublicKey(): string | null {
  return getVapidKeys()?.publicKey ?? null;
}
