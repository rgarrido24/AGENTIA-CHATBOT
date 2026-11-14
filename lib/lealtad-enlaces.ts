/** Enlaces públicos del "link para redes" de cada negocio (/l/<negocio>). Solo servidor. */
export const CAMPOS_ENLACES = ['menuUrl', 'mapsUrl', 'whatsapp', 'instagram', 'facebook', 'tiktok', 'web'] as const;
export type CampoEnlace = (typeof CAMPOS_ENLACES)[number];
export type Enlaces = { descripcion: string } & Record<CampoEnlace, string>;

export const ENLACES_VACIOS: Enlaces = {
  descripcion: '', menuUrl: '', mapsUrl: '', whatsapp: '', instagram: '', facebook: '', tiktok: '', web: '',
};

function urlSegura(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  const conProto = /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;
  try {
    const u = new URL(conProto);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.toString().slice(0, 500);
  } catch {
    return '';
  }
}

function perfil(raw: string, base: string): string {
  const s = raw.trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || s.includes('.')) return urlSegura(s);
  return `${base}${s.replace(/^@/, '').replace(/[^\w.]/g, '')}`;
}

/** Normaliza lo que manda el panel; descarta URLs raras (javascript:, etc.). */
export function limpiarEnlaces(input: Record<string, unknown>): Enlaces {
  const g = (k: string) => String(input[k] ?? '');
  const wa = g('whatsapp').replace(/\D/g, '');
  return {
    descripcion: g('descripcion').trim().slice(0, 160),
    menuUrl: urlSegura(g('menuUrl')),
    mapsUrl: urlSegura(g('mapsUrl')),
    whatsapp: wa.length === 10 ? `52${wa}` : wa.slice(0, 15),
    instagram: perfil(g('instagram'), 'https://instagram.com/'),
    facebook: perfil(g('facebook'), 'https://facebook.com/'),
    tiktok: perfil(g('tiktok'), 'https://tiktok.com/@'),
    web: urlSegura(g('web')),
  };
}
