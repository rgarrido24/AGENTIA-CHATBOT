/**
 * Reglas de respuesta automática por palabra clave (estilo ManyChat) para comentarios y DMs de Facebook/Instagram.
 * Se guardan en business_configs.socialRules. Si ninguna regla coincide, responde la IA como siempre.
 */
export type SocialRule = {
  id: string;
  /** Palabras que disparan la regla (sin acentos ni mayúsculas; coincide con el INICIO de una palabra: "info" cubre "información"). */
  keywords: string[];
  /** Dónde aplica. */
  channel?: 'comment' | 'dm' | 'both';
  /** Respuestas públicas bajo el comentario (se elige una al azar). Si no hay, se usa la genérica. */
  publicReplies?: string[];
  /** Mensaje privado (DM) que se envía. Si no hay, responde la IA. */
  dmMessage?: string;
  active?: boolean;
};

export function normalizeText(s: string): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchSocialRule(
  rules: SocialRule[] | undefined,
  text: string,
  kind: 'comment' | 'dm',
): SocialRule | null {
  if (!Array.isArray(rules) || rules.length === 0) return null;
  const t = normalizeText(text);
  if (!t) return null;
  for (const r of rules) {
    if (!r || r.active === false) continue;
    const ch = r.channel ?? 'both';
    if (ch !== 'both' && ch !== kind) continue;
    for (const kw of r.keywords ?? []) {
      const k = normalizeText(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (k && new RegExp(`(^|[^a-z0-9])${k}`).test(t)) return r;
    }
  }
  return null;
}

export function pickPublicReply(rule: SocialRule | null, fallback: string): string {
  const list = (rule?.publicReplies ?? []).map((s) => String(s).trim()).filter(Boolean);
  if (!list.length) return fallback;
  return list[Math.floor(Math.random() * list.length)];
}
