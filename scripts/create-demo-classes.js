/**
 * Crea las Loyalty Classes de demos (barbería + abarrotes).
 * Tras cada POST hace GET inmediato para confirmar.
 *
 *   node scripts/create-demo-classes.js
 */
const fs = require('fs');
const path = require('path');

const ISSUER_ID =
  (process.env.GOOGLE_WALLET_ISSUER_ID || '').trim() || '3388000000023176050';

const DEMO_TENANTS = {
  barberia: {
    nombre: 'Barbería El Patrón',
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787636931/WhatsApp_Image_2026-08-24_at_11.48.16_PM_mjdgvv.jpg',
    colorPrimario: '#1B2438',
    classId: `${ISSUER_ID}.demo_barberia_lealtad`,
  },
  abarrotes: {
    nombre: 'Abarrotes La Providencia',
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787636931/WhatsApp_Image_2026-08-24_at_11.48.16_PM_1_x7ktpa.jpg',
    colorPrimario: '#3E7D32',
    classId: `${ISSUER_ID}.demo_abarrotes_lealtad`,
  },
};

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
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnv('.env.local');
loadEnv('.env');

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

async function ensureClass(token, key, cfg) {
  const getUrl = `${CLASS_URL}/${encodeURIComponent(cfg.classId)}`;
  console.log(`\n========== ${key.toUpperCase()} ==========`);
  console.log('classId:', cfg.classId);

  const getExisting = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (getExisting.ok) {
    console.log('GET (ya existía):', getExisting.status);
    console.log(JSON.stringify(await getExisting.json(), null, 2));
    return { key, status: 'exists', classId: cfg.classId };
  }
  console.log('GET previo:', getExisting.status, '— creando…');

  const body = {
    id: cfg.classId,
    issuerName: cfg.nombre,
    programName: `Lealtad ${cfg.nombre}`,
    programLogo: {
      sourceUri: { uri: cfg.logoUrl },
      contentDescription: {
        defaultValue: { language: 'es-MX', value: `Logo ${cfg.nombre}` },
      },
    },
    hexBackgroundColor: cfg.colorPrimario,
    reviewStatus: 'UNDER_REVIEW',
  };

  const createRes = await fetch(CLASS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const createText = await createRes.text();
  console.log('POST status:', createRes.status);
  try {
    console.log(JSON.stringify(JSON.parse(createText), null, 2));
  } catch {
    console.log(createText);
  }
  if (!createRes.ok) {
    return { key, status: 'create_failed', http: createRes.status, classId: cfg.classId };
  }

  const verify = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const verifyJson = await verify.json().catch(() => ({}));
  console.log('--- GET verificación inmediata ---');
  console.log('GET status:', verify.status);
  console.log(JSON.stringify(verifyJson, null, 2));

  return {
    key,
    status: verify.ok ? 'created_verified' : 'created_but_get_failed',
    httpGet: verify.status,
    classId: cfg.classId,
    reviewStatus: verifyJson.reviewStatus,
  };
}

async function main() {
  const { token, email } = await getAccessToken();
  console.log('service account:', email);
  console.log('issuer:', ISSUER_ID);

  const results = [];
  for (const [key, cfg] of Object.entries(DEMO_TENANTS)) {
    results.push(await ensureClass(token, key, cfg));
  }

  console.log('\n========== RESUMEN ==========');
  console.log(JSON.stringify(results, null, 2));
  if (results.some((r) => r.status.includes('fail'))) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
