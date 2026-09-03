/**
 * PATCH de merchantLocations en una Loyalty Class ya existente.
 * Google Wallet dispara el aviso nativo de "estás cerca" con este campo;
 * no hay push, cron ni rastreo propio.
 *
 *   node scripts/set-geofence.js carnitas_granada
 *
 * Solo se aceptan tenants que ya tienen `ubicacion` en lib/wallet-tenant.ts.
 * Requiere GOOGLE_WALLET_SERVICE_ACCOUNT_JSON (Render Shell o .env).
 */
const fs = require('fs');
const path = require('path');

const CLASS_URL = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass';
const WALLET_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';

function loadEnv(file) {
  const p = path.join(__dirname, '..', file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnv('.env.local');
loadEnv('.env');

const ISSUER_ID = (process.env.GOOGLE_WALLET_ISSUER_ID || '').trim() || '3388000000023176050';

/**
 * Coordenadas canónicas — mismas que lib/wallet-tenant.ts.
 * NEXT_PUBLIC_CARNITAS_LATLNG ("lat,lng") puede sobrescribir Carnitas.
 */
const TENANTS = {
  carnitas_granada: {
    nombre: 'Carnitas Granada',
    classSuffix: 'carnitas_granada_lealtad',
    lat: 19.38407,
    lng: -99.17727,
  },
};

function parseLatLng(raw) {
  if (!raw) return undefined;
  const [latRaw, lngRaw] = String(raw).split(',');
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { lat, lng };
}

function coordsFor(key) {
  const cfg = TENANTS[key];
  if (!cfg) return null;
  if (key === 'carnitas_granada') {
    const override = parseLatLng(process.env.NEXT_PUBLIC_CARNITAS_LATLNG);
    if (override) return { ...cfg, lat: override.lat, lng: override.lng };
  }
  return cfg;
}

async function getAccessToken() {
  const raw = (process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON || '').trim();
  if (!raw) throw new Error('Falta GOOGLE_WALLET_SERVICE_ACCOUNT_JSON');
  const sa = JSON.parse(raw);
  const { google } = await import('googleapis');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: sa.client_email,
      private_key: String(sa.private_key).replace(/\\n/g, '\n'),
    },
    scopes: [WALLET_SCOPE],
  });
  const client = await auth.getClient();
  const tok = (await client.getAccessToken()).token;
  if (!tok) throw new Error('No se pudo obtener access token');
  return { token: tok, email: sa.client_email };
}

async function main() {
  const key = (process.argv[2] || '').trim();
  if (!key) {
    console.error('Uso: node scripts/set-geofence.js <tenant_key>');
    console.error('Ej:  node scripts/set-geofence.js carnitas_granada');
    process.exit(1);
  }

  const cfg = coordsFor(key);
  if (!cfg) {
    console.error(
      `El tenant "${key}" no tiene geofence configurado. Solo se acepta: ${Object.keys(TENANTS).join(', ')}`,
    );
    process.exit(1);
  }

  const classId = `${ISSUER_ID}.${cfg.classSuffix}`;
  const url = `${CLASS_URL}/${encodeURIComponent(classId)}`;
  const merchantLocations = [{ latitude: cfg.lat, longitude: cfg.lng }];

  const { token, email } = await getAccessToken();
  console.log('service account:', email);
  console.log('tenant:', key);
  console.log('classId:', classId);
  console.log('PATCH merchantLocations:', JSON.stringify(merchantLocations));

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: classId,
      // La API rechaza el envío de "APPROVED"; hay que mandar UNDER_REVIEW.
      reviewStatus: 'UNDER_REVIEW',
      merchantLocations,
    }),
  });
  const text = await res.text();
  console.log('\n--- respuesta del PATCH ---');
  console.log('status:', res.status);
  try {
    const patched = JSON.parse(text);
    console.log('merchantLocations:', JSON.stringify(patched.merchantLocations ?? null, null, 2));
  } catch {
    console.log(text);
  }
  if (!res.ok) {
    console.error('\nRESULTADO: patch_failed');
    process.exit(1);
  }

  const verify = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await verify.json().catch(() => ({}));
  const saved = json.merchantLocations ?? null;

  console.log('\n--- GET de verificación inmediata ---');
  console.log('status:', verify.status);
  console.log('merchantLocations:', JSON.stringify(saved, null, 2));

  const ok =
    verify.ok &&
    Array.isArray(saved) &&
    saved.length > 0 &&
    Number(saved[0].latitude) === cfg.lat &&
    Number(saved[0].longitude) === cfg.lng;

  console.log('todo correcto  :', ok);
  if (!ok) {
    console.error('\nRESULTADO: patched_but_not_confirmed');
    process.exit(1);
  }
  console.log('\nRESULTADO: geofence_verificado · version =', json.version);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
