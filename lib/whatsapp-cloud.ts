export type WhatsAppCloudMediaType = 'image' | 'document';

export type WhatsAppCloudSendResult = {
  ok: boolean;
  status: number;
  error?: string;
  messageId?: string;
};

async function parseGraphSendResponse(res: Response): Promise<WhatsAppCloudSendResult> {
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return { ok: false, status: res.status, error: errText.slice(0, 300) || 'Error Graph API' };
  }
  const data = (await res.json().catch(() => ({}))) as {
    messages?: Array<{ id?: string }>;
  };
  const messageId =
    Array.isArray(data.messages) && typeof data.messages[0]?.id === 'string'
      ? data.messages[0].id
      : undefined;
  return { ok: true, status: res.status, messageId };
}

/** Envío de imagen o documento vía WhatsApp Cloud API (Meta Graph). */
export async function sendWhatsAppCloudMedia(params: {
  to: string;
  mediaType: WhatsAppCloudMediaType;
  link: string;
  caption?: string;
  fileName?: string;
  phoneNumberId?: string;
  accessToken?: string;
}): Promise<WhatsAppCloudSendResult> {
  const phoneId = (
    params.phoneNumberId ||
    process.env.AGENTIA_WHATSAPP_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    ''
  ).trim();
  const token = (params.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || '').trim();

  if (!phoneId || !token) {
    return {
      ok: false,
      status: 500,
      error: 'WHATSAPP_ACCESS_TOKEN o phone_number_id no configurados',
    };
  }

  const toDigits = params.to.replace(/\D/g, '');
  if (!toDigits) {
    return { ok: false, status: 400, error: 'Número de destino inválido' };
  }

  const link = params.link.trim();
  if (!link) {
    return { ok: false, status: 400, error: 'URL de media requerida' };
  }

  const caption = params.caption?.trim();
  const payload =
    params.mediaType === 'image'
      ? {
          messaging_product: 'whatsapp',
          to: toDigits,
          type: 'image',
          image: {
            link,
            ...(caption ? { caption } : {}),
          },
        }
      : {
          messaging_product: 'whatsapp',
          to: toDigits,
          type: 'document',
          document: {
            link,
            ...(params.fileName?.trim() ? { filename: params.fileName.trim() } : {}),
            ...(caption ? { caption } : {}),
          },
        };

  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseGraphSendResponse(res);
}

/** Envío de texto vía WhatsApp Cloud API (Meta Graph). */
export async function sendWhatsAppCloudText(params: {
  to: string;
  bodyText: string;
  phoneNumberId?: string;
  accessToken?: string;
}): Promise<WhatsAppCloudSendResult> {
  const phoneId = (
    params.phoneNumberId ||
    process.env.AGENTIA_WHATSAPP_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    ''
  ).trim();
  const token = (params.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || '').trim();

  if (!phoneId || !token) {
    return {
      ok: false,
      status: 500,
      error: 'WHATSAPP_ACCESS_TOKEN o phone_number_id no configurados',
    };
  }

  const toDigits = params.to.replace(/\D/g, '');
  if (!toDigits) {
    return { ok: false, status: 400, error: 'Número de destino inválido' };
  }

  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toDigits,
      type: 'text',
      text: { body: params.bodyText },
    }),
  });

  return parseGraphSendResponse(res);
}
