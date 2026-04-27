// ─── seed-luciano.js ──────────────────────────────────────────────────────────
// Crea el reseller Luciano Puntillo y su cliente Antonio Campetella.
// Uso: node scripts/seed-luciano.js
// Requiere MONGODB_URI y MONGODB_DB en process.env o en .env.local

const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const PASS_SALT = 'reseller_pass_salt_2026';
const DEFAULT_PASSWORD = 'luciano2026'; // Cambiar después del primer login

const RESELLER = {
  resellerId:    'luciano',
  nombre:        'Luciano Puntillo',
  email:         'puntilloluciano@gmail.com',
  plan:          'pro',
  status:        'activo',
  whatsappNumber: '5493515920758',
  alertNumber:   '5493515920758',
  comisionPct:   20,
};

const CLIENT = {
  resellerId:  'luciano',
  clientSlug:  'antonio-campetella',
  nombre:      'Antonio Campetella',
  negocio:     'Servicios financieros Córdoba',
  email:       '',
  telefono:    '',
  alertNumber: '5493515920758',
  formularios: [
    {
      formId:     '1450524039906078',
      formName:   'LEADS NUEVO (3 rangos de edad)',
      plataforma: 'fb/ig',
      activo:     true,
    },
  ],
  status: 'activo',
  // Legacy query: includes existing leads before the reseller system
  legacyQuery: { clientId: 'agentia-ventas', canal_origen: 'fb-ads' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashPassword(raw) {
  return crypto.createHash('sha256').update(raw + PASS_SALT).digest('hex');
}

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return {};
  const pairs = {};
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.trim().match(/^([^#=]+)=(.+)$/);
    if (m) pairs[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return pairs;
}

async function main() {
  const root = path.join(__dirname, '..');
  // Load env from .env.local or .env
  const env = {
    ...loadEnvFile(path.join(root, '.env')),
    ...loadEnvFile(path.join(root, '.env.local')),
    ...process.env,
  };

  const uri = env.MONGODB_URI;
  const dbName = env.MONGODB_DB || 'agentia_chatbot_ventas';
  if (!uri) {
    console.error('❌  MONGODB_URI no encontrado en variables de entorno ni en .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    // ── Reseller ──
    const passwordHash = hashPassword(DEFAULT_PASSWORD);
    const now = new Date();

    const resExisting = await db.collection('resellers').findOne({ resellerId: RESELLER.resellerId });
    if (resExisting) {
      console.log(`⚠️  Reseller "${RESELLER.resellerId}" ya existe — actualizando campos (passwordHash NO se toca)`);
      await db.collection('resellers').updateOne(
        { resellerId: RESELLER.resellerId },
        { $set: { ...RESELLER, updatedAt: now } }
      );
    } else {
      await db.collection('resellers').insertOne({
        ...RESELLER,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`✅  Reseller "${RESELLER.resellerId}" creado`);
      console.log(`🔑  Contraseña inicial: "${DEFAULT_PASSWORD}" — ¡cambiar después del primer acceso!`);
    }

    // ── Client ──
    const cliExisting = await db.collection('reseller_clients').findOne({
      resellerId: CLIENT.resellerId,
      clientSlug: CLIENT.clientSlug,
    });
    if (cliExisting) {
      console.log(`⚠️  Cliente "${CLIENT.clientSlug}" ya existe — actualizando`);
      await db.collection('reseller_clients').updateOne(
        { resellerId: CLIENT.resellerId, clientSlug: CLIENT.clientSlug },
        { $set: { ...CLIENT, updatedAt: now } }
      );
    } else {
      await db.collection('reseller_clients').insertOne({
        ...CLIENT,
        createdAt: now,
      });
      console.log(`✅  Cliente "${CLIENT.clientSlug}" creado`);
    }

    // ── Índices ──
    await db.collection('resellers').createIndex({ resellerId: 1 }, { unique: true });
    await db.collection('reseller_clients').createIndex({ resellerId: 1, clientSlug: 1 }, { unique: true });
    await db.collection('reseller_clients').createIndex({ 'formularios.formId': 1 });
    console.log('✅  Índices creados/verificados');

    console.log('');
    console.log('─────────────────────────────────────────────');
    console.log('🚀  Seed completado. Accede al portal en:');
    console.log('    https://agentia.software/portal/luciano');
    console.log(`    Contraseña: ${DEFAULT_PASSWORD}`);
    console.log('─────────────────────────────────────────────');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('❌  Error en seed:', err);
  process.exit(1);
});
