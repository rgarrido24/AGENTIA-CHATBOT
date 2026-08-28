/**
 * Actualiza el diseño de las Loyalty Classes (hero, logo ancho, links, info,
 * ubicación) y verifica cada una con un GET inmediato.
 * Los pases ya emitidos se refrescan solos en el celular del cliente.
 *
 *   node scripts/update-wallet-classes-design.js                 # todos
 *   node scripts/update-wallet-classes-design.js sabucan barberia
 *
 * Nota: la API rechaza el PATCH si se le reenvía reviewStatus "APPROVED",
 * por eso siempre se manda "UNDER_REVIEW" aunque la clase ya esté aprobada.
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

const SABUCAN_LOGO =
  env('NEXT_PUBLIC_SABUCAN_LOGO_URL') ||
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787945953/sabucan-logo-transparente_kywnjn.png';
const CARNITAS_LOGO =
  env('NEXT_PUBLIC_CARNITAS_LOGO_URL') ||
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787786595/FB_IMG_1787786585040_kenlnk.jpg';
const CAFE_LOGO =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787942156/cafe-luna-logo-transparente_xskmgn.png';
const BARBERIA_LOGO =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787941859/barberia-el-patron-logo-transparente_ej3ruw.png';
const ABARROTES_LOGO =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787941811/abarrotes-la-providencia-logo-transparente_jgk7kf.png';

/** Variante horizontal con relleno de color, para no recortar logos cuadrados. */
function banner(url, w, h, hex) {
  if (!url || !url.includes('/upload/')) return url;
  const bg = String(hex).replace('#', '').toLowerCase();
  return url.replace('/upload/', `/upload/c_pad,w_${w},h_${h},b_rgb:${bg}/`);
}

const CARNITAS_PCT =
  Number(env('NEXT_PUBLIC_CARNITAS_CASHBACK_PCT') || env('CARNITAS_CASHBACK_PCT')) || 5;

const TENANTS = {
  sabucan: {
    nombre: 'SABUCAN',
    classSuffix: 'sabucan_lealtad',
    color: '#1E2340',
    logo: SABUCAN_LOGO,
    comoAcumular: '1 punto por cada $100 MXN de compra (1 punto = $1 MXN).',
    // Cliente real: contacto solo si está definido por env, no inventamos datos.
    wa: env('NEXT_PUBLIC_SABUCAN_WA_NUMBER'),
    maps: env('NEXT_PUBLIC_SABUCAN_MAPS_URL'),
    direccion: env('NEXT_PUBLIC_SABUCAN_DIRECCION'),
    horario: env('NEXT_PUBLIC_SABUCAN_HORARIO'),
    latlng: env('NEXT_PUBLIC_SABUCAN_LATLNG'),
  },
  carnitas_granada: {
    nombre: 'Carnitas Granada',
    classSuffix: 'carnitas_granada_lealtad',
    color: '#E3231D',
    logo: CARNITAS_LOGO,
    comoAcumular: `${CARNITAS_PCT}% de cada compra se te regresa como saldo a favor (1 punto = $1 MXN).`,
    wa: env('NEXT_PUBLIC_CARNITAS_WA_NUMBER') || '+525657008418',
    maps: env('NEXT_PUBLIC_CARNITAS_MAPS_URL') || 'https://maps.app.goo.gl/h82G3F5Udy7PDTKTA',
    direccion:
      env('NEXT_PUBLIC_CARNITAS_DIRECCION') ||
      'Maximino Ávila Camacho 33, Cd. de los Deportes, Benito Juárez, 03710 CDMX',
    horario: env('NEXT_PUBLIC_CARNITAS_HORARIO') || '9:30 am a 5:30 pm',
    latlng: env('NEXT_PUBLIC_CARNITAS_LATLNG'),
  },
  cafe: {
    nombre: 'Café Luna',
    classSuffix: 'demo_cafe_lealtad',
    color: '#1B4332',
    logo: CAFE_LOGO,
    comoAcumular: '1 punto por cada $100 MXN de compra (1 punto = $1 MXN).',
    wa: '+525555030303',
    maps: 'https://maps.google.com/?q=Cafe+Luna+CDMX',
    direccion: 'Av. Álvaro Obregón 210, Roma Norte, CDMX (demo)',
    horario: 'Lun a dom · 7:30 am a 9:00 pm',
    latlng: '',
  },
  barberia: {
    nombre: 'Barbería El Patrón',
    classSuffix: 'demo_barberia_lealtad',
    color: '#1B2438',
    logo: BARBERIA_LOGO,
    comoAcumular: '1 punto por cada $100 MXN de compra (1 punto = $1 MXN).',
    wa: '+525555010101',
    maps: 'https://maps.google.com/?q=Barberia+El+Patron+CDMX',
    direccion: 'Av. Insurgentes Sur 480, Roma Sur, CDMX (demo)',
    horario: 'Lun a sáb · 10:00 am a 8:00 pm',
    latlng: '',
  },
  abarrotes: {
    nombre: 'Abarrotes La Providencia',
    classSuffix: 'demo_abarrotes_lealtad',
    color: '#3E7D32',
    logo: ABARROTES_LOGO,
    comoAcumular: '1 punto por cada $100 MXN de compra (1 punto = $1 MXN).',
    wa: '+525555020202',
    maps: 'https://maps.google.com/?q=Abarrotes+La+Providencia+CDMX',
    direccion: 'Calle Morelos 15, Col. Providencia, CDMX (demo)',
    horario: 'Todos los días · 7:00 am a 10:00 pm',
    latlng: '',
  },
};

function waDigits(tel) {
  let d = String(tel || '').replace(/\D/g, '');
  if (d.length === 10) d = `52${d}`;
  if (d.startsWith('52') && d.length > 12) d = d.slice(-12);
  return d;
}

function image(uri, description) {
  return {
    sourceUri: { uri },
    contentDescription: {
      defaultValue: { language: 'es-MX', value: description },
    },
  };
}

function buildPatch(cfg) {
  const classId = `${ISSUER_ID}.${cfg.classSuffix}`;
  const patch = {
    id: classId,
    issuerName: cfg.nombre,
    programName: `Lealtad ${cfg.nombre}`,
    programLogo: image(cfg.logo, `Logo ${cfg.nombre}`),
    hexBackgroundColor: cfg.color,
    reviewStatus: 'UNDER_REVIEW',
    accountNameLabel: 'Cliente',
    accountIdLabel: 'Teléfono',
    heroImage: image(banner(cfg.logo, 1032, 336, cfg.color), `${cfg.nombre} — bienvenida`),
    wideProgramLogo: image(banner(cfg.logo, 660, 220, cfg.color), `Logo ${cfg.nombre}`),
    textModulesData: [
      { header: 'Cómo acumular', body: cfg.comoAcumular },
      {
        header: 'Cómo usarlo',
        body: 'Muestra este código en la caja. Puedes usar tu saldo como pago en cualquier visita.',
      },
    ],
  };

  const uris = [];
  if (cfg.wa) {
    uris.push({
      uri: `https://wa.me/${waDigits(cfg.wa)}`,
      description: `WhatsApp ${cfg.nombre}`,
      id: 'whatsapp',
    });
  }
  if (cfg.maps) uris.push({ uri: cfg.maps, description: 'Cómo llegar', id: 'maps' });
  if (uris.length > 0) patch.linksModuleData = { uris };

  // labelValueRows usa label/value (header/body es solo de textModulesData).
  const rows = [];
  if (cfg.direccion) rows.push({ columns: [{ label: 'Dónde estamos', value: cfg.direccion }] });
  if (cfg.horario) rows.push({ columns: [{ label: 'Horario', value: cfg.horario }] });
  if (rows.length > 0) {
    patch.infoModuleData = { labelValueRows: rows, showLastUpdateTime: false };
  }

  if (cfg.latlng) {
    const [latRaw, lngRaw] = cfg.latlng.split(',');
    const latitude = Number(latRaw);
    const longitude = Number(lngRaw);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      patch.locations = [{ kind: 'walletobjects#latLongPoint', latitude, longitude }];
    }
  }

  return { classId, patch };
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

async function updateOne(token, key) {
  const cfg = TENANTS[key];
  const { classId, patch } = buildPatch(cfg);
  console.log(`\n========== ${key.toUpperCase()} ==========`);
  console.log('classId:', classId);

  const url = `${CLASS_URL}/${encodeURIComponent(classId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const text = await res.text();
  console.log('PATCH status:', res.status);
  if (!res.ok) {
    console.log(text);
    return { key, status: 'patch_failed', http: res.status };
  }

  const verify = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await verify.json().catch(() => ({}));
  const ok =
    verify.ok &&
    json.id === classId &&
    Boolean(json.heroImage) &&
    Boolean(json.wideProgramLogo) &&
    (!patch.linksModuleData || Boolean(json.linksModuleData)) &&
    (!patch.infoModuleData || Boolean(json.infoModuleData));

  console.log('GET verificación:', verify.status);
  console.log('hero:', Boolean(json.heroImage), '· wideLogo:', Boolean(json.wideProgramLogo));
  console.log('links:', Boolean(json.linksModuleData), '· info:', Boolean(json.infoModuleData));
  if (!ok) console.log(JSON.stringify(json, null, 2));

  return { key, status: ok ? 'patched_verified' : 'patched_but_incomplete', classId };
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a in TENANTS);
  const keys = args.length > 0 ? args : Object.keys(TENANTS);

  const { token, email } = await getAccessToken();
  console.log('service account:', email);
  console.log('issuer:', ISSUER_ID);
  console.log('tenants:', keys.join(', '));

  const results = [];
  for (const key of keys) {
    results.push(await updateOne(token, key));
  }

  console.log('\n========== RESUMEN ==========');
  console.log(JSON.stringify(results, null, 2));
  if (results.some((r) => r.status !== 'patched_verified')) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
