/** Crea la Loyalty Class de Google Wallet de un negocio nuevo (idempotente). Solo servidor. */
import { getWalletAccessToken, getWalletIssuerId } from '@/lib/wallet-sabucan';
import { tenantClassId, type TenantConfig } from '@/lib/wallet-tenant';

const CLASS_URL = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass';

function img(uri: string, description: string) {
  return { sourceUri: { uri }, contentDescription: { defaultValue: { language: 'es-MX', value: description } } };
}

/** Banner 1032×336 con el color de la tarjeta (Cloudinary). */
export function heroDesdeLogo(logoUrl: string, hex: string): string | null {
  if (!logoUrl.includes('res.cloudinary.com') || !logoUrl.includes('/upload/')) return null;
  const bg = hex.replace('#', '');
  return logoUrl.replace(
    '/upload/',
    `/upload/c_fit,w_520,h_240/c_pad,w_1032,h_336,b_rgb:${bg},f_jpg/`,
  );
}

export async function asegurarClaseWallet(
  cfg: TenantConfig,
): Promise<{ ok: boolean; classId: string; creada: boolean; detalle?: string }> {
  const issuer = getWalletIssuerId();
  const token = await getWalletAccessToken();
  const classId = tenantClassId(cfg);
  if (!issuer || !token) return { ok: false, classId, creada: false, detalle: 'Wallet no configurado' };

  const existing = await fetch(`${CLASS_URL}/${encodeURIComponent(classId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (existing.ok) return { ok: true, classId, creada: false };

  const hero = heroDesdeLogo(cfg.logoUrl, cfg.colorPrimario);
  const rec = cfg.recompensa;
  const body: Record<string, unknown> = {
    id: classId,
    issuerName: cfg.nombre,
    programName: `Lealtad ${cfg.nombre}`,
    programLogo: img(cfg.walletLogoUrl || cfg.logoUrl, `Logo ${cfg.nombre}`),
    hexBackgroundColor: cfg.colorPrimario,
    accountNameLabel: 'Cliente',
    accountIdLabel: 'Teléfono',
    reviewStatus: 'UNDER_REVIEW',
    ...(hero ? { heroImage: img(hero, `${cfg.nombre} — bienvenida`) } : {}),
    ...(cfg.direccion || cfg.horario
      ? {
          infoModuleData: {
            labelValueRows: [
              ...(cfg.direccion ? [{ columns: [{ label: 'Dónde estamos', value: cfg.direccion }] }] : []),
              ...(cfg.horario ? [{ columns: [{ label: 'Horario', value: cfg.horario }] }] : []),
            ],
            showLastUpdateTime: false,
          },
        }
      : {}),
  };

  const res = await fetch(CLASS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    return { ok: false, classId, creada: false, detalle: `HTTP ${res.status} ${t.slice(0, 200)}` };
  }
  return { ok: true, classId, creada: true };
}


/**
 * Pase ya creado: pone el logo cuadrado sobre el color de marca (sin círculo blanco) y quita los
 * textos de la clase, que se repetían con los del pase. Idempotente.
 */
export async function actualizarClaseWallet(
  cfg: TenantConfig,
): Promise<{ ok: boolean; detalle?: string }> {
  const token = await getWalletAccessToken();
  if (!token) return { ok: false, detalle: 'Wallet no configurado' };
  const patch: Record<string, unknown> = { textModulesData: [] };
  if (cfg.walletLogoUrl) patch.programLogo = img(cfg.walletLogoUrl, `Logo ${cfg.nombre}`);
  const res = await fetch(`${CLASS_URL}/${encodeURIComponent(tenantClassId(cfg))}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return { ok: false, detalle: `HTTP ${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}` };
  return { ok: true };
}
