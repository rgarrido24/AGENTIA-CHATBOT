/**
 * Actualiza el diseño de la Loyalty Class de Carnitas Granada (hero, logo ancho,
 * links, ubicación e info) y verifica con un GET inmediato.
 * Los pases ya emitidos se refrescan solos en el celular del cliente.
 *
 *   node scripts/update-carnitas-wallet-class.js
 *
 * Variables opcionales (si faltan, ese bloque simplemente no se envía):
 *   NEXT_PUBLIC_CARNITAS_HERO_URL        banda horizontal ~1032x336
 *   NEXT_PUBLIC_CARNITAS_WIDE_LOGO_URL   logo horizontal
 *   NEXT_PUBLIC_CARNITAS_WA_NUMBER       teléfono para el botón de WhatsApp
 *   NEXT_PUBLIC_CARNITAS_MAPS_URL        link de Google Maps
 *   NEXT_PUBLIC_CARNITAS_DIRECCION       dirección visible en el pase
 *   NEXT_PUBLIC_CARNITAS_HORARIO         horario visible en el pase
 *   NEXT_PUBLIC_CARNITAS_LATLNG          "20.6736,-103.344" para el aviso de cercanía
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

const env = (k) => (process.env[k] || '').trim();

const ISSUER_ID = env('GOOGLE_WALLET_ISSUER_ID') || '3388000000023176050';
const CLASS_ID = `${ISSUER_ID}.carnitas_granada_lealtad`;
const NOMBRE = 'Carnitas Granada';
const CASHBACK_PCT =
  Number(env('NEXT_PUBLIC_CARNITAS_CASHBACK_PCT') || env('CARNITAS_CASHBACK_PCT')) || 5;

function waDigits(tel) {
  let d = String(tel || '').replace(/\D/g, '');
  if (d.length === 10) d = `52${d}`;
  if (d.startsWith('52') && d.length > 12) d = d.slice(-12);
  return d;
}

function localizedImage(uri, description) {
  return {
    sourceUri: { uri },
    contentDescription: {
      defaultValue: { language: 'es-MX', value: description },
    },
  };
}

function buildPatch() {
  const patch = {
    id: CLASS_ID,
    issuerName: NOMBRE,
    programName: `Lealtad ${NOMBRE}`,
    hexBackgroundColor: '#E3231D',
    // La API rechaza el PATCH si se reenvía "APPROVED"; hay que mandar UNDER_REVIEW.
    reviewStatus: 'UNDER_REVIEW',
    accountNameLabel: 'Cliente',
    accountIdLabel: 'Teléfono',
    textModulesData: [
      {
        header: 'Cómo acumular',
        body: `${CASHBACK_PCT}% de cada compra se te regresa como saldo a favor (1 punto = $1 MXN).`,
      },
      {
        header: 'Cómo usarlo',
        body: 'Muestra este código en la caja. Puedes usar tu saldo como pago en cualquier visita.',
      },
    ],
  };

  const hero = env('NEXT_PUBLIC_CARNITAS_HERO_URL');
  if (hero) patch.heroImage = localizedImage(hero, `${NOMBRE} — bienvenida`);

  const wide = env('NEXT_PUBLIC_CARNITAS_WIDE_LOGO_URL');
  if (wide) patch.wideProgramLogo = localizedImage(wide, `Logo ${NOMBRE}`);

  const uris = [];
  const wa = env('NEXT_PUBLIC_CARNITAS_WA_NUMBER');
  if (wa) {
    uris.push({
      uri: `https://wa.me/${waDigits(wa)}`,
      description: `WhatsApp ${NOMBRE}`,
      id: 'whatsapp',
    });
  }
  const maps = env('NEXT_PUBLIC_CARNITAS_MAPS_URL');
  if (maps) uris.push({ uri: maps, description: 'Cómo llegar', id: 'maps' });
  if (uris.length > 0) patch.linksModuleData = { uris };

  const direccion = env('NEXT_PUBLIC_CARNITAS_DIRECCION');
  const horario = env('NEXT_PUBLIC_CARNITAS_HORARIO');
  const rows = [];
  if (direccion) {
    rows.push({
      columns: [{ header: 'Dónde estamos', body: direccion }],
    });
  }
  if (horario) {
    rows.push({ columns: [{ header: 'Horario', body: horario }] });
  }
  if (rows.length > 0) {
    patch.infoModuleData = { labelValueRows: rows, showLastUpdateTime: false };
  }

  const latlng = env('NEXT_PUBLIC_CARNITAS_LATLNG');
  if (latlng) {
    const [latRaw, lngRaw] = latlng.split(',');
    const latitude = Number(latRaw);
    const longitude = Number(lngRaw);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      patch.locations = [{ kind: 'walletobjects#latLongPoint', latitude, longitude }];
    }
  }

  return patch;
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

async function main() {
  const { token, email } = await getAccessToken();
  const patch = buildPatch();

  console.log('service account:', email);
  console.log('classId:', CLASS_ID);
  console.log('bloques incluidos:', Object.keys(patch).join(', '));
  if (!patch.heroImage) {
    console.log('AVISO: sin NEXT_PUBLIC_CARNITAS_HERO_URL — la tarjeta va sin imagen hero.');
  }

  const url = `${CLASS_URL}/${encodeURIComponent(CLASS_ID)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  const text = await res.text();
  console.log('\nPATCH status:', res.status);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
  if (!res.ok) {
    console.error('\nRESULTADO: patch_failed');
    process.exit(1);
  }

  const verify = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await verify.json().catch(() => ({}));
  console.log('\n--- GET de verificación inmediata ---');
  console.log('GET status:', verify.status);
  console.log(JSON.stringify(json, null, 2));

  const heroOk = !patch.heroImage || Boolean(json.heroImage);
  const linksOk = !patch.linksModuleData || Boolean(json.linksModuleData);
  if (!verify.ok || json.id !== CLASS_ID || !heroOk || !linksOk) {
    console.error('\nRESULTADO: patched_but_get_failed — revisa la respuesta de arriba.');
    process.exit(1);
  }

  console.log('\nRESULTADO: patched_verified · version =', json.version);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
