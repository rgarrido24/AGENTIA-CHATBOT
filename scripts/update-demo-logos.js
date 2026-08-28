/**
 * PATCH de las imágenes de las 3 clases de demo ya existentes:
 * programLogo, heroImage y wideProgramLogo. No recrea la clase ni altera
 * textos, links ni info. Imprime la respuesta de cada PATCH y verifica con GET.
 *
 *   node scripts/update-demo-logos.js
 *   node scripts/update-demo-logos.js cafe
 *   node scripts/update-demo-logos.js --sin-hero   # quita el hero de las 3
 *
 * Los pases ya emitidos se refrescan solos en el celular del cliente.
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

const DEMO_LOGOS = {
  cafe: {
    nombre: 'Café Luna',
    classSuffix: 'demo_cafe_lealtad',
    color: '#1B4332',
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787942156/cafe-luna-logo-transparente_xskmgn.png',
  },
  barberia: {
    nombre: 'Barbería El Patrón',
    classSuffix: 'demo_barberia_lealtad',
    color: '#1B2438',
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787941859/barberia-el-patron-logo-transparente_ej3ruw.png',
  },
  abarrotes: {
    nombre: 'Abarrotes La Providencia',
    classSuffix: 'demo_abarrotes_lealtad',
    color: '#3E7D32',
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787941811/abarrotes-la-providencia-logo-transparente_jgk7kf.png',
  },
};

/**
 * Variante horizontal con relleno del color de marca. f_jpg aplana la
 * transparencia del PNG: sin esto, Wallet pinta esas zonas de blanco.
 */
function banner(url, w, h, hex) {
  if (!url || !url.includes('/upload/')) return url;
  const bg = String(hex).replace('#', '').toLowerCase();
  return url.replace('/upload/', `/upload/c_pad,w_${w},h_${h},b_rgb:${bg},f_jpg/`);
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

function imagen(uri, description) {
  return {
    sourceUri: { uri },
    contentDescription: {
      defaultValue: { language: 'es-MX', value: description },
    },
  };
}

async function patchLogo(token, key, sinHero) {
  const cfg = DEMO_LOGOS[key];
  const classId = `${ISSUER_ID}.${cfg.classSuffix}`;
  const url = `${CLASS_URL}/${encodeURIComponent(classId)}`;
  const heroUrl = banner(cfg.logoUrl, 1032, 336, cfg.color);
  const wideUrl = banner(cfg.logoUrl, 660, 220, cfg.color);

  console.log(`\n========== ${key.toUpperCase()} ==========`);
  console.log('classId:', classId);
  console.log('programLogo:', cfg.logoUrl);
  console.log('heroImage  :', sinHero ? '(se elimina)' : heroUrl);
  console.log('wideLogo   :', wideUrl);

  // PATCH hace merge y no puede borrar campos (ni con null ni con {}), así que
  // para quitar el hero hay que reemplazar la clase completa con PUT.
  let metodo = 'PATCH';
  let body = {
    id: classId,
    // La API rechaza el envío de "APPROVED"; hay que mandar UNDER_REVIEW.
    reviewStatus: 'UNDER_REVIEW',
    programLogo: imagen(cfg.logoUrl, `Logo ${cfg.nombre}`),
    wideProgramLogo: imagen(wideUrl, `Logo ${cfg.nombre}`),
    heroImage: imagen(heroUrl, `${cfg.nombre} — bienvenida`),
  };

  if (sinHero) {
    const actual = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!actual.ok) {
      console.log('GET previo falló:', actual.status);
      return { key, status: 'get_previo_failed', http: actual.status, classId };
    }
    const clase = await actual.json();
    delete clase.heroImage;
    metodo = 'PUT';
    body = {
      ...clase,
      reviewStatus: 'UNDER_REVIEW',
      programLogo: imagen(cfg.logoUrl, `Logo ${cfg.nombre}`),
      wideProgramLogo: imagen(wideUrl, `Logo ${cfg.nombre}`),
    };
  }

  const res = await fetch(url, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`\n--- respuesta del ${metodo} ---`);
  console.log('status:', res.status);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
  if (!res.ok) return { key, status: 'patch_failed', http: res.status, classId };

  const verify = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await verify.json().catch(() => ({}));
  const logoGuardado = json?.programLogo?.sourceUri?.uri;
  const heroGuardado = json?.heroImage?.sourceUri?.uri;
  const wideGuardado = json?.wideProgramLogo?.sourceUri?.uri;

  const heroOk = sinHero ? !heroGuardado : heroGuardado === heroUrl;
  const ok = verify.ok && logoGuardado === cfg.logoUrl && heroOk && wideGuardado === wideUrl;

  console.log('\n--- GET de verificación inmediata ---');
  console.log('status:', verify.status);
  console.log('programLogo    :', logoGuardado);
  console.log('heroImage      :', heroGuardado ?? '(sin hero)');
  console.log('wideProgramLogo:', wideGuardado);
  console.log('todo correcto  :', ok);

  return {
    key,
    status: ok ? 'imagenes_verificadas' : 'patched_but_not_confirmed',
    classId,
    logoGuardado,
    heroGuardado: heroGuardado ?? null,
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const sinHero = argv.includes('--sin-hero');
  const args = argv.filter((a) => a in DEMO_LOGOS);
  const keys = args.length > 0 ? args : Object.keys(DEMO_LOGOS);

  const { token, email } = await getAccessToken();
  console.log('service account:', email);
  console.log('issuer:', ISSUER_ID);
  console.log('clases a actualizar:', keys.join(', '));
  console.log('modo hero:', sinHero ? 'quitar' : 'actualizar');

  const results = [];
  for (const key of keys) {
    results.push(await patchLogo(token, key, sinHero));
  }

  console.log('\n========== RESUMEN ==========');
  console.log(JSON.stringify(results, null, 2));
  if (results.some((r) => r.status !== 'imagenes_verificadas')) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
