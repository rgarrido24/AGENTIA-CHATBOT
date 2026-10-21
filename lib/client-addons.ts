/**
 * Add-ons por cliente del panel de reseller (apagados por defecto).
 * Se guardan en el documento reseller_client: `addons: { whatsappApi, forms }`.
 */
export const ADDON_KEYS = ['whatsappApi', 'forms'] as const;
export type AddonKey = (typeof ADDON_KEYS)[number];
export type ClientAddons = Partial<Record<AddonKey, boolean>>;

export const ADDON_LABELS: Record<AddonKey, string> = {
  whatsappApi: 'API de WhatsApp (campañas)',
  forms: 'Formularios a WhatsApp',
};

export function isAddonKey(value: string): value is AddonKey {
  return (ADDON_KEYS as readonly string[]).includes(value);
}

/** Normaliza lo guardado en Mongo: siempre devuelve ambas llaves en boolean. */
export function normalizeAddons(raw: unknown): Record<AddonKey, boolean> {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    whatsappApi: src.whatsappApi === true,
    forms: src.forms === true,
  };
}

export function isAddonEnabled(client: object | null | undefined, key: AddonKey): boolean {
  return normalizeAddons((client as { addons?: unknown } | null | undefined)?.addons)[key];
}
