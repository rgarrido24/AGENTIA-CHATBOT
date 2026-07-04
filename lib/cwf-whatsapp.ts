import { sendWhatsAppCloudMedia, sendWhatsAppCloudText, type WhatsAppCloudMediaType } from './whatsapp-cloud';

/** Envío CWF vía WhatsApp Cloud API. */
export async function sendCwfWhatsAppText(
  to: string,
  bodyText: string
): Promise<{ ok: boolean; status: number; error?: string }> {
  return sendWhatsAppCloudText({
    to,
    bodyText,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  });
}

export async function sendCwfWhatsAppMedia(
  to: string,
  params: { mediaType: WhatsAppCloudMediaType; link: string; caption?: string; fileName?: string },
): Promise<{ ok: boolean; status: number; error?: string }> {
  return sendWhatsAppCloudMedia({
    to,
    ...params,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  });
}
