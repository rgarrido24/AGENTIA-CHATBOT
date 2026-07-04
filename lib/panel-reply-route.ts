import { NextRequest } from 'next/server';
import { preparePanelAttachment } from '@/lib/panel-attachment';
import type { PanelConversation } from '@/lib/panel-conversations';
import type { WhatsAppCloudMediaType } from '@/lib/whatsapp-cloud';

export type PanelReplyPayload =
  | { kind: 'text'; text: string }
  | { kind: 'attachment'; buffer: Buffer; mimeType: string; fileName: string; caption: string };

export async function parsePanelReplyRequest(req: NextRequest): Promise<PanelReplyPayload | { error: string; status: number }> {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    const caption = typeof form.get('message') === 'string' ? String(form.get('message')).trim() : '';

    if (!file || typeof file === 'string') {
      return { error: 'file requerido', status: 400 };
    }

    const blob = file as File;
    const buffer = Buffer.from(await blob.arrayBuffer());
    return {
      kind: 'attachment',
      buffer,
      mimeType: blob.type || 'application/octet-stream',
      fileName: blob.name || 'archivo',
      caption,
    };
  }

  const body = await req.json().catch(() => ({}));
  const text = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!text) {
    return { error: 'message requerido', status: 400 };
  }
  return { kind: 'text', text };
}

export async function buildAttachmentFromPayload(
  payload: Extract<PanelReplyPayload, { kind: 'attachment' }>,
  cloudinaryFolder: string,
) {
  return preparePanelAttachment({
    buffer: payload.buffer,
    mimeType: payload.mimeType,
    fileName: payload.fileName,
    caption: payload.caption,
    cloudinaryFolder,
  });
}

export type PanelWhatsAppSenders = {
  sendText: (to: string, text: string) => Promise<{ ok: boolean; status: number; error?: string }>;
  sendMedia: (
    to: string,
    params: { mediaType: WhatsAppCloudMediaType; link: string; caption?: string; fileName?: string },
  ) => Promise<{ ok: boolean; status: number; error?: string }>;
};

export async function sendPanelWhatsAppReply(
  conv: PanelConversation,
  payload: PanelReplyPayload,
  senders: PanelWhatsAppSenders,
  cloudinaryFolder: string,
): Promise<
  | { ok: true; entry: { role: 'agent'; content: string; mediaType?: 'image' | 'document'; mediaUrl?: string; fileName?: string } }
  | { ok: false; status: number; error: string }
> {
  if (payload.kind === 'text') {
    const sent = await senders.sendText(conv.senderId, payload.text);
    if (!sent.ok) {
      return { ok: false, status: sent.status || 502, error: sent.error || 'No se pudo enviar por WhatsApp' };
    }
    return { ok: true, entry: { role: 'agent', content: payload.text } };
  }

  const prepared = await buildAttachmentFromPayload(payload, cloudinaryFolder);
  if (!prepared.ok) {
    return { ok: false, status: prepared.status, error: prepared.error };
  }

  const { mediaType, mediaUrl, fileName, caption } = prepared.data;
  const sent = await senders.sendMedia(conv.senderId, {
    mediaType,
    link: mediaUrl,
    caption: caption || undefined,
    fileName,
  });
  if (!sent.ok) {
    return { ok: false, status: sent.status || 502, error: sent.error || 'No se pudo enviar adjunto por WhatsApp' };
  }

  return {
    ok: true,
    entry: {
      role: 'agent',
      content: caption,
      mediaType,
      mediaUrl,
      fileName,
    },
  };
}
