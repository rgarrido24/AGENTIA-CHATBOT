/** Configuración multi-tenant de lealtad (SABUCAN + demos). */

export const DEFAULT_WALLET_ISSUER_ID = '3388000000023176050';

export function getIssuerId(): string {
  return (process.env.GOOGLE_WALLET_ISSUER_ID ?? '').trim() || DEFAULT_WALLET_ISSUER_ID;
}

export type TenantId = 'sabucan' | 'barberia' | 'abarrotes';

export type TenantConfig = {
  id: TenantId;
  nombre: string;
  logoUrl: string;
  colorPrimario: string;
  colorAcento: string;
  /** Sufijo de clase Wallet (sin issuer). */
  classSuffix: string;
  /** Prefijo del object id: issuer.prefix-clienteId */
  objectPrefix: string;
  collection: string;
  /** Rutas UI base, ej. /sabucan o /demo/barberia */
  basePath: string;
  isDemo: boolean;
};

function classIdFor(suffix: string): string {
  return `${getIssuerId()}.${suffix}`;
}

const SABUCAN_LOGO =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SABUCAN_LOGO_URL?.trim()) ||
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787419176/WhatsApp_Image_2026-08-22_at_11.18.53_AM_vr2xah.jpg';

/**
 * TENANTS — demos + SABUCAN (misma lógica).
 * classId se resuelve en runtime con ISSUER_ID.
 */
export const TENANTS: Record<TenantId, TenantConfig> = {
  sabucan: {
    id: 'sabucan',
    nombre: 'SABUCAN',
    logoUrl: SABUCAN_LOGO,
    colorPrimario: '#1E2340',
    colorAcento: '#F2691F',
    classSuffix: 'sabucan_lealtad',
    objectPrefix: 'sabucan',
    collection: 'sabucan_clientes',
    basePath: '/sabucan',
    isDemo: false,
  },
  barberia: {
    id: 'barberia',
    nombre: 'Barbería El Patrón',
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787636931/WhatsApp_Image_2026-08-24_at_11.48.16_PM_mjdgvv.jpg',
    colorPrimario: '#1B2438',
    colorAcento: '#C9A227',
    classSuffix: 'demo_barberia_lealtad',
    objectPrefix: 'demo-barberia',
    collection: 'demo_barberia_clientes',
    basePath: '/demo/barberia',
    isDemo: true,
  },
  abarrotes: {
    id: 'abarrotes',
    nombre: 'Abarrotes La Providencia',
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787636931/WhatsApp_Image_2026-08-24_at_11.48.16_PM_1_x7ktpa.jpg',
    colorPrimario: '#3E7D32',
    colorAcento: '#D2691E',
    classSuffix: 'demo_abarrotes_lealtad',
    objectPrefix: 'demo-abarrotes',
    collection: 'demo_abarrotes_clientes',
    basePath: '/demo/abarrotes',
    isDemo: true,
  },
};

/** Alias pedido en el brief (solo demos). */
export const DEMO_TENANTS = {
  barberia: TENANTS.barberia,
  abarrotes: TENANTS.abarrotes,
} as const;

export function isTenantId(raw: string): raw is TenantId {
  return raw === 'sabucan' || raw === 'barberia' || raw === 'abarrotes';
}

export function isDemoNegocio(raw: string): raw is 'barberia' | 'abarrotes' {
  return raw === 'barberia' || raw === 'abarrotes';
}

export function getTenant(tenantId: string): TenantConfig | null {
  if (!isTenantId(tenantId)) return null;
  return TENANTS[tenantId];
}

export function tenantClassId(tenant: TenantConfig): string {
  return classIdFor(tenant.classSuffix);
}

export function tenantObjectId(tenant: TenantConfig, clienteId: string): string {
  const safe = String(clienteId).replace(/[^a-zA-Z0-9_-]/g, '-');
  return `${getIssuerId()}.${tenant.objectPrefix}-${safe}`;
}

export function sabucanWaDigits(telefono: string): string {
  let digits = String(telefono ?? '').replace(/\D/g, '');
  if (digits.length === 10) digits = `52${digits}`;
  if (digits.startsWith('52') && digits.length > 12) digits = digits.slice(-12);
  return digits;
}
