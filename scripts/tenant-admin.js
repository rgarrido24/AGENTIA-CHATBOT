#!/usr/bin/env node
/**
 * Administración de tenants de lealtad por terminal.
 * La fuente de verdad es la colección Mongo `loyalty_tenants`.
 * No hace falta entrar a Atlas.
 *
 *   node scripts/tenant-admin.js list
 *   node scripts/tenant-admin.js info <key>
 *   node scripts/tenant-admin.js add
 *   node scripts/tenant-admin.js activar <key>
 *   node scripts/tenant-admin.js suspender <key>
 *   node scripts/tenant-admin.js migrate   # siembra sabucan + carnitas + 3 demos
 *
 * Requiere MONGODB_URI (Render Shell o .env.local).
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const { MongoClient } = require('mongodb');

const COLLECTION = 'loyalty_tenants';
const PLANES = ['demo', 'base', 'pro'];
const MODELOS = ['sellos', 'puntos', 'cashback'];

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

function slugify(nombre) {
  return String(nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
}

function pad(s, n) {
  const t = String(s ?? '');
  return t.length >= n ? t.slice(0, n) : t + ' '.repeat(n - t.length);
}

function fmtFecha(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toISOString().slice(0, 10);
}

function fmtRecompensa(r) {
  if (!r || !r.modelo) return '—';
  if (r.modelo === 'cashback') return `cashback ${r.parametro}%`;
  if (r.modelo === 'sellos') return `sellos ×${r.parametro}`;
  if (r.modelo === 'puntos') return `puntos ${r.parametro}/$100`;
  return String(r.modelo);
}

function routingFromKey(key, plan) {
  const isDemo = plan === 'demo';
  const hyphen = key.replace(/_/g, '-');
  return {
    isDemo,
    classSuffix: isDemo ? `demo_${key}_lealtad` : `${key}_lealtad`,
    objectPrefix: isDemo ? `demo-${hyphen}` : hyphen,
    collection: isDemo ? `demo_${key}_clientes` : `${key}_clientes`,
    basePath: isDemo ? `/demo/${key}` : `/${hyphen}`,
  };
}

/** Semilla de los 5 negocios actuales (wallet-tenant.ts). */
function seedTenants() {
  return [
    {
      key: 'sabucan',
      nombre: 'SABUCAN',
      plan: 'base',
      panelActivo: false,
      whatsapp: '',
      direccion: '',
      horario: '',
      logoUrl:
        'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787945953/sabucan-logo-transparente_kywnjn.png',
      colorPrimario: '#1E2340',
      colorAcento: '#F2691F',
      recompensa: { modelo: 'cashback', parametro: 1 },
      rewardMeta: 10,
      isDemo: false,
      classSuffix: 'sabucan_lealtad',
      objectPrefix: 'sabucan',
      collection: 'sabucan_clientes',
      basePath: '/sabucan',
    },
    {
      key: 'carnitas_granada',
      nombre: 'Carnitas Granada',
      plan: 'base',
      panelActivo: true,
      whatsapp: '+525657008418',
      direccion:
        'Maximino Ávila Camacho 33, Cd. de los Deportes, Benito Juárez, 03710 CDMX',
      horario: '9:30 am a 5:30 pm',
      mapsUrl: 'https://maps.app.goo.gl/h82G3F5Udy7PDTKTA',
      ubicacion: { lat: 19.38407, lng: -99.17727 },
      logoUrl:
        'https://res.cloudinary.com/dcy5a39tm/image/upload/v1788468955/carnitas-granada-logo-completo-transparente_acvzhj.png',
      walletLogoUrl:
        'https://res.cloudinary.com/dcy5a39tm/image/upload/v1788472062/carnitas-granada-logo-cuadrado_y5dcyn.png',
      colorPrimario: '#E3231D',
      colorAcento: '#FFD400',
      recompensa: { modelo: 'cashback', parametro: 5 },
      rewardMeta: 10,
      isDemo: false,
      classSuffix: 'carnitas_granada_lealtad',
      objectPrefix: 'carnitas-granada',
      collection: 'carnitas_clientes',
      basePath: '/carnitas',
    },
    {
      key: 'cafe',
      nombre: 'Café Luna',
      plan: 'demo',
      panelActivo: true,
      whatsapp: '+525555030303',
      direccion: 'Av. Álvaro Obregón 210, Roma Norte, CDMX (demo)',
      horario: 'Lun a dom · 7:30 am a 9:00 pm',
      logoUrl:
        'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787942156/cafe-luna-logo-transparente_xskmgn.png',
      colorPrimario: '#1B4332',
      colorAcento: '#C9A24B',
      recompensa: { modelo: 'cashback', parametro: 1 },
      rewardMeta: 10,
      mapsUrl: 'https://maps.google.com/?q=Cafe+Luna+CDMX',
      isDemo: true,
      classSuffix: 'demo_cafe_lealtad',
      objectPrefix: 'demo-cafe',
      collection: 'demo_cafe_clientes',
      basePath: '/demo/cafe',
    },
    {
      key: 'barberia',
      nombre: 'Barbería El Patrón',
      plan: 'demo',
      panelActivo: true,
      whatsapp: '+525555010101',
      direccion: 'Av. Insurgentes Sur 480, Roma Sur, CDMX (demo)',
      horario: 'Lun a sáb · 10:00 am a 8:00 pm',
      logoUrl:
        'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787941859/barberia-el-patron-logo-transparente_ej3ruw.png',
      colorPrimario: '#1B2438',
      colorAcento: '#C9A227',
      recompensa: { modelo: 'cashback', parametro: 1 },
      rewardMeta: 10,
      mapsUrl: 'https://maps.google.com/?q=Barberia+El+Patron+CDMX',
      isDemo: true,
      classSuffix: 'demo_barberia_lealtad',
      objectPrefix: 'demo-barberia',
      collection: 'demo_barberia_clientes',
      basePath: '/demo/barberia',
    },
    {
      key: 'abarrotes',
      nombre: 'Abarrotes La Providencia',
      plan: 'demo',
      panelActivo: true,
      whatsapp: '+525555020202',
      direccion: 'Calle Morelos 15, Col. Providencia, CDMX (demo)',
      horario: 'Todos los días · 7:00 am a 10:00 pm',
      logoUrl:
        'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787941811/abarrotes-la-providencia-logo-transparente_jgk7kf.png',
      colorPrimario: '#3E7D32',
      colorAcento: '#D2691E',
      recompensa: { modelo: 'cashback', parametro: 1 },
      rewardMeta: 10,
      mapsUrl: 'https://maps.google.com/?q=Abarrotes+La+Providencia+CDMX',
      isDemo: true,
      classSuffix: 'demo_abarrotes_lealtad',
      objectPrefix: 'demo-abarrotes',
      collection: 'demo_abarrotes_clientes',
      basePath: '/demo/abarrotes',
    },
  ];
}

async function connect() {
  const uri = (process.env.MONGODB_URI || '').trim();
  const dbName = (process.env.MONGODB_DB || 'agentia_chatbot_ventas').trim();
  if (!uri) {
    console.error('Falta MONGODB_URI (.env.local, .env o el entorno de Render).');
    process.exit(1);
  }
  const client = new MongoClient(uri, {
    maxPoolSize: 3,
    serverSelectionTimeoutMS: 12_000,
  });
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection(COLLECTION);
  await col.createIndex({ key: 1 }, { unique: true });
  return { client, db, col, dbName };
}

function printList(docs) {
  if (!docs.length) {
    console.log('(sin tenants)');
    return;
  }
  console.log(
    pad('KEY', 22) +
      pad('NOMBRE', 28) +
      pad('PLAN', 8) +
      pad('PANEL', 12) +
      pad('RECOMPENSA', 18) +
      'ALTA',
  );
  console.log('-'.repeat(96));
  for (const d of docs) {
    console.log(
      pad(d.key, 22) +
        pad(d.nombre, 28) +
        pad(d.plan, 8) +
        pad(d.panelActivo ? 'activo' : 'inactivo', 12) +
        pad(fmtRecompensa(d.recompensa), 18) +
        fmtFecha(d.createdAt),
    );
  }
  console.log(`\n${docs.length} negocio(s)`);
}

async function cmdList(col) {
  const docs = await col.find({}).sort({ createdAt: 1, key: 1 }).toArray();
  printList(docs);
}

async function cmdInfo(col, key) {
  const doc = await col.findOne({ key });
  if (!doc) {
    console.error(`No existe el tenant "${key}".`);
    process.exit(1);
  }
  const { _id, ...rest } = doc;
  console.log(JSON.stringify(rest, null, 2));
}

async function setPanel(col, key, panelActivo) {
  const now = new Date();
  const res = await col.updateOne(
    { key },
    { $set: { panelActivo, updatedAt: now } },
  );
  if (res.matchedCount === 0) {
    console.error(`No existe el tenant "${key}".`);
    process.exit(1);
  }
  const doc = await col.findOne({ key });
  console.log(
    `${doc.nombre} (${key}) → panelActivo: ${doc.panelActivo} · ${fmtFecha(doc.updatedAt)}`,
  );
}

async function ask(rl, label, opts = {}) {
  const { def, required = false, validate } = opts;
  const suffix = def != null && def !== '' ? ` [${def}]` : '';
  const raw = (await rl.question(`${label}${suffix}: `)).trim();
  const value = raw || (def != null ? String(def) : '');
  if (required && !value) {
    console.log('  (obligatorio)');
    return ask(rl, label, opts);
  }
  if (validate) {
    const err = validate(value);
    if (err) {
      console.log(`  ${err}`);
      return ask(rl, label, opts);
    }
  }
  return value;
}

async function cmdAdd(col) {
  if (!process.stdin.isTTY) {
    console.error('add es interactivo. Córrelo en una terminal, o usa: node scripts/tenant-admin.js migrate');
    process.exit(1);
  }
  const rl = readline.createInterface({ input, output });
  try {
    console.log('\nAlta de tenant — panelActivo quedará en false hasta confirmar pago.\n');
    const nombre = await ask(rl, 'Nombre del negocio', { required: true });
    const suggested = slugify(nombre);
    const key = await ask(rl, 'Key (slug único)', {
      def: suggested,
      required: true,
      validate: (v) => (/^[a-z][a-z0-9_]{1,47}$/.test(v) ? null : 'solo a-z, 0-9 y _ ; debe empezar con letra'),
    });
    const existing = await col.findOne({ key });
    if (existing) {
      console.error(`Ya existe "${key}".`);
      process.exit(1);
    }
    const whatsapp = await ask(rl, 'WhatsApp');
    const direccion = await ask(rl, 'Dirección');
    const horario = await ask(rl, 'Horario');
    const logoUrl = await ask(rl, 'logoUrl');
    const colorPrimario = await ask(rl, 'colorPrimario', {
      def: '#1E2340',
      validate: (v) => (/^#?[0-9a-fA-F]{6}$/.test(v) ? null : 'hex de 6 dígitos, ej. #E3231D'),
    });
    const colorAcento = await ask(rl, 'colorAcento', {
      def: '#F2691F',
      validate: (v) => (/^#?[0-9a-fA-F]{6}$/.test(v) ? null : 'hex de 6 dígitos'),
    });
    const modelo = await ask(rl, `Modelo de recompensa (${MODELOS.join('/')})`, {
      def: 'cashback',
      validate: (v) => (MODELOS.includes(v) ? null : `uno de: ${MODELOS.join(', ')}`),
    });
    const paramLabel =
      modelo === 'cashback'
        ? '% de cashback'
        : modelo === 'sellos'
          ? 'sellos para la recompensa'
          : 'puntos por cada $100';
    const paramDef = modelo === 'cashback' ? '5' : modelo === 'sellos' ? '10' : '1';
    const paramRaw = await ask(rl, paramLabel, {
      def: paramDef,
      validate: (v) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? null : 'número > 0';
      },
    });
    const plan = await ask(rl, `Plan (${PLANES.join('/')})`, {
      def: 'base',
      validate: (v) => (PLANES.includes(v) ? null : `uno de: ${PLANES.join(', ')}`),
    });

    const hex = (v) => (v.startsWith('#') ? v.toUpperCase() : `#${v.toUpperCase()}`);
    const now = new Date();
    const routing = routingFromKey(key, plan);
    const doc = {
      key,
      nombre,
      plan,
      panelActivo: false,
      whatsapp,
      direccion,
      horario,
      logoUrl,
      colorPrimario: hex(colorPrimario),
      colorAcento: hex(colorAcento),
      recompensa: { modelo, parametro: Number(paramRaw) },
      ...routing,
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(doc);
    console.log('\nCreado. Pago pendiente → panelActivo: false');
    console.log(`  key:  ${key}`);
    console.log(`  path: ${doc.basePath}`);
    console.log(`  Cuando se confirme el pago: node scripts/tenant-admin.js activar ${key}`);
  } finally {
    rl.close();
  }
}

async function cmdMigrate(col) {
  const now = new Date();
  const results = [];
  let i = 0;
  for (const seed of seedTenants()) {
    const { key, panelActivo, ...fields } = seed;
    const createdAt = new Date(now.getTime() + i * 1000);
    i += 1;
    const res = await col.updateOne(
      { key },
      {
        $set: { ...fields, key, updatedAt: now },
        $setOnInsert: { panelActivo, createdAt },
      },
      { upsert: true },
    );
    const action = res.upsertedCount ? 'creado' : 'actualizado';
    results.push({ key, action, panelActivoPreservado: !res.upsertedCount });
  }
  console.log('Migración loyalty_tenants:');
  for (const r of results) {
    console.log(
      `  ${r.key}: ${r.action}${r.panelActivoPreservado ? ' (panelActivo no se tocó)' : ''}`,
    );
  }
}

function usage() {
  console.log(`Uso:
  node scripts/tenant-admin.js list
  node scripts/tenant-admin.js info <key>
  node scripts/tenant-admin.js add
  node scripts/tenant-admin.js activar <key>
  node scripts/tenant-admin.js suspender <key>
  node scripts/tenant-admin.js migrate`);
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  if (!cmd) {
    usage();
    process.exit(1);
  }

  const { client, col, dbName } = await connect();
  try {
    console.log(`DB: ${dbName} · ${COLLECTION}\n`);
    switch (cmd) {
      case 'list':
        await cmdList(col);
        break;
      case 'info':
        if (!arg) {
          console.error('Uso: node scripts/tenant-admin.js info <key>');
          process.exit(1);
        }
        await cmdInfo(col, arg);
        break;
      case 'add':
        await cmdAdd(col);
        break;
      case 'activar':
        if (!arg) {
          console.error('Uso: node scripts/tenant-admin.js activar <key>');
          process.exit(1);
        }
        await setPanel(col, arg, true);
        break;
      case 'suspender':
        if (!arg) {
          console.error('Uso: node scripts/tenant-admin.js suspender <key>');
          process.exit(1);
        }
        await setPanel(col, arg, false);
        break;
      case 'migrate':
        await cmdMigrate(col);
        console.log('');
        await cmdList(col);
        break;
      default:
        usage();
        process.exit(1);
    }
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
