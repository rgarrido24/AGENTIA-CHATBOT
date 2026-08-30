import { getMongoDb } from '@/lib/mongodb';
import { IZZI_CLIENT_ID } from '@/lib/izzi-panel';
import type { WhatsAppCloudSendResult } from '@/lib/whatsapp-cloud';

function digits(to: string): string {
  return String(to || '').replace(/\D/g, '');
}

/**
 * Izzi usa el bridge Baileys, que envía salientes desde `outbound_messages`.
 * No usar Cloud API: el número de izzi no está en Meta Graph.
 */
export async function sendIzziWhatsAppText(
  to: string,
  bodyText: string
): Promise<WhatsAppCloudSendResult> {
  const phone = digits(to);
  if (!phone) return { ok: false, status: 400, error: 'Número de destino inválido' };
  const text = bodyText.trim();
  if (!text) return { ok: false, status: 400, error: 'Mensaje vacío' };

  const db = await getMongoDb();
  await db.collection('outbound_messages').insertOne({
    leadId: `${phone}_wa_${IZZI_CLIENT_ID}`,
    senderId: phone,
    clientId: IZZI_CLIENT_ID,
    message: text,
    source: 'izzi-panel',
    createdAt: new Date(),
  });
  return { ok: true, status: 200 };
}

export async function sendIzziWhatsAppMedia(
  to: string,
  params: { mediaType: 'image' | 'document'; link: string; caption?: string; fileName?: string }
): Promise<WhatsAppCloudSendResult> {
  const phone = digits(to);
  if (!phone) return { ok: false, status: 400, error: 'Número de destino inválido' };
  const link = params.link.trim();
  if (!link) return { ok: false, status: 400, error: 'URL de media requerida' };

  const caption = params.caption?.trim() || '';
  const db = await getMongoDb();
  await db.collection('outbound_messages').insertOne({
    leadId: `${phone}_wa_${IZZI_CLIENT_ID}`,
    senderId: phone,
    clientId: IZZI_CLIENT_ID,
    message: caption,
    mediaUrl: link,
    mediaType: params.mediaType,
    fileName: params.fileName || undefined,
    source: 'izzi-panel',
    createdAt: new Date(),
  });
  return { ok: true, status: 200 };
}
