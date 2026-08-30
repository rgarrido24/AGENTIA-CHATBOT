import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { enqueueOutbound } from '@/src/lib/outbound-queue';
import type { PanelConversation, PanelMessage } from '@/lib/client-panel-store';

const CLIENT_ID = 'biovela';
const COLLECTION = 'conversations';
const MIN_IDLE_MS = 24 * 60 * 60 * 1000;
const MAX_IDLE_MS = 72 * 60 * 60 * 1000;
const FOLLOWUP_STAGES = ['pregunton', 'interesado'] as const;

export type BiovelaFollowupResult = {
  scanned: number;
  sent: number;
  skipped: number;
  errors: Array<{ phone: string; error: string }>;
};

function firstName(raw: string | undefined, fallbackPhone: string): string {
  const name = String(raw || '').trim();
  if (!name || name === fallbackPhone) return 'amigo';
  return name.split(/\s+/)[0] || 'amigo';
}

export function getLastConsultedProduct(conv: PanelConversation): string {
  const msgs = [...(conv.messages || [])].reverse();
  for (const m of msgs) {
    if (m.productCard?.name?.trim()) return m.productCard.name.trim();
  }

  for (const m of msgs) {
    if (m.role !== 'user') continue;
    const text = m.content.trim();
    if (text.length >= 4) {
      const cleaned = text.replace(/[?!.]+$/g, '').trim();
      if (cleaned.length >= 4 && cleaned.length <= 80) return cleaned;
    }
  }

  return 'nuestros productos';
}

export function buildBiovelaFollowupMessage(conv: PanelConversation): string {
  const name = firstName(conv.contactName, conv.phone);
  const product = getLastConsultedProduct(conv);
  return (
    `Hola ${name}! 🕯 Seguimos aquí para ayudarte. ` +
    `¿Pudiste decidirte sobre ${product}? ` +
    `Si tienes alguna duda con gusto te ayudamos.`
  );
}

export async function findBiovelaConversationsForFollowup(limit = 50): Promise<PanelConversation[]> {
  const db = await getMongoDb();
  const now = Date.now();
  const updatedBefore = new Date(now - MIN_IDLE_MS);
  const updatedAfter = new Date(now - MAX_IDLE_MS);

  const docs = await db
    .collection<PanelConversation>(COLLECTION)
    .find({
      clientId: CLIENT_ID,
      stage: { $in: [...FOLLOWUP_STAGES] },
      updatedAt: { $lte: updatedBefore, $gt: updatedAfter },
      $or: [{ followupSent: { $exists: false } }, { followupSent: false }],
      humanMode: { $ne: true },
      phone: { $exists: true, $ne: '' },
    })
    .limit(limit)
    .toArray();

  return docs;
}

async function markFollowupSent(conv: PanelConversation, message: string): Promise<void> {
  if (!conv._id) return;
  const db = await getMongoDb();
  const botMsg: PanelMessage = {
    id: new ObjectId().toHexString(),
    role: 'bot',
    content: message,
    createdAt: new Date(),
  };
  const now = new Date();

  await db.collection<PanelConversation>(COLLECTION).updateOne(
    { _id: conv._id },
    {
      $set: {
        followupSent: true,
        followupSentAt: now,
        updatedAt: now,
      },
      $push: { messages: botMsg },
    },
  );
}

export async function processBiovelaFollowups(limit = 50): Promise<BiovelaFollowupResult> {
  const conversations = await findBiovelaConversationsForFollowup(limit);
  const result: BiovelaFollowupResult = {
    scanned: conversations.length,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  for (const conv of conversations) {
    const phone = String(conv.phone || '').replace(/\D/g, '');
    if (!phone) {
      result.skipped += 1;
      continue;
    }

    const message = buildBiovelaFollowupMessage(conv);

    try {
      await enqueueOutbound({
        senderId: phone,
        clientId: CLIENT_ID,
        message,
        type: 'followup',
        delaySeconds: 5 + result.sent * 8,
      });
      await markFollowupSent(conv, message);
      result.sent += 1;
    } catch (err) {
      result.errors.push({
        phone,
        error: err instanceof Error ? err.message : 'followup_failed',
      });
    }
  }

  return result;
}
