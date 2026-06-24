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
