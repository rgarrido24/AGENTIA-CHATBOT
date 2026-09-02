import QRCode from 'qrcode';
import { getMongoDb } from '@/lib/mongodb';
import { bridgeGetQrRaw, bridgeGetStatus } from '@/lib/baileys-bridge-client';

const ACTIVITY_WINDOW_MS = 30 * 60 * 1000;

export type IzziWhatsAppStatus = {
  connected: boolean;
  phone: string | null;
  hasQr: boolean;
  qrDataUrl: string | null;
  source: 'bridge' | 'mongo' | 'activity' | 'none';
  lastMessageAt: string | null;
  updatedAt: string | null;
  bridgeSeen: boolean;
  resetPending: boolean;
  hint: string | null;
};

export async function getIzziWhatsAppStatus(clientId: string): Promise<IzziWhatsAppStatus> {
  const tenant = clientId.trim().toLowerCase();
  const [bridge, lastMessageAt, mongoMeta] = await Promise.all([
    bridgeGetStatus(tenant),
    recentConversationAt(tenant),
    getMongoMeta(tenant),
  ]);

  const phone = typeof bridge.phone === 'string' ? bridge.phone : null;
  const hasQr = !!bridge.hasQr;
  const recent =
    lastMessageAt && Date.now() - lastMessageAt.getTime() < ACTIVITY_WINDOW_MS ? lastMessageAt : null;
  const qrDataUrl = hasQr ? await qrDataUrlFor(tenant) : null;

  if (mongoMeta.resetPending) {
    return {
      connected: false,
      phone,
      hasQr,
      qrDataUrl,
      source: hasQr ? 'mongo' : 'none',
      lastMessageAt: lastMessageAt?.toISOString() ?? null,
      updatedAt: mongoMeta.updatedAt,
      bridgeSeen: mongoMeta.bridgeSeen,
      resetPending: true,
      hint: hasQr
        ? 'Escanea el QR nuevo. El anterior ya no sirve.'
        : 'El puente está generando un QR nuevo. Esta página se actualiza sola.',
    };
  }

  if (bridge.connected) {
    return {
      connected: true,
      phone,
      hasQr: false,
      qrDataUrl: null,
      source: 'mongo',
      lastMessageAt: lastMessageAt?.toISOString() ?? null,
      updatedAt: mongoMeta.updatedAt,
      bridgeSeen: mongoMeta.bridgeSeen,
      resetPending: false,
      hint: 'Si en el teléfono ya no aparece este dispositivo, pulsa Volver a conectar para cargar un QR nuevo.',
    };
  }

  if (recent) {
    return {
      connected: false,
      phone,
      hasQr,
      qrDataUrl,
      source: 'activity',
      lastMessageAt: recent.toISOString(),
      updatedAt: mongoMeta.updatedAt,
      bridgeSeen: mongoMeta.bridgeSeen,
      resetPending: false,
      hint: 'Hubo mensajes recientes, pero el teléfono puede estar desvinculado. Escanea el QR otra vez.',
    };
  }

  return {
    connected: false,
    phone,
    hasQr,
    qrDataUrl,
    source: hasQr ? 'mongo' : 'none',
    lastMessageAt: lastMessageAt?.toISOString() ?? null,
    updatedAt: mongoMeta.updatedAt,
    bridgeSeen: mongoMeta.bridgeSeen,
    resetPending: false,
    hint: null,
  };
}

export async function getIzziWhatsAppQrDataUrl(clientId: string): Promise<string | null> {
  const raw = await bridgeGetQrRaw(clientId.trim().toLowerCase());
  if (!raw) return null;
  try {
    return await QRCode.toDataURL(raw, { width: 300, margin: 2 });
  } catch {
    return null;
  }
}

async function getMongoMeta(
  clientId: string
): Promise<{ updatedAt: string | null; bridgeSeen: boolean; resetPending: boolean }> {
  try {
    const db = await getMongoDb();
    const doc = await db.collection('whatsapp_qr').findOne({ _id: clientId as never });
    const typed = doc as { updatedAt?: Date; resetRequestedAt?: Date } | null;
    const updatedAt = typed?.updatedAt;
    return {
      bridgeSeen: !!doc,
      updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : null,
      resetPending: Boolean(typed?.resetRequestedAt),
    };
  } catch {
    return { updatedAt: null, bridgeSeen: false, resetPending: false };
  }
}

async function recentConversationAt(clientId: string): Promise<Date | null> {
  try {
    const db = await getMongoDb();
    const doc = await db.collection('conversations').findOne(
      { clientId },
      { sort: { lastMessageAt: -1 }, projection: { lastMessageAt: 1 } }
    );
    const at = (doc as { lastMessageAt?: Date } | null)?.lastMessageAt;
    return at instanceof Date && !Number.isNaN(at.getTime()) ? at : null;
  } catch {
    return null;
  }
}

async function qrDataUrlFor(clientId: string): Promise<string | null> {
  return getIzziWhatsAppQrDataUrl(clientId);
}
