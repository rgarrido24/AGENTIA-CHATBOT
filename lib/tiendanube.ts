import { getMongoDb } from '@/lib/mongodb';

export type TiendanubeTokenDoc = {
  clientId: string;
  storeId: string;
  accessToken: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type CatalogProductInput = {
  name: string;
  price: number;
  category?: string;
  imageUrl?: string | null;
};

function env(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Falta la variable de entorno ${name}`);
  return v;
}

export function getTiendanubeAppId(): string {
  return env('TIENDANUBE_APP_ID');
}

export function getTiendanubeClientSecret(): string {
  return env('TIENDANUBE_CLIENT_SECRET');
}

export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://agentia.software';
  return raw.replace(/\/$/, '');
}

export function getTiendanubeCallbackUrl(): string {
  return `${getAppBaseUrl()}/api/tiendanube/callback`;
}

export function getTiendanubeUserAgent(): string {
  return process.env.TIENDANUBE_USER_AGENT?.trim() || 'Agentia (hola@agentia.software)';
}

export function buildTiendanubeInstallUrl(clientId: string): string {
  const appId = getTiendanubeAppId();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getTiendanubeCallbackUrl(),
    response_type: 'code',
    state: clientId.trim().toLowerCase(),
  });
  return `https://www.tiendanube.com/apps/${appId}/authorize?${params.toString()}`;
}

export async function exchangeAuthorizationCode(code: string): Promise<{
  access_token: string;
  user_id?: number | string;
  store_id?: number | string;
}> {
  const appId = getTiendanubeAppId();
  const clientSecret = getTiendanubeClientSecret();

  const tokenUrls = [
    `https://www.tiendanube.com/apps/${appId}/authorize`,
    'https://www.tiendanube.com/apps/authorize/token',
  ];

  let lastError = 'No se pudo obtener token';
  for (const url of tokenUrls) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: appId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.access_token) {
      return data as { access_token: string; user_id?: number | string; store_id?: number | string };
    }
    lastError = (data as { error_description?: string; description?: string; message?: string }).error_description
      || (data as { description?: string }).description
      || (data as { message?: string }).message
      || `HTTP ${res.status}`;
  }

  throw new Error(lastError);
}

export async function saveTiendanubeToken(params: {
  clientId: string;
  storeId: string;
  accessToken: string;
}): Promise<void> {
  const db = await getMongoDb();
  const now = new Date();
  await db.collection<TiendanubeTokenDoc>('tiendanube_tokens').updateOne(
    { clientId: params.clientId },
    {
      $set: {
        clientId: params.clientId,
        storeId: params.storeId,
        accessToken: params.accessToken,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
}

export async function getTiendanubeToken(clientId: string): Promise<TiendanubeTokenDoc | null> {
  const db = await getMongoDb();
  return db.collection<TiendanubeTokenDoc>('tiendanube_tokens').findOne({
    clientId: clientId.trim().toLowerCase(),
  });
}

export async function getCatalogForClient(clientId: string): Promise<CatalogProductInput[]> {
  const db = await getMongoDb();
  const normalized = clientId.trim().toLowerCase();
  const config = await db.collection('business_configs').findOne({ clientId: normalized });

  const fromConfig = config?.catalog ?? config?.products;
  if (Array.isArray(fromConfig) && fromConfig.length > 0) {
    return fromConfig
      .map((p: Record<string, unknown>) => ({
        name: String(p.name || '').trim(),
        price: Number(p.price),
        category: p.category ? String(p.category) : undefined,
        imageUrl: p.imageUrl ? String(p.imageUrl) : p.image ? String(p.image) : null,
      }))
      .filter((p) => p.name && Number.isFinite(p.price));
  }

  if (normalized === 'biovela') {
    const { BIOVELA_CATALOG } = await import('@/lib/biovela-catalog');
    return BIOVELA_CATALOG.map((p) => ({
      name: p.name,
      price: p.price,
      category: p.category,
      imageUrl: p.imageUrl,
    }));
  }

  return [];
}

export function tiendanubeApiHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    'User-Agent': getTiendanubeUserAgent(),
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export function buildTiendanubeProductPayload(product: CatalogProductInput) {
  const price = Number(product.price).toFixed(2);
  const description = product.category
    ? `<p>${product.category}</p>`
    : '<p>Producto Agentia</p>';

  const payload: Record<string, unknown> = {
    name: { es: product.name },
    description: { es: description },
    published: true,
    variants: [
      {
        price,
        stock_management: true,
        stock: 10,
      },
    ],
  };

  if (product.imageUrl) {
    payload.images = [{ src: product.imageUrl }];
  }

  if (product.category) {
    payload.tags = product.category;
  }

  return payload;
}

export async function createTiendanubeProduct(
  storeId: string,
  accessToken: string,
  product: CatalogProductInput
): Promise<void> {
  const res = await fetch(`https://api.tiendanube.com/v1/${storeId}/products`, {
    method: 'POST',
    headers: tiendanubeApiHeaders(accessToken),
    body: JSON.stringify(buildTiendanubeProductPayload(product)),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err.slice(0, 300) || `HTTP ${res.status}`);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
