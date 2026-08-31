/**
 * PATCH del heroImage (1032×336) de una Loyalty Class.
 * No toca logos, textos ni links. Los pases ya emitidos se refrescan solos.
 *
 *   node scripts/set-hero-image.js cafe https://res.cloudinary.com/.../cafe-luna-hero-wallet_dqnc9p.png
 *   node scripts/set-hero-image.js cafe
 *     → usa NEXT_PUBLIC_CAFE_HERO_URL, default de Café Luna, o
 *       https://agentia.software/images/wallet-hero/cafe.png
 *
 * Tenants: sabucan | carnitas_granada | cafe | barberia | abarrotes
 */
const fs = require('fs');
const path = require('path');

const CLASS_URL = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass';
const WALLET_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';
const PUBLIC_BASE = 'https://agentia.software/images/wallet-hero';

const TENANTS = {
  sabucan: {
    nombre: 'SABUCAN',
    classSuffix: 'sabucan_lealtad',
    envKey: 'NEXT_PUBLIC_SABUCAN_HERO_URL',
  },
  carnitas_granada: {
    nombre: 'Carnitas Granada',
    classSuffix: 'carnitas_granada_lealtad',
    envKey: 'NEXT_PUBLIC_CARNITAS_HERO_URL',
  },
  cafe: {
    nombre: 'Café Luna',
    classSuffix: 'demo_cafe_lealtad',
    envKey: 'NEXT_PUBLIC_CAFE_HERO_URL',
    defaultUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1788155757/cafe-luna-hero-wallet_dqnc9p.png',
  },
  barberia: {
    nombre: 'Barbería El Patrón',
    classSuffix: 'demo_barberia_lealtad',
    envKey: 'NEXT_PUBLIC_BARBERIA_HERO_URL',
  },
  abarrotes: {
    nombre: 'Abarrotes La Providencia',
    classSuffix: 'demo_abarrotes_lealtad',
    envKey: 'NEXT_PUBLIC_ABARROTES_HERO_URL',
  },
};

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

const env = (k) => (process.env[k] || '').trim();
const ISSUER_ID = env('GOOGLE_WALLET_ISSUER_ID') || '3388000000023176050';

function resolveHeroUrl(key, explicit) {
  const cfg = TENANTS[key];
  const fromArg = (explicit || '').trim();
  if (fromArg) return fromArg;
  const fromEnv = env(cfg.envKey);
  if (fromEnv) return fromEnv;
  if (cfg.defaultUrl) return cfg.defaultUrl;
  return `${PUBLIC_BASE}/${key}.png`;
}

function imagen(uri, description) {
  return {
    sourceUri: { uri },
    contentDescription: {
      defaultValue: { language: 'es-MX', value: description },
    },
  };
}

async function getAccessToken() {
  const raw = env('GOOGLE_WALLET_SERVICE_ACCOUNT_JSON');
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

async function patchHero(token, key, imageUrl) {
  const cfg = TENANTS[key];
  const classId = `${ISSUER_ID}.${cfg.classSuffix}`;
  const url = `${CLASS_URL}/${encodeURIComponent(classId)}`;
  const body = {
    id: classId,
    reviewStatus: 'UNDER_REVIEW',
    heroImage: imagen(imageUrl, `${cfg.nombre} — bienvenida`),
  };

  console.log(`\n========== ${key.toUpperCase()} ==========`);
  console.log('classId :', classId);
  console.log('heroUrl :', imageUrl);

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log('PATCH status:', res.status);
  if (!res.ok) {
    console.log(text);
    return { key, status: 'patch_failed', http: res.status, classId };
  }

  const verify = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await verify.json().catch(() => ({}));
  const saved = json?.heroImage?.sourceUri?.uri ?? null;
  const ok = verify.ok && saved === imageUrl;
  console.log('GET heroImage:', saved ?? '(sin hero)');
  console.log('coincide URL :', ok);

  return {
    key,
    status: ok ? 'hero_verificado' : 'patched_but_not_confirmed',
    classId,
    heroGuardado: saved,
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const key = argv[0];
  const imageUrlArg = argv[1];

  if (!key || !(key in TENANTS)) {
    console.error(
      'Uso: node scripts/set-hero-image.js <tenant> [imageUrl]\n' +
        'Tenants: ' +
        Object.keys(TENANTS).join(' | '),
    );
    process.exit(1);
  }

  const imageUrl = resolveHeroUrl(key, imageUrlArg);
  const { token, email } = await getAccessToken();
  console.log('service account:', email);
  console.log('issuer:', ISSUER_ID);

  const result = await patchHero(token, key, imageUrl);
  console.log('\n========== RESUMEN ==========');
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'hero_verificado') process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
