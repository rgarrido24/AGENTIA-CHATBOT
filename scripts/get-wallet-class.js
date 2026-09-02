/**
 * GET de una Loyalty Class de Google Wallet.
 *
 *   node scripts/get-wallet-class.js 3388000000023176050.demo_cafe_lealtad
 *
 * Requiere GOOGLE_WALLET_SERVICE_ACCOUNT_JSON en el entorno (Render Shell o .env).
 */
const fs = require('fs');
const path = require('path');

const WALLET_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';
const CLASS_URL = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass';

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

async function main() {
  const classId = (process.argv[2] || '').trim();
  if (!classId) {
    console.error('Uso: node scripts/get-wallet-class.js <classId>');
    console.error('Ej:  node scripts/get-wallet-class.js 3388000000023176050.demo_cafe_lealtad');
    process.exit(1);
  }

  const raw = (process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON || '').trim();
  if (!raw) {
    console.error('Falta GOOGLE_WALLET_SERVICE_ACCOUNT_JSON');
    process.exit(1);
  }

  const sa = JSON.parse(raw);
  if (!sa.client_email || !sa.private_key) {
    console.error('JSON sin client_email o private_key');
    process.exit(1);
  }

  const { google } = await import('googleapis');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: sa.client_email,
      private_key: String(sa.private_key).replace(/\\n/g, '\n'),
    },
    scopes: [WALLET_SCOPE],
  });
  const client = await auth.getClient();
  const accessToken = (await client.getAccessToken()).token;
  if (!accessToken) {
    console.error('No se pudo obtener access token');
    process.exit(1);
  }

  const url = `${CLASS_URL}/${encodeURIComponent(classId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();

  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }

  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
