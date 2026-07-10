/** Logo oficial izzi (blanco) — Cloudinary */
export const IZZI_LOGO_URL =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1783708971/WhatsApp_Image_2026-07-10_at_12.39.23_PM_vludsc.jpg';

/** WhatsApp oficial izzi Mérida — 999 764 2435 */
export const IZZI_WHATSAPP_NUMBER = '529997642435';

export const IZZI_OFFER_MAX_HOURS = 12;

function izziWa(text: string) {
  return `https://wa.me/${IZZI_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const IZZI_PLAN_120 = {
  id: '120' as const,
  name: 'Internet Residencial 120 Mbps',
  speedMbps: 120,
  firstMonthPrice: 100,
  months2and3Price: 429,
  normalPrice: 480,
  subtitle: 'Internet de alta velocidad para tu hogar en Mérida',
  whatsappUrl: izziWa(
    'Hola! Quiero contratar Internet Residencial 120 Mbps en Mérida (1er mes $100, instalación sin costo).',
  ),
  offerStorageKey: 'izzi_merida_offer_end_120',
  cuposStorageKey: 'izzi_merida_cupos_120',
  popupDismissKey: 'izzi_merida_popup_120',
  popupLine: '1er mes a $100 · instalación sin costo · 120 Mbps en Mérida',
};

export const IZZI_PLAN_150 = {
  id: '150' as const,
  name: 'Internet Residencial 150 Mbps',
  speedMbps: 150,
  firstMonthPrice: 100,
  lifetimePrice: 459,
  subtitle: 'Internet de alta velocidad para tu hogar en Mérida',
  whatsappUrl: izziWa(
    'Hola! Quiero contratar Internet Residencial 150 Mbps en Mérida (1er mes $100, $459 de por vida, instalación sin costo).',
  ),
  offerStorageKey: 'izzi_merida_offer_end_150',
  cuposStorageKey: 'izzi_merida_cupos_150',
  popupDismissKey: 'izzi_merida_popup_150',
  popupLine: '1er mes a $100 · $459 de por vida · ViX Premium y Max incluidos',
  streaming: {
    vix: {
      label: 'ViX Premium',
      months: 6,
      logo: '/logos/vix-premium.svg',
    },
    max: {
      label: 'Max',
      months: 12,
      logo: '/logos/max-streaming.svg',
    },
  },
};

export type IzziPlanConfig = typeof IZZI_PLAN_120 | typeof IZZI_PLAN_150;

/** @deprecated Usar IZZI_PLAN_120 */
export const IZZI_PLAN = IZZI_PLAN_120;

/** @deprecated Usar plan.whatsappUrl */
export const IZZI_MERIDA_WA = IZZI_PLAN_120.whatsappUrl;
