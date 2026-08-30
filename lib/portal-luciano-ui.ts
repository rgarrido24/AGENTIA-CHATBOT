/**
 * UI del portal de Luciano: tema claro por defecto + toggle.
 * Clave localStorage compartida entre login de cliente y panel de leads.
 */

export const LUCINO_PRODUCT_TITLE = 'Panel Gestor de Leads';
/** Título e imagen OG para previews (WhatsApp, etc.) — marca Luciano. */
export const LUCINO_OG_TITLE = 'Luciano Ads Mánager · Panel de Leads';
export const LUCINO_OG_IMAGE = '/luciano-logo.png';
export const LUCINO_THEME_STORAGE_KEY = 'agentia_portal_luciano_theme';

export type LucianoThemeMode = 'light' | 'dark';

export function isLucianoReseller(resellerId: string): boolean {
  return resellerId.trim().toLowerCase() === 'luciano';
}

export function readLucianoTheme(): LucianoThemeMode {
  if (typeof window === 'undefined') return 'light';
  const v = window.localStorage.getItem(LUCINO_THEME_STORAGE_KEY);
  return v === 'dark' ? 'dark' : 'light';
}

export function writeLucianoTheme(mode: LucianoThemeMode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LUCINO_THEME_STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent('agentia-luciano-theme', { detail: mode }));
}
