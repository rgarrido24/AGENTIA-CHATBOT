/** Logo oficial izzi (blanco) — Cloudinary */
export const IZZI_LOGO_URL =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1783708971/WhatsApp_Image_2026-07-10_at_12.39.23_PM_vludsc.jpg';

export const IZZI_OFFER_MAX_HOURS = 12;

export const IZZI_PLAN_120 = {
  id: '120' as const,
  name: 'Internet Residencial 120 Mbps',
  speedMbps: 120,
  firstMonthPrice: 100,
  months2and3Price: 429,
  normalPrice: 480,
  subtitle: 'Internet de alta velocidad para tu hogar en Mérida',
  whatsappUrl:
    'https://wa.me/529844927769?text=Hola!%20Quiero%20contratar%20Internet%20Residencial%20120%20Mbps%20en%20M%C3%A9rida%20(1er%20mes%20%24100%2C%20instalaci%C3%B3n%20sin%20costo).',
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
  whatsappUrl:
    'https://wa.me/529844927769?text=Hola!%20Quiero%20contratar%20Internet%20Residencial%20150%20Mbps%20en%20M%C3%A9rida%20(1er%20mes%20%24100%2C%20%24459%20de%20por%20vida%2C%20instalaci%C3%B3n%20sin%20costo).',
  offerStorageKey: 'izzi_merida_offer_end_150',
  cuposStorageKey: 'izzi_merida_cupos_150',
  popupDismissKey: 'izzi_merida_popup_150',
  popupLine: '1er mes a $100 · $459 de por vida · ViX Premium y Max incluidos',
  streaming: {
    vix: {
      label: 'ViX Premium',
      months: 6,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/ViX_logo.svg/320px-ViX_logo.svg.png',
    },
    max: {
      label: 'Max',
      months: 12,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Max_%28streaming_service%29_logo.svg/320px-Max_%28streaming_service%29_logo.svg.png',
    },
  },
};

export type IzziPlanConfig = typeof IZZI_PLAN_120 | typeof IZZI_PLAN_150;

/** @deprecated Usar IZZI_PLAN_120 */
export const IZZI_PLAN = IZZI_PLAN_120;

/** @deprecated Usar plan.whatsappUrl */
export const IZZI_MERIDA_WA = IZZI_PLAN_120.whatsappUrl;
