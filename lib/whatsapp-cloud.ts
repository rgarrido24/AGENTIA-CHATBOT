/** Envío de texto vía WhatsApp Cloud API (Meta Graph). */
export async function sendWhatsAppCloudText(params: {
  to: string;
  bodyText: string;
  phoneNumberId?: string;
  accessToken?: string;
}): Promise<{ ok: boolean; status: number; error?: string }> {
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

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return { ok: false, status: res.status, error: errText.slice(0, 300) || 'Error Graph API' };
  }
  return { ok: true, status: res.status };
}
