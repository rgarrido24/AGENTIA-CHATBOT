import {
  sendWhatsAppCloudMedia,
  sendWhatsAppCloudText,
  type WhatsAppCloudMediaType,
  type WhatsAppCloudSendResult,
} from './whatsapp-cloud';

/** Envío CWF vía WhatsApp Cloud API. */
export async function sendCwfWhatsAppText(
  to: string,
  bodyText: string
): Promise<WhatsAppCloudSendResult> {
  return sendWhatsAppCloudText({
    to,
    bodyText,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  });
}

export async function sendCwfWhatsAppMedia(
  to: string,
  params: { mediaType: WhatsAppCloudMediaType; link: string; caption?: string; fileName?: string },
): Promise<WhatsAppCloudSendResult> {
  return sendWhatsAppCloudMedia({
    to,
    ...params,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  });
}
