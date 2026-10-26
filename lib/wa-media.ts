import { FB_GRAPH_VERSION } from '@/lib/facebook-lead-connect';
import { decryptWaToken, type WaAccountDoc, type WaMediaInfo, type WaLocation } from '@/lib/wa-accounts';

/**
 * Multimedia de la bandeja de WhatsApp: leer lo que manda la persona (fotos, audios, videos, documentos,
 * ubicación…) y mandar adjuntos desde el panel. Meta guarda los archivos ~30 días; se descargan al abrirlos.
 */

export type WaMediaKind = 'image' | 'audio' | 'video' | 'document';

const GRAPH = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;

// ─── Entrantes ───────────────────────────────────────────────────────────────

const MEDIA_LABEL: Record<string, string> = {
  image: '📷 Imagen',
  audio: '🎤 Audio',
  video: '🎥 Video',
  document: '📄 Documento',
  sticker: '🙂 Sticker',
};

export type InboundContent = {
  type: string;
  /** Lo que se ve en la lista y en las notificaciones. */
  text: string;
  /** Solo el pie de foto / texto propio del mensaje (sin etiqueta). */
  caption?: string;
  media?: WaMediaInfo;
  location?: WaLocation;
};

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/** Interpreta un mensaje de Cloud API (cualquier tipo) para guardarlo y mostrarlo. */
export function extractInboundContent(m: Record<string, unknown>): InboundContent {
  const type = str(m.type) ?? 'unknown';

  if (type === 'text') {
    const body = str((m.text as { body?: unknown } | undefined)?.body) ?? '';
    return { type, text: body, caption: body };
  }

  if (type === 'image' || type === 'audio' || type === 'video' || type === 'document' || type === 'sticker') {
    const o = (m[type] ?? {}) as Record<string, unknown>;
    const id = str(o.id);
    const caption = str(o.caption);
    const media: WaMediaInfo | undefined = id
      ? { id, mime: str(o.mime_type), filename: str(o.filename), caption, voice: o.voice === true ? true : undefined }
      : undefined;
    const label = type === 'audio' && o.voice === true ? '🎤 Nota de voz' : MEDIA_LABEL[type];
    return { type, text: caption ? `${label}: ${caption}` : label, caption, media };
  }

  if (type === 'location') {
    const o = (m.location ?? {}) as Record<string, unknown>;
    const lat = Number(o.latitude);
    const lng = Number(o.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const name = str(o.name) ?? str(o.address);
      return { type, text: name ? `📍 Ubicación: ${name}` : '📍 Ubicación', location: { lat, lng, name: str(o.name), address: str(o.address) } };
    }
  }

  if (type === 'contacts') {
    const list = Array.isArray(m.contacts) ? (m.contacts as Array<{ name?: { formatted_name?: string } }>) : [];
    const names = list.map((c) => c.name?.formatted_name).filter(Boolean).join(', ');
    return { type, text: names ? `👤 Contacto: ${names}` : '👤 Contacto' };
  }

  if (type === 'button') {
    const t = str((m.button as { text?: unknown } | undefined)?.text);
    if (t) return { type, text: t, caption: t };
  }

  if (type === 'interactive') {
    const i = (m.interactive ?? {}) as { button_reply?: { title?: unknown }; list_reply?: { title?: unknown } };
    const t = str(i.button_reply?.title) ?? str(i.list_reply?.title);
    if (t) return { type, text: t, caption: t };
  }

  if (type === 'reaction') {
    const emoji = str((m.reaction as { emoji?: unknown } | undefined)?.emoji);
    return { type, text: emoji ? `Reaccionó con ${emoji}` : 'Quitó su reacción' };
  }

  return { type, text: `[${type}]` };
}

// ─── Descargar de Meta ───────────────────────────────────────────────────────

/** Máximo que se sirve por el panel (memoria del servidor). */
export const MEDIA_DOWNLOAD_MAX = 40 * 1024 * 1024;

export async function fetchWaMedia(
  acc: WaAccountDoc,
  mediaId: string,
): Promise<{ ok: true; bytes: Buffer; mime: string } | { ok: false; status: number; error: string }> {
  const token = decryptWaToken(acc);
  const meta = await fetch(`${GRAPH}/${encodeURIComponent(mediaId)}`, { headers: { Authorization: `Bearer ${token}` } });
  const mj = (await meta.json().catch(() => ({}))) as { url?: string; mime_type?: string; file_size?: number; error?: { message?: string } };
  if (!meta.ok || !mj.url) {
    return { ok: false, status: meta.status === 404 ? 404 : 502, error: mj.error?.message || 'Meta ya no tiene este archivo (los guarda unos 30 días)' };
  }
  if (typeof mj.file_size === 'number' && mj.file_size > MEDIA_DOWNLOAD_MAX) {
    return { ok: false, status: 413, error: 'El archivo es demasiado grande para verlo aquí' };
  }
  const file = await fetch(mj.url, { headers: { Authorization: `Bearer ${token}` } });
  if (!file.ok) return { ok: false, status: 502, error: `No se pudo descargar el archivo (HTTP ${file.status})` };
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MEDIA_DOWNLOAD_MAX) return { ok: false, status: 413, error: 'El archivo es demasiado grande para verlo aquí' };
  return { ok: true, bytes, mime: mj.mime_type || file.headers.get('content-type') || 'application/octet-stream' };
}

// ─── Enviar adjuntos ─────────────────────────────────────────────────────────

const ALLOWED: Array<{ kind: WaMediaKind; mimes: string[]; maxBytes: number }> = [
  { kind: 'image', mimes: ['image/jpeg', 'image/png'], maxBytes: 5 * 1024 * 1024 },
  { kind: 'audio', mimes: ['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg'], maxBytes: 16 * 1024 * 1024 },
  { kind: 'video', mimes: ['video/mp4', 'video/3gpp'], maxBytes: 16 * 1024 * 1024 },
  {
    kind: 'document',
    mimes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ],
    maxBytes: 20 * 1024 * 1024,
  },
];

export function classifyOutboundFile(mimeRaw: string, size: number): { ok: true; kind: WaMediaKind; mime: string } | { ok: false; error: string } {
  const mime = mimeRaw.split(';')[0].trim().toLowerCase();
  const rule = ALLOWED.find((r) => r.mimes.includes(mime));
  if (!rule) {
    return { ok: false, error: 'Ese tipo de archivo no lo acepta WhatsApp. Usa foto JPG o PNG, audio, video MP4, PDF, Word, Excel o PowerPoint.' };
  }
  if (size <= 0) return { ok: false, error: 'El archivo está vacío' };
  if (size > rule.maxBytes) {
    return { ok: false, error: `El archivo pesa demasiado (máximo ${Math.round(rule.maxBytes / 1024 / 1024)} MB para este tipo)` };
  }
  return { ok: true, kind: rule.kind, mime };
}

type GraphErr = { error?: { message?: string; error_user_msg?: string } };
const errText = (e: GraphErr['error']) => (e?.error_user_msg || e?.message || 'Error de Meta').slice(0, 300);

/** Sube el archivo a Meta y lo manda a la persona (solo dentro de la ventana de 24 h). */
export async function sendWaAttachment(
  acc: WaAccountDoc,
  to: string,
  file: { bytes: Buffer; mime: string; filename: string; kind: WaMediaKind },
  caption?: string,
): Promise<{ ok: true; wamid: string; mediaId: string } | { ok: false; error: string }> {
  const token = decryptWaToken(acc);
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', file.mime);
  form.append('file', new Blob([new Uint8Array(file.bytes)], { type: file.mime }), file.filename);
  const up = await fetch(`${GRAPH}/${acc.phoneNumberId}/media`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  const uj = (await up.json().catch(() => ({}))) as GraphErr & { id?: string };
  if (!up.ok || !uj.id) return { ok: false, error: errText(uj.error) };

  const payload: Record<string, unknown> = { id: uj.id };
  if (file.kind !== 'audio' && caption) payload.caption = caption.slice(0, 1024);
  if (file.kind === 'document') payload.filename = file.filename;
  const res = await fetch(`${GRAPH}/${acc.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: file.kind, [file.kind]: payload }),
  });
  const rj = (await res.json().catch(() => ({}))) as GraphErr & { messages?: Array<{ id?: string }> };
  const wamid = rj.messages?.[0]?.id;
  if (!res.ok || !wamid) return { ok: false, error: errText(rj.error) };
  return { ok: true, wamid, mediaId: uj.id };
}
