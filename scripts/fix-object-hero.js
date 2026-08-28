/**
 * Quita el heroImage a nivel objeto de los pases ya emitidos.
 *
 * Por qué: el heroImage del objeto pisa al de la clase, así que un pase emitido
 * antes de un cambio de logo se queda con la imagen vieja para siempre. Al
 * quitarlo, el pase hereda el hero de la clase (o ninguno, si la clase no tiene).
 *
 *   node scripts/fix-object-hero.js                  # todas las clases conocidas
 *   node scripts/fix-object-hero.js demo_abarrotes_lealtad
 */
const fs = require('fs');
const path = require('path');

const API = 'https://walletobjects.googleapis.com/walletobjects/v1';
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

const CLASES = [
  'demo_cafe_lealtad',
  'demo_barberia_lealtad',
  'demo_abarrotes_lealtad',
  'carnitas_granada_lealtad',
  'sabucan_lealtad',
];

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
  return tok;
}

async function limpiarClase(token, suffix) {
  const classId = `${ISSUER_ID}.${suffix}`;
  const list = await fetch(
    `${API}/loyaltyObject?classId=${encodeURIComponent(classId)}&maxResults=200`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await list.json().catch(() => ({}));
  const objetos = json.resources || [];

  console.log(`\n========== ${suffix} ==========`);
  console.log('objetos emitidos:', objetos.length);

  const cambios = [];
  for (const obj of objetos) {
    if (!obj.heroImage) {
      console.log(`  ${obj.id} — ya sin heroImage`);
      continue;
    }
    console.log(`  ${obj.id} — heroImage: ${obj.heroImage?.sourceUri?.uri}`);

    // PATCH hace merge: ni null ni {} borran el campo. Hay que reemplazar el
    // objeto completo con PUT, omitiendo heroImage.
    const cuerpo = { ...obj };
    delete cuerpo.heroImage;

    const res = await fetch(`${API}/loyaltyObject/${encodeURIComponent(obj.id)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    const text = await res.text();
    console.log('    PUT status:', res.status);
    if (!res.ok) {
      console.log('   ', text);
      cambios.push({ id: obj.id, status: 'failed', http: res.status });
      continue;
    }

    const verify = await fetch(`${API}/loyaltyObject/${encodeURIComponent(obj.id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const vj = await verify.json().catch(() => ({}));
    const quedo = vj?.heroImage?.sourceUri?.uri ?? null;
    console.log('    heroImage tras GET:', quedo ?? '(limpio)');
    cambios.push({ id: obj.id, status: quedo ? 'sigue_con_hero' : 'limpio' });
  }

  return { clase: suffix, objetos: objetos.length, cambios };
}

async function main() {
  const args = process.argv.slice(2).filter((a) => CLASES.includes(a));
  const clases = args.length > 0 ? args : CLASES;

  const token = await getAccessToken();
  console.log('issuer:', ISSUER_ID);
  console.log('clases:', clases.join(', '));

  const resumen = [];
  for (const c of clases) {
    resumen.push(await limpiarClase(token, c));
  }

  console.log('\n========== RESUMEN ==========');
  console.log(JSON.stringify(resumen, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
