export type PanelWaMediaType = 'image' | 'document';

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_MIMES = new Set([
  ...IMAGE_MIMES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

export const PANEL_ATTACHMENT_MAX_BYTES = 16 * 1024 * 1024;

export function isAllowedPanelAttachment(mime: string, size: number): string | null {
  if (size <= 0) return 'Archivo vacío';
  if (size > PANEL_ATTACHMENT_MAX_BYTES) return 'El archivo supera 16 MB';
  const m = (mime || '').toLowerCase();
  if (!ALLOWED_MIMES.has(m)) return 'Tipo de archivo no permitido';
  return null;
}

export function mimeToWaMediaType(mime: string): PanelWaMediaType {
  return IMAGE_MIMES.has((mime || '').toLowerCase()) ? 'image' : 'document';
}

export function panelMediaLastMessageLabel(
  mediaType: PanelWaMediaType,
  fileName?: string,
  caption?: string,
): string {
  if (caption?.trim()) return caption.trim();
  if (mediaType === 'image') return '📷 Imagen';
  return `📎 ${fileName?.trim() || 'Documento'}`;
}
