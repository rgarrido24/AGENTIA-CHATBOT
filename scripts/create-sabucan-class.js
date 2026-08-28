/**
 * Crea la Loyalty Class SABUCAN si no existe.
 *
 *   node scripts/create-sabucan-class.js
 */
const fs = require('fs');
const path = require('path');

const ISSUER_ID = '3388000000023176050';
const CLASS_ID = `${ISSUER_ID}.sabucan_lealtad`;
const CLASS_URL = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass`;
const GET_URL = `${CLASS_URL}/${encodeURIComponent(CLASS_ID)}`;
const WALLET_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';

const LOGO_URL =
  process.env.NEXT_PUBLIC_SABUCAN_LOGO_URL?.trim() ||
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787945953/sabucan-logo-transparente_kywnjn.png';

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

async function main() {
  const { token, email } = await getAccessToken();
  console.log('service account:', email);
  console.log('classId:', CLASS_ID);

  const getRes = await fetch(GET_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (getRes.ok) {
    console.log('La clase YA existe. GET 200:');
    console.log(JSON.stringify(await getRes.json(), null, 2));
    return;
  }
  console.log('GET status:', getRes.status, '— se procederá a crear la clase');

  const loyaltyClass = {
    id: CLASS_ID,
    issuerName: 'SABUCAN',
    programName: 'Lealtad SABUCAN',
    programLogo: {
      sourceUri: {
        uri: LOGO_URL,
      },
      contentDescription: {
        defaultValue: {
          language: 'es-MX',
          value: 'Logo SABUCAN',
        },
      },
    },
    hexBackgroundColor: '#1E2340',
    reviewStatus: 'UNDER_REVIEW',
  };

  console.log('POST body:', JSON.stringify(loyaltyClass, null, 2));

  const createRes = await fetch(CLASS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loyaltyClass),
  });
  const text = await createRes.text();
  console.log('POST status:', createRes.status, createRes.statusText);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }

  if (!createRes.ok) process.exit(1);

  console.log('\n--- verificación GET ---');
  const verify = await fetch(GET_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('GET status:', verify.status);
  console.log(JSON.stringify(await verify.json(), null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
