export const RGO_LOGO_CLOUDINARY =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1788314258/WhatsApp_Image_2026-09-01_at_7.55.46_PM_qvudlj.jpg';

export type IzziPanelVisualBrand = {
  id: 'izzi' | 'rgo';
  name: string;
  logoSrc: string | null;
  bg: string;
  bgMid: string;
  card: string;
  border: string;
  accent: string;
  accentHover: string;
  heading: string;
  muted: string;
  label: string;
  avatarBg: string;
  avatarFg: string;
  activeRow: string;
  sendClass: string;
  attachClass: string;
  textareaClass: string;
  selectClass: string;
  pwaName: string;
  shortName: string;
  pwaDescription: string;
  iconBase: string;
  manifestPath: string;
  appleIcon: string;
};

const IZZI_BRAND: IzziPanelVisualBrand = {
  id: 'izzi',
  name: 'izzi',
  logoSrc: null,
  bg: '#140810',
  bgMid: '#2a0a1c',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(236, 0, 140, 0.22)',
  accent: '#EC008C',
  accentHover: '#f43f9d',
  heading: 'text-pink-50',
  muted: 'text-pink-200/50',
  label: 'text-pink-400/80',
  avatarBg: 'bg-pink-900/40',
  avatarFg: 'text-pink-400',
  activeRow: 'bg-pink-900/25',
  sendClass: 'bg-[#EC008C] hover:bg-pink-500',
  attachClass: 'border-pink-500/50 bg-pink-600/25 text-pink-100 hover:bg-pink-600/40',
  textareaClass:
    'flex-1 min-w-0 resize-none rounded-xl px-4 py-3 bg-stone-950/80 border border-pink-900/40 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-pink-600 disabled:opacity-50 text-sm min-h-[44px]',
  selectClass:
    'rounded-lg border bg-stone-950/70 px-2.5 py-2 text-xs text-pink-50 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-pink-600',
  pwaName: 'izzi — Panel',
  shortName: 'izzi Panel',
  pwaDescription: 'Conversaciones WhatsApp izzi: ventas y reclutamiento',
  iconBase: '/pwa/izzi',
  manifestPath: '/izzi-panel/manifest.webmanifest',
  appleIcon: '/pwa/izzi/icon-192.png',
};

const RGO_BRAND: IzziPanelVisualBrand = {
  id: 'rgo',
  name: 'RGO',
  logoSrc: '/pwa/rgo/icon-192.png',
  bg: '#070B16',
  bgMid: '#0D1B3E',
  card: 'rgba(61, 107, 196, 0.06)',
  border: 'rgba(61, 107, 196, 0.32)',
  accent: '#3D6BC4',
  accentHover: '#5480d6',
  heading: 'text-slate-100',
  muted: 'text-blue-200/50',
  label: 'text-blue-300/80',
  avatarBg: 'bg-blue-900/40',
  avatarFg: 'text-blue-300',
  activeRow: 'bg-blue-900/30',
  sendClass: 'bg-[#3D6BC4] hover:bg-[#5480d6]',
  attachClass: 'border-blue-400/40 bg-blue-600/20 text-blue-100 hover:bg-blue-600/35',
  textareaClass:
    'flex-1 min-w-0 resize-none rounded-xl px-4 py-3 bg-slate-950/80 border border-blue-900/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm min-h-[44px]',
  selectClass:
    'rounded-lg border bg-slate-950/70 px-2.5 py-2 text-xs text-slate-100 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-blue-500',
  pwaName: 'RGO — Panel',
  shortName: 'RGO',
  pwaDescription: 'Conversaciones WhatsApp RGO',
  iconBase: '/pwa/rgo',
  manifestPath: '/izzi-panel/rgo.webmanifest',
  appleIcon: '/pwa/rgo/apple-touch-icon.png',
};

export function isRgoTenant(clientId: string | null | undefined): boolean {
  return String(clientId || '').trim().toLowerCase() === 'izzi-2';
}

export function izziPanelBrand(clientId: string | null | undefined): IzziPanelVisualBrand {
  return isRgoTenant(clientId) ? RGO_BRAND : IZZI_BRAND;
}
