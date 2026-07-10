/** Contacto comercial Agentia (México, E.164 sin +). */
export const AGENTIA_WHATSAPP_DIGITS_E164 = '529844927769';

export const AGENTIA_WHATSAPP_DISPLAY = '984 492 7769';

export const AGENTIA_WHATSAPP_URL = `https://wa.me/${AGENTIA_WHATSAPP_DIGITS_E164}`;

export function agentiaWhatsAppUrl(message?: string): string {
  if (!message?.trim()) return AGENTIA_WHATSAPP_URL;
  return `${AGENTIA_WHATSAPP_URL}?text=${encodeURIComponent(message.trim())}`;
}

export function resolveAgentiaWhatsAppDigits(envDigits?: string | null): string {
  const fromEnv = envDigits?.replace(/\D/g, '').trim();
  if (fromEnv && fromEnv.length >= 10) return fromEnv;
  return AGENTIA_WHATSAPP_DIGITS_E164;
}
