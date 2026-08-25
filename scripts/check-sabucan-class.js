/**
 * Temporal: GET loyaltyClass SABUCAN en Google Wallet.
 *
 *   node scripts/check-sabucan-class.js
 *
 * Requiere GOOGLE_WALLET_SERVICE_ACCOUNT_JSON en .env.local / .env / entorno.
 */
const fs = require('fs');
const path = require('path');

const CLASS_ID = '3388000000023176050.sabucan_lealtad';
const CLASS_URL = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${encodeURIComponent(CLASS_ID)}`;
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

async function main() {
  const raw = (process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON || '').trim();
  if (!raw) {
    console.error(
      'Falta GOOGLE_WALLET_SERVICE_ACCOUNT_JSON (.env.local / .env / Render env).',
    );
    process.exit(1);
  }

  let sa;
  try {
    sa = JSON.parse(raw);
  } catch (e) {
    console.error('GOOGLE_WALLET_SERVICE_ACCOUNT_JSON no es JSON válido:', e.message);
    process.exit(1);
  }

  if (!sa.client_email || !sa.private_key) {
    console.error('JSON sin client_email o private_key');
    process.exit(1);
  }

  console.log('classId:', CLASS_ID);
  console.log('url:', CLASS_URL);
  console.log('service account:', sa.client_email);
  console.log('---');

  const { google } = await import('googleapis');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: sa.client_email,
      private_key: String(sa.private_key).replace(/\\n/g, '\n'),
    },
    scopes: [WALLET_SCOPE],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = tokenResponse.token;
  if (!accessToken) {
    console.error('No se pudo obtener access token (¿llave inválida o revocada?)');
    process.exit(1);
  }
  console.log('access token: OK');

  const res = await fetch(CLASS_URL, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();

  console.log('HTTP status:', res.status, res.statusText);
  console.log('--- respuesta completa ---');
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }

  if (!res.ok) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
