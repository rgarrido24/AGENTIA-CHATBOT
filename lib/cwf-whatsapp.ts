import { sendWhatsAppCloudText } from './whatsapp-cloud';

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
