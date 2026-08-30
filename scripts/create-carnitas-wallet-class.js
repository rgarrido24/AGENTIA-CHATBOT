/**
 * Crea la Loyalty Class de Carnitas Granada y verifica con un GET inmediato.
 * Sale con código 1 si el GET de verificación no confirma la clase.
 *
 *   node scripts/create-carnitas-wallet-class.js
 */
const fs = require('fs');
const path = require('path');

const ISSUER_ID =
  (process.env.GOOGLE_WALLET_ISSUER_ID || '').trim() || '3388000000023176050';

const CASHBACK_PCT =
  Number(
    (process.env.NEXT_PUBLIC_CARNITAS_CASHBACK_PCT || process.env.CARNITAS_CASHBACK_PCT || '')
      .toString()
      .trim(),
  ) || 5;

const TENANT = {
  nombre: 'Carnitas Granada',
  logoUrl:
    (process.env.NEXT_PUBLIC_CARNITAS_LOGO_URL || '').trim() ||
    'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787786595/FB_IMG_1787786585040_kenlnk.jpg',
  colorPrimario: '#E3231D',
  classId: `${ISSUER_ID}.carnitas_granada_lealtad`,
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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
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

async function main() {
  const { token, email } = await getAccessToken();
  console.log('service account:', email);
  console.log('issuer:', ISSUER_ID);
  console.log('classId:', TENANT.classId);
  console.log('cashback:', `${CASHBACK_PCT}%`);

  const getUrl = `${CLASS_URL}/${encodeURIComponent(TENANT.classId)}`;

  const existing = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (existing.ok) {
    const json = await existing.json();
    console.log('\nLa clase ya existía. GET status:', existing.status);
    console.log(JSON.stringify(json, null, 2));
    console.log('\nRESULTADO: exists · reviewStatus =', json.reviewStatus);
    return;
  }
  console.log('\nGET previo:', existing.status, '— creando clase…');

  const body = {
    id: TENANT.classId,
    issuerName: TENANT.nombre,
    programName: `Lealtad ${TENANT.nombre}`,
    programLogo: {
      sourceUri: { uri: TENANT.logoUrl },
      contentDescription: {
        defaultValue: { language: 'es-MX', value: `Logo ${TENANT.nombre}` },
      },
    },
    hexBackgroundColor: TENANT.colorPrimario,
    reviewStatus: 'UNDER_REVIEW',
    textModulesData: [
      {
        header: 'Cómo acumular',
        body: `${CASHBACK_PCT}% de cashback en puntos (1 punto = $1 MXN) · ${TENANT.nombre}`,
      },
    ],
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
    console.error('\nRESULTADO: create_failed');
    process.exit(1);
  }

  const verify = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } });
  const verifyJson = await verify.json().catch(() => ({}));
  console.log('\n--- GET de verificación inmediata ---');
  console.log('GET status:', verify.status);
  console.log(JSON.stringify(verifyJson, null, 2));

  if (!verify.ok || verifyJson.id !== TENANT.classId) {
    console.error('\nRESULTADO: created_but_get_failed — la clase NO quedó confirmada.');
    process.exit(1);
  }

  console.log('\nRESULTADO: created_verified · reviewStatus =', verifyJson.reviewStatus);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
