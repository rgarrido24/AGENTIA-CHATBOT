/** Configuración multi-tenant de lealtad (SABUCAN + demos). */

export const DEFAULT_WALLET_ISSUER_ID = '3388000000023176050';

export function getIssuerId(): string {
  return (process.env.GOOGLE_WALLET_ISSUER_ID ?? '').trim() || DEFAULT_WALLET_ISSUER_ID;
}

export type DemoNegocio = 'cafe' | 'barberia' | 'abarrotes';

export type TenantId = 'sabucan' | 'carnitas_granada' | DemoNegocio;

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
  /** % de cashback en puntos (1 punto = $1 MXN). 1 = 1 pt por cada $100. */
  cashbackPct: number;
  /** Logo horizontal para la vista de lista de Wallet. */
  wideLogoUrl?: string;
  /** Teléfono del negocio para el botón de WhatsApp del pase. */
  waNumber?: string;
  /** URL de Google Maps del local. */
  mapsUrl?: string;
  direccion?: string;
  horario?: string;
  /** Coordenadas para el aviso de Wallet al pasar cerca del local. */
  ubicacion?: { lat: number; lng: number };
};

/**
 * Primer valor no vacío. Recibe los `process.env.X` ya resueltos porque Next
 * solo inlinea las NEXT_PUBLIC_* cuando se leen de forma estática.
 */
function pick(...values: (string | undefined)[]): string | undefined {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return undefined;
}

/**
 * Deriva una variante horizontal de una imagen de Cloudinary rellenando con
 * el color de marca, para no recortar logos cuadrados en el hero del pase.
 */
function cloudinaryBanner(
  url: string | undefined,
  width: number,
  height: number,
  hexBg: string,
): string | undefined {
  if (!url || !url.includes('/upload/')) return url;
  const bg = hexBg.replace('#', '').toLowerCase();
  return url.replace(
    '/upload/',
    `/upload/c_pad,w_${width},h_${height},b_rgb:${bg}/`,
  );
}

function parseLatLng(raw: string | undefined): { lat: number; lng: number } | undefined {
  if (!raw) return undefined;
  const [latRaw, lngRaw] = raw.split(',');
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { lat, lng };
}

function classIdFor(suffix: string): string {
  return `${getIssuerId()}.${suffix}`;
}

const SABUCAN_LOGO =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SABUCAN_LOGO_URL?.trim()) ||
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787945953/sabucan-logo-transparente_kywnjn.png';

const CARNITAS_LOGO =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CARNITAS_LOGO_URL?.trim()) ||
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787786595/FB_IMG_1787786585040_kenlnk.jpg';

const CAFE_LOGO =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787942156/cafe-luna-logo-transparente_xskmgn.png';

const BARBERIA_LOGO =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787941859/barberia-el-patron-logo-transparente_ej3ruw.png';

const ABARROTES_LOGO =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787941811/abarrotes-la-providencia-logo-transparente_jgk7kf.png';

/** Cashback de Carnitas Granada — ajustable sin deploy. Default 5%. */
function carnitasCashbackPct(): number {
  const raw =
    (typeof process !== 'undefined' &&
      (process.env.NEXT_PUBLIC_CARNITAS_CASHBACK_PCT ?? process.env.CARNITAS_CASHBACK_PCT)) ||
    '';
  const pct = Number(String(raw).trim());
  return Number.isFinite(pct) && pct > 0 ? pct : 5;
}

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
    cashbackPct: 1,
    wideLogoUrl: pick(
      process.env.NEXT_PUBLIC_SABUCAN_WIDE_LOGO_URL,
      cloudinaryBanner(SABUCAN_LOGO, 660, 220, '#1E2340'),
    ),
    // Datos de contacto solo si el cliente real los define: no inventamos
    // direcciones ni teléfonos en un pase que ya tienen clientes finales.
    waNumber: pick(process.env.NEXT_PUBLIC_SABUCAN_WA_NUMBER),
    mapsUrl: pick(process.env.NEXT_PUBLIC_SABUCAN_MAPS_URL),
    direccion: pick(process.env.NEXT_PUBLIC_SABUCAN_DIRECCION),
    horario: pick(process.env.NEXT_PUBLIC_SABUCAN_HORARIO),
  },
  carnitas_granada: {
    id: 'carnitas_granada',
    nombre: 'Carnitas Granada',
    logoUrl: CARNITAS_LOGO,
    colorPrimario: '#E3231D',
    colorAcento: '#FFD400',
    classSuffix: 'carnitas_granada_lealtad',
    objectPrefix: 'carnitas-granada',
    collection: 'carnitas_clientes',
    basePath: '/carnitas',
    isDemo: false,
    cashbackPct: carnitasCashbackPct(),
    wideLogoUrl: pick(
      process.env.NEXT_PUBLIC_CARNITAS_WIDE_LOGO_URL,
      cloudinaryBanner(CARNITAS_LOGO, 660, 220, '#E3231D'),
    ),
    waNumber: pick(process.env.NEXT_PUBLIC_CARNITAS_WA_NUMBER, '+525657008418'),
    mapsUrl: pick(
      process.env.NEXT_PUBLIC_CARNITAS_MAPS_URL,
      'https://maps.app.goo.gl/h82G3F5Udy7PDTKTA',
    ),
    direccion: pick(
      process.env.NEXT_PUBLIC_CARNITAS_DIRECCION,
      'Maximino Ávila Camacho 33, Cd. de los Deportes, Benito Juárez, 03710 CDMX',
    ),
    horario: pick(process.env.NEXT_PUBLIC_CARNITAS_HORARIO, '9:30 am a 5:30 pm'),
    ubicacion: parseLatLng(process.env.NEXT_PUBLIC_CARNITAS_LATLNG),
  },
  cafe: {
    id: 'cafe',
    nombre: 'Café Luna',
    logoUrl: CAFE_LOGO,
    colorPrimario: '#1B4332',
    colorAcento: '#C9A24B',
    classSuffix: 'demo_cafe_lealtad',
    objectPrefix: 'demo-cafe',
    collection: 'demo_cafe_clientes',
    basePath: '/demo/cafe',
    isDemo: true,
    cashbackPct: 1,
    wideLogoUrl: cloudinaryBanner(CAFE_LOGO, 660, 220, '#1B4332'),
    // Datos ficticios: es una demo de venta.
    waNumber: '+525555030303',
    mapsUrl: 'https://maps.google.com/?q=Cafe+Luna+CDMX',
    direccion: 'Av. Álvaro Obregón 210, Roma Norte, CDMX (demo)',
    horario: 'Lun a dom · 7:30 am a 9:00 pm',
  },
  barberia: {
    id: 'barberia',
    nombre: 'Barbería El Patrón',
    logoUrl: BARBERIA_LOGO,
    colorPrimario: '#1B2438',
    colorAcento: '#C9A227',
    classSuffix: 'demo_barberia_lealtad',
    objectPrefix: 'demo-barberia',
    collection: 'demo_barberia_clientes',
    basePath: '/demo/barberia',
    isDemo: true,
    cashbackPct: 1,
    wideLogoUrl: cloudinaryBanner(BARBERIA_LOGO, 660, 220, '#1B2438'),
    // Datos ficticios: es una demo de venta.
    waNumber: '+525555010101',
    mapsUrl: 'https://maps.google.com/?q=Barberia+El+Patron+CDMX',
    direccion: 'Av. Insurgentes Sur 480, Roma Sur, CDMX (demo)',
    horario: 'Lun a sáb · 10:00 am a 8:00 pm',
  },
  abarrotes: {
    id: 'abarrotes',
    nombre: 'Abarrotes La Providencia',
    logoUrl: ABARROTES_LOGO,
    colorPrimario: '#3E7D32',
    colorAcento: '#D2691E',
    classSuffix: 'demo_abarrotes_lealtad',
    objectPrefix: 'demo-abarrotes',
    collection: 'demo_abarrotes_clientes',
    basePath: '/demo/abarrotes',
    isDemo: true,
    cashbackPct: 1,
    wideLogoUrl: cloudinaryBanner(ABARROTES_LOGO, 660, 220, '#3E7D32'),
    // Datos ficticios: es una demo de venta.
    waNumber: '+525555020202',
    mapsUrl: 'https://maps.google.com/?q=Abarrotes+La+Providencia+CDMX',
    direccion: 'Calle Morelos 15, Col. Providencia, CDMX (demo)',
    horario: 'Todos los días · 7:00 am a 10:00 pm',
  },
};

/** Alias pedido en el brief (solo demos). */
export const DEMO_TENANTS = {
  cafe: TENANTS.cafe,
  barberia: TENANTS.barberia,
  abarrotes: TENANTS.abarrotes,
} as const;

export const DEMO_NEGOCIOS: DemoNegocio[] = ['cafe', 'barberia', 'abarrotes'];

export function isTenantId(raw: string): raw is TenantId {
  return raw === 'sabucan' || raw === 'carnitas_granada' || isDemoNegocio(raw);
}

export function tenantCashbackPct(tenant: TenantConfig): number {
  return Number.isFinite(tenant.cashbackPct) && tenant.cashbackPct > 0
    ? tenant.cashbackPct
    : 1;
}

export function isDemoNegocio(raw: string): raw is DemoNegocio {
  return raw === 'cafe' || raw === 'barberia' || raw === 'abarrotes';
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
