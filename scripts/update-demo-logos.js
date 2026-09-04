#!/usr/bin/env node
/**
 * Crea o actualiza la Loyalty Class de Google Wallet (logo, hero, wide).
 * Lee el tenant de Mongo (`loyalty_tenants`) si la key no está hardcodeada.
 *
 *   node scripts/update-demo-logos.js autolavado_marea
 *   node scripts/update-demo-logos.js sabucan --sin-hero
 *   node scripts/update-demo-logos.js --all
 *
 * Si la clase no existe, la crea (misma forma que create-demo-classes.js).
 * Los pases ya emitidos se refrescan solos en el celular del cliente.
 */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const CLASS_URL = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass';
const WALLET_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';
const TENANTS_COL = 'loyalty_tenants';

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
  sabucan: {
    nombre: 'SABUCAN',
    classSuffix: 'sabucan_lealtad',
    color: '#1E2340',
    logoUrl:
      (process.env.NEXT_PUBLIC_SABUCAN_LOGO_URL || '').trim() ||
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787945953/sabucan-logo-transparente_kywnjn.png',
    cashbackPct: 1,
  },
  carnitas_granada: {
    nombre: 'Carnitas Granada',
    classSuffix: 'carnitas_granada_lealtad',
    color: '#E3231D',
    logoUrl: flattenOnBrand(
      (process.env.NEXT_PUBLIC_CARNITAS_WALLET_LOGO_URL || '').trim() ||
        'https://res.cloudinary.com/dcy5a39tm/image/upload/v1788472062/carnitas-granada-logo-cuadrado_y5dcyn.png',
      '#E3231D',
    ),
    lockupUrl:
      (process.env.NEXT_PUBLIC_CARNITAS_LOGO_URL || '').trim() ||
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1788468955/carnitas-granada-logo-completo-transparente_acvzhj.png',
    omitWide: true,
    heroFromLockup: true,
    programName: 'Lealtad',
    cashbackPct: 5,
  },
  cafe: {
    nombre: 'Café Luna',
    classSuffix: 'demo_cafe_lealtad',
    color: '#1B4332',
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787942156/cafe-luna-logo-transparente_xskmgn.png',
    heroUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1788155757/cafe-luna-hero-wallet_dqnc9p.png',
    cashbackPct: 1,
  },
  barberia: {
    nombre: 'Barbería El Patrón',
    classSuffix: 'demo_barberia_lealtad',
    color: '#1B2438',
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787941859/barberia-el-patron-logo-transparente_ej3ruw.png',
    cashbackPct: 1,
  },
  abarrotes: {
    nombre: 'Abarrotes La Providencia',
    classSuffix: 'demo_abarrotes_lealtad',
    color: '#3E7D32',
    logoUrl:
      'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787941811/abarrotes-la-providencia-logo-transparente_jgk7kf.png',
    cashbackPct: 1,
  },
};

function banner(url, w, h, hex) {
  if (!url || !url.includes('/upload/')) return url;
  const bg = String(hex).replace('#', '').toLowerCase();
  return url.replace('/upload/', `/upload/c_pad,w_${w},h_${h},b_rgb:${bg},f_jpg/`);
}

function fitBanner(url, fitW, fitH, padW, padH, hex) {
  if (!url || !url.includes('/upload/')) return url;
  const bg = String(hex).replace('#', '').toLowerCase();
  return url.replace(
    '/upload/',
    `/upload/c_fit,w_${fitW},h_${fitH}/c_pad,w_${padW},h_${padH},b_rgb:${bg},f_jpg/`,
  );
}

function flattenOnBrand(url, hex) {
  if (!url || !url.includes('/upload/')) return url;
  const bg = String(hex).replace('#', '').toLowerCase();
  return url.replace(
    '/upload/',
    `/upload/c_fit,w_500,h_500/c_pad,w_660,h_660,b_rgb:${bg},f_jpg/`,
  );
}

function cfgFromMongoDoc(doc) {
  const key = String(doc.key || '').trim();
  if (!key) return null;
  const isDemo = doc.isDemo === true || doc.plan === 'demo';
  const rec = doc.recompensa || {};
  const cashbackPct =
    rec.modelo === 'cashback' && Number(rec.parametro) > 0 ? Number(rec.parametro) : 1;
  const color = String(doc.colorPrimario || '#1E2340');
  return {
    nombre: String(doc.nombre || key),
    classSuffix: String(doc.classSuffix || (isDemo ? `demo_${key}_lealtad` : `${key}_lealtad`)),
    color,
    logoUrl: String(doc.logoUrl || '').trim(),
    cashbackPct,
    programName: 'Lealtad',
  };
}

async function connectTenants() {
  const uri = (process.env.MONGODB_URI || '').trim();
  const dbName = (process.env.MONGODB_DB || 'agentia_chatbot_ventas').trim();
  if (!uri) return { client: null, col: null };
  const client = new MongoClient(uri, {
    maxPoolSize: 3,
    serverSelectionTimeoutMS: 12_000,
  });
  await client.connect();
  return { client, col: client.db(dbName).collection(TENANTS_COL) };
}

async function resolveCfg(key, col) {
  if (DEMO_LOGOS[key]) return { key, ...DEMO_LOGOS[key] };
  if (col) {
    const doc = await col.findOne({ key });
    if (doc) {
      const cfg = cfgFromMongoDoc(doc);
      if (cfg) return { key, ...cfg };
    }
  }
  return null;
}

async function listMongoKeys(col) {
  if (!col) return [];
  const docs = await col.find({}, { projection: { key: 1 } }).toArray();
  return docs.map((d) => d.key).filter(Boolean);
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

function classIdOf(cfg) {
  return `${ISSUER_ID}.${cfg.classSuffix}`;
}

function heroAndWide(cfg, sinHero) {
  const heroSource = cfg.lockupUrl || cfg.logoUrl;
  const envHero = (process.env.NEXT_PUBLIC_CARNITAS_HERO_URL || '').trim();
  const heroUrl = sinHero
    ? null
    : cfg.heroUrl ||
      (cfg.heroFromLockup
        ? envHero && !envHero.includes('carnitas-granada-hero-wallet_1')
          ? envHero
          : fitBanner(heroSource, 520, 240, 1032, 336, cfg.color)
        : banner(cfg.logoUrl, 1032, 336, cfg.color));
  const omitWide = Boolean(cfg.omitWide);
  const wideUrl = omitWide ? null : banner(cfg.logoUrl, 660, 220, cfg.color);
  return { heroUrl, wideUrl, omitWide };
}

async function createClass(token, cfg) {
  const classId = classIdOf(cfg);
  const pct = Number(cfg.cashbackPct) > 0 ? Number(cfg.cashbackPct) : 1;
  const { heroUrl, wideUrl } = heroAndWide(cfg, false);
  const body = {
    id: classId,
    issuerName: cfg.nombre,
    programName: cfg.programName || `Lealtad ${cfg.nombre}`,
    programLogo: imagen(cfg.logoUrl, `Logo ${cfg.nombre}`),
    hexBackgroundColor: cfg.color,
    reviewStatus: 'UNDER_REVIEW',
    textModulesData: [
      {
        header: 'Cómo acumular',
        body:
          pct === 1
            ? `1 punto por cada $100 MXN de compra (1 punto = $1 MXN) · ${cfg.nombre}`
            : `${pct}% de cashback en puntos (1 punto = $1 MXN) · ${cfg.nombre}`,
      },
    ],
  };
  if (heroUrl) body.heroImage = imagen(heroUrl, `${cfg.nombre} — bienvenida`);
  if (wideUrl) body.wideProgramLogo = imagen(wideUrl, `Logo ${cfg.nombre}`);

  console.log('\n--- POST crear clase ---');
  const res = await fetch(CLASS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log('status:', res.status);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
  return res.ok;
}

async function patchLogo(token, cfg, sinHero) {
  const classId = classIdOf(cfg);
  const url = `${CLASS_URL}/${encodeURIComponent(classId)}`;
  const { heroUrl, wideUrl, omitWide } = heroAndWide(cfg, sinHero);

  console.log('programLogo:', cfg.logoUrl);
  console.log('heroImage  :', heroUrl || '(se elimina)');
  console.log('wideLogo   :', wideUrl || '(se elimina)');

  let metodo = 'PATCH';
  let body = {
    id: classId,
    reviewStatus: 'UNDER_REVIEW',
    programLogo: imagen(cfg.logoUrl, `Logo ${cfg.nombre}`),
  };
  if (heroUrl) body.heroImage = imagen(heroUrl, `${cfg.nombre} — bienvenida`);
  if (wideUrl) body.wideProgramLogo = imagen(wideUrl, `Logo ${cfg.nombre}`);
  if (cfg.programName) body.programName = cfg.programName;

  if (sinHero || omitWide) {
    const actual = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!actual.ok) {
      console.log('GET previo falló:', actual.status);
      return { key: cfg.key, status: 'get_previo_failed', http: actual.status, classId };
    }
    const clase = await actual.json();
    if (sinHero) delete clase.heroImage;
    if (omitWide) delete clase.wideProgramLogo;
    metodo = 'PUT';
    body = {
      ...clase,
      reviewStatus: 'UNDER_REVIEW',
      programLogo: imagen(cfg.logoUrl, `Logo ${cfg.nombre}`),
      ...(cfg.programName ? { programName: cfg.programName } : {}),
    };
    if (heroUrl) body.heroImage = imagen(heroUrl, `${cfg.nombre} — bienvenida`);
    else delete body.heroImage;
    if (wideUrl) body.wideProgramLogo = imagen(wideUrl, `Logo ${cfg.nombre}`);
    else delete body.wideProgramLogo;
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
  if (!res.ok) return { key: cfg.key, status: 'patch_failed', http: res.status, classId };

  const verify = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await verify.json().catch(() => ({}));
  const logoGuardado = json?.programLogo?.sourceUri?.uri;
  const heroGuardado = json?.heroImage?.sourceUri?.uri;
  const wideGuardado = json?.wideProgramLogo?.sourceUri?.uri;

  const heroOk = sinHero ? !heroGuardado : heroGuardado === heroUrl;
  const wideOk = omitWide ? !wideGuardado : wideGuardado === wideUrl;
  const ok = verify.ok && logoGuardado === cfg.logoUrl && heroOk && wideOk;

  console.log('\n--- GET de verificación inmediata ---');
  console.log('status:', verify.status);
  console.log('programLogo    :', logoGuardado);
  console.log('heroImage      :', heroGuardado ?? '(sin hero)');
  console.log('wideProgramLogo:', wideGuardado ?? '(sin wide)');
  console.log('todo correcto  :', ok);

  return {
    key: cfg.key,
    status: ok ? 'imagenes_verificadas' : 'patched_but_not_confirmed',
    classId,
    logoGuardado,
    heroGuardado: heroGuardado ?? null,
    wideGuardado: wideGuardado ?? null,
  };
}

async function processKey(token, cfg, sinHero) {
  const classId = classIdOf(cfg);
  const url = `${CLASS_URL}/${encodeURIComponent(classId)}`;

  console.log(`\n========== ${cfg.key.toUpperCase()} ==========`);
  console.log('classId:', classId);
  console.log('nombre :', cfg.nombre);
  console.log('logoUrl:', cfg.logoUrl);

  if (!cfg.logoUrl) {
    console.log('Sin logoUrl — no se puede crear ni actualizar la clase.');
    return { key: cfg.key, status: 'missing_logo', classId };
  }

  const existing = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (existing.ok) {
    console.log('GET: la clase ya existe — actualizando imágenes.');
  } else {
    console.log(`GET: ${existing.status} — la clase no existe, creando…`);
    const created = await createClass(token, cfg);
    if (!created) {
      return { key: cfg.key, status: 'create_failed', classId };
    }
    console.log('Clase creada. Verificando imágenes…');
  }

  return patchLogo(token, cfg, sinHero);
}

function usage() {
  console.error(`Uso:
  node scripts/update-demo-logos.js <key> [--sin-hero]
  node scripts/update-demo-logos.js --all [--sin-hero]

Ejemplo:
  node scripts/update-demo-logos.js autolavado_marea`);
}

async function main() {
  const argv = process.argv.slice(2);
  const sinHero = argv.includes('--sin-hero');
  const all = argv.includes('--all');
  const keysArg = argv.filter((a) => !a.startsWith('--'));

  if (!all && keysArg.length === 0) {
    usage();
    process.exit(1);
  }

  const { client, col } = await connectTenants();
  try {
    let keys = keysArg;
    if (all) {
      const fromMongo = await listMongoKeys(col);
      keys = fromMongo.length > 0 ? fromMongo : Object.keys(DEMO_LOGOS);
    }

    const cfgs = [];
    for (const key of keys) {
      const cfg = await resolveCfg(key, col);
      if (!cfg) {
        console.error(`No existe el tenant "${key}" en loyalty_tenants ni en la lista conocida.`);
        if (client) await client.close();
        process.exit(1);
      }
      if (!cfg.logoUrl) {
        console.error(`El tenant "${key}" no tiene logoUrl.`);
        if (client) await client.close();
        process.exit(1);
      }
      cfgs.push(cfg);
    }

    const { token, email } = await getAccessToken();
    console.log('service account:', email);
    console.log('issuer:', ISSUER_ID);
    console.log('clases:', cfgs.map((c) => c.key).join(', '));
    console.log('modo hero:', sinHero ? 'quitar' : 'actualizar');

    const results = [];
    for (const cfg of cfgs) {
      results.push(await processKey(token, cfg, sinHero));
    }

    console.log('\n========== RESUMEN ==========');
    console.log(JSON.stringify(results, null, 2));
    const bad = results.some((r) => r.status !== 'imagenes_verificadas');
    if (bad) process.exit(1);
  } finally {
    if (client) await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
