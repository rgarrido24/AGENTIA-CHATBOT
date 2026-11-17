/** Panel de conversaciones Agentia — WhatsApp Cloud API oficial (+52 984 492 7769). */
export const AGENTIA_PANEL_CLIENT_ID = 'agentia-ventas';

/** Phone Number ID Meta (App 1702592241147569). */
export const AGENTIA_WHATSAPP_PHONE_NUMBER_ID_DEFAULT = '1137735859429490';

export const AGENTIA_CLOUD_PAGE_ID = 'whatsapp-cloud-agentia';

export function getAgentiaWhatsAppPhoneNumberId(): string {
  return (
    process.env.AGENTIA_WHATSAPP_PHONE_NUMBER_ID?.trim() ||
    AGENTIA_WHATSAPP_PHONE_NUMBER_ID_DEFAULT
  );
}

export const AGENTIA_PANEL_PHONE_DISPLAY = '+52 984 492 7769';

/** Página de Facebook e Instagram propios de Agentia (solo estos se muestran en el panel). */
export const AGENTIA_FB_PAGE_ID = process.env.AGENTIA_FB_PAGE_ID?.trim() || '104901035867357';
export const AGENTIA_IG_ACCOUNT_ID = process.env.AGENTIA_IG_ACCOUNT_ID?.trim() || '17841448371814783';

export function isAgentiaSocialPageId(pageId?: string | null): boolean {
  const p = String(pageId ?? '').trim();
  return Boolean(p) && (p === AGENTIA_FB_PAGE_ID || p === AGENTIA_IG_ACCOUNT_ID);
}
