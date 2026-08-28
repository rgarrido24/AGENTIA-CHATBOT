/**
 * PATCH del programLogo de las 3 clases de demo ya existentes.
 * Solo toca el logo: no recrea la clase ni altera el resto del diseño.
 * Imprime la respuesta completa de cada PATCH y verifica con un GET inmediato.
 *
 *   node scripts/update-demo-logos.js
 *   node scripts/update-demo-logos.js cafe
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
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787942156/cafe-luna-logo-transparente_xskmgn.png',
  },
  barberia: {
    nombre: 'Barbería El Patrón',
    classSuffix: 'demo_barberia_lealtad',
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787941859/barberia-el-patron-logo-transparente_ej3ruw.png',
  },
  abarrotes: {
    nombre: 'Abarrotes La Providencia',
    classSuffix: 'demo_abarrotes_lealtad',
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787941811/abarrotes-la-providencia-logo-transparente_jgk7kf.png',
  },
};

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

async function patchLogo(token, key) {
  const cfg = DEMO_LOGOS[key];
  const classId = `${ISSUER_ID}.${cfg.classSuffix}`;
  const url = `${CLASS_URL}/${encodeURIComponent(classId)}`;

  console.log(`\n========== ${key.toUpperCase()} ==========`);
  console.log('classId:', classId);
  console.log('logo nuevo:', cfg.logoUrl);

  const body = {
    id: classId,
    // La API rechaza el PATCH si se reenvía "APPROVED"; hay que mandar UNDER_REVIEW.
    reviewStatus: 'UNDER_REVIEW',
    programLogo: {
      sourceUri: { uri: cfg.logoUrl },
      contentDescription: {
        defaultValue: { language: 'es-MX', value: `Logo ${cfg.nombre}` },
      },
    },
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log('\n--- respuesta del PATCH ---');
  console.log('status:', res.status);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
  if (!res.ok) return { key, status: 'patch_failed', http: res.status, classId };

  const verify = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await verify.json().catch(() => ({}));
  const uriGuardado = json?.programLogo?.sourceUri?.uri;
  const ok = verify.ok && uriGuardado === cfg.logoUrl;

  console.log('\n--- GET de verificación inmediata ---');
  console.log('status:', verify.status);
  console.log('programLogo.sourceUri.uri:', uriGuardado);
  console.log('coincide con el nuevo logo:', ok);

  return {
    key,
    status: ok ? 'logo_verified' : 'patched_but_not_confirmed',
    classId,
    logoGuardado: uriGuardado,
  };
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a in DEMO_LOGOS);
  const keys = args.length > 0 ? args : Object.keys(DEMO_LOGOS);

  const { token, email } = await getAccessToken();
  console.log('service account:', email);
  console.log('issuer:', ISSUER_ID);
  console.log('clases a actualizar:', keys.join(', '));

  const results = [];
  for (const key of keys) {
    results.push(await patchLogo(token, key));
  }

  console.log('\n========== RESUMEN ==========');
  console.log(JSON.stringify(results, null, 2));
  if (results.some((r) => r.status !== 'logo_verified')) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
