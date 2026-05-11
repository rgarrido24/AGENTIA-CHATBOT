#!/usr/bin/env node
/**
 * normalize-luciano-phones.js
 *
 * Recorre la colección `leads` y normaliza el campo `telefono` para que
 * quede en formato E.164 válido para WhatsApp (AR principalmente).
 *
 * Casos que arregla:
 *   "01157550180"     → "5491157550180"   (quita 0 nacional + agrega 549)
 *   "1157550180"      → "5491157550180"   (10 dígitos AR sin prefijo)
 *   "541157550180"    → "5491157550180"   (54 sin 9 móvil → agrega 9)
 *
 * Por defecto corre en modo `--dry` (solo muestra qué cambiaría sin tocar BD).
 * Para aplicar realmente: `node scripts/normalize-luciano-phones.js --apply`
 *
 * Filtro opcional por reseller: `--reseller luciano`
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { MongoClient } = require('mongodb');

const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes('--apply');
const RESELLER_FILTER = (() => {
  const i = ARGS.indexOf('--reseller');
  return i >= 0 ? ARGS[i + 1] : null;
})();

function normalizePhone(raw) {
  let d = (raw || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('549') && d.length === 13) return d;
  if (d.startsWith('54') && d.length === 12) return `549${d.slice(2)}`;
  if (d.length >= 12 && !d.startsWith('0')) return d;
  if (d.startsWith('0') && d.length === 11) return `549${d.slice(1)}`;
  if (d.length === 10) return `549${d}`;
  if (d.length === 11 && d.startsWith('9')) return `54${d}`;
  return d;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'agentia';
  if (!uri) {
    console.error('❌ Falta MONGODB_URI en .env');
    process.exit(1);
  }

  console.log(`\n📡 Conectando a Mongo (${dbName})…`);
  console.log(`   Modo: ${APPLY ? '✏️  APLICAR cambios' : '👀 DRY RUN (sin tocar BD)'}`);
  if (RESELLER_FILTER) console.log(`   Filtro reseller: ${RESELLER_FILTER}`);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const filter = { telefono: { $exists: true, $ne: '' } };
  if (RESELLER_FILTER) filter.resellerId = RESELLER_FILTER;

  const cursor = db.collection('leads').find(filter).project({
    _id: 1, leadId: 1, telefono: 1, nombre: 1, resellerId: 1, clientSlug: 1,
  });

  let total = 0;
  let changed = 0;
  let unchanged = 0;
  const samples = [];

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    total++;
    const before = String(doc.telefono || '');
    const after = normalizePhone(before);

    if (!after) {
      unchanged++;
      continue;
    }

    if (after === before.replace(/\D/g, '')) {
      // El número ya estaba limpio (solo dígitos) y no necesita cambio
      unchanged++;
      continue;
    }

    if (after === before) {
      unchanged++;
      continue;
    }

    changed++;
    if (samples.length < 12) {
      samples.push({
        nombre: doc.nombre || '(sin nombre)',
        reseller: doc.resellerId || '(sin reseller)',
        before,
        after,
      });
    }

    if (APPLY) {
      await db.collection('leads').updateOne(
        { _id: doc._id },
        { $set: { telefono: after, telefono_normalized_at: new Date() } },
      );
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`   Total leads escaneados:  ${total}`);
  console.log(`   Cambiarían/cambiaron:    ${changed}`);
  console.log(`   Sin cambios:             ${unchanged}`);

  if (samples.length > 0) {
    console.log('\n🔍 Muestras de cambios:');
    samples.forEach((s, i) => {
      console.log(`   ${i + 1}. [${s.reseller}] ${s.nombre}`);
      console.log(`        antes:   ${s.before}`);
      console.log(`        después: ${s.after}`);
    });
  }

  if (!APPLY && changed > 0) {
    console.log('\n💡 Para aplicar realmente:');
    console.log('   node scripts/normalize-luciano-phones.js --apply' +
      (RESELLER_FILTER ? ` --reseller ${RESELLER_FILTER}` : ''));
  } else if (APPLY) {
    console.log('\n✅ Cambios aplicados.');
  }

  await client.close();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
