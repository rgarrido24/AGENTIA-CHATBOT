import { createHash } from 'crypto';

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
  resource_type: string;
  bytes: number;
};

function getCloudinaryCredentials() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET no configurados');
  }
  return { cloud_name, api_key, api_secret };
}

function signCloudinaryParams(params: Record<string, string | number>, apiSecret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1').update(sorted + apiSecret).digest('hex');
}

export type PanelUploadResult = {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
};

/** Sube un adjunto del panel de conversaciones a Cloudinary (upload firmado). */
export async function uploadPanelAttachment(
  buffer: Buffer,
  opts: { folder: string; fileName?: string; mimeType?: string },
): Promise<PanelUploadResult> {
  const { cloud_name, api_key, api_secret } = getCloudinaryCredentials();
  const isImage = (opts.mimeType || '').startsWith('image/');
  const resourceType = isImage ? 'image' : 'raw';
  const timestamp = Math.round(Date.now() / 1000);
  const folder = opts.folder;

  const signParams: Record<string, string | number> = { folder, timestamp };
  const signature = signCloudinaryParams(signParams, api_secret);

  const form = new FormData();
  form.append(
    'file',
    new Blob([new Uint8Array(buffer)], { type: opts.mimeType || 'application/octet-stream' }),
    opts.fileName || 'archivo',
  );
  form.append('api_key', api_key);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText.slice(0, 200) || `Cloudinary upload falló (${res.status})`);
  }

  const result = (await res.json()) as CloudinaryUploadResponse;
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    bytes: result.bytes,
  };
}
