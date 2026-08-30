import { uploadPanelAttachment } from '@/lib/cloudinary-panel';
import {
  isAllowedPanelAttachment,
  mimeToWaMediaType,
  type PanelWaMediaType,
} from '@/lib/panel-media';

export type PanelAttachmentInput = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  caption?: string;
  cloudinaryFolder: string;
};

export type PanelAttachmentPrepared = {
  mediaType: PanelWaMediaType;
  mediaUrl: string;
  fileName: string;
  caption: string;
};

export async function preparePanelAttachment(
  input: PanelAttachmentInput,
): Promise<{ ok: true; data: PanelAttachmentPrepared } | { ok: false; status: number; error: string }> {
  const validation = isAllowedPanelAttachment(input.mimeType, input.buffer.length);
  if (validation) {
    return { ok: false, status: 400, error: validation };
  }

  try {
    const uploaded = await uploadPanelAttachment(input.buffer, {
      folder: input.cloudinaryFolder,
      fileName: input.fileName,
      mimeType: input.mimeType,
    });
    const mediaType = mimeToWaMediaType(input.mimeType);
    return {
      ok: true,
      data: {
        mediaType,
        mediaUrl: uploaded.url,
        fileName: input.fileName,
        caption: input.caption?.trim() || '',
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al subir a Cloudinary';
    return { ok: false, status: 500, error: msg };
  }
}
