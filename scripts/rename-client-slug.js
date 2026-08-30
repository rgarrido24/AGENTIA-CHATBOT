#!/usr/bin/env node
/**
 * rename-client-slug.js
 *
 * Migra clientSlug para un reseller en la colección `leads` (incluye leads
 * y el documento _collection_type: 'reseller_client').
 *
 * Flujo seguro:
 *   1) Inserta copias de todos los documentos que NO son reseller_client con el
 *      nuevo clientSlug y metadatos de auditoría (_slugMigration).
 *   2) Actualiza in-place el documento reseller_client al nuevo slug.
 *   3) Verifica conteos y correspondencia copia ↔ original.
 *   4) Nada se borra salvo que pases explícitamente --purge-old (solo entonces
 *      se eliminan los originales con el slug viejo que no sean reseller_client).
 *
 * Uso:
 *   node scripts/rename-client-slug.js
 *   node scripts/rename-client-slug.js --dry-run
 *   node scripts/rename-client-slug.js --purge-old
 *
 * Variables: MONGODB_URI, MONGODB_DB (opcional, default agentia_chatbot_ventas)
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const RESELLER_ID = 'luciano';
const OLD_SLUG = 'pablo-barrionuevo';
const NEW_SLUG = 'melina-arista';

function stripBom(t) {
  return t.charCodeAt(0) === 0xfeff ? t.slice(1) : t;
}
function loadEnvFile(p) {
  if (!fs.existsSync(p)) return {};
  const pairs = {};
  const raw = stripBom(fs.readFileSync(p, 'utf8'));
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    pairs[k] = v;
  }
  return pairs;
}

const ROOT = path.join(__dirname, '..');
const ENV = {
  ...loadEnvFile(path.join(ROOT, '.env')),
  ...loadEnvFile(path.join(ROOT, '.env.local')),
  ...process.env,
};

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const PURGE_OLD = ARGS.includes('--purge-old');

function cloneDocForInsert(original) {
  const copy = { ...original };
  delete copy._id;
  copy.clientSlug = NEW_SLUG;
  copy._slugMigration = {
    fromClientSlug: OLD_SLUG,
    sourceId: original._id instanceof ObjectId ? original._id : new ObjectId(String(original._id)),
    migratedAt: new Date(),
    script: 'rename-client-slug.js',
  };
  copy.updatedAt = new Date();
  return copy;
}

async function main() {
  const uri = ENV.MONGODB_URI;
  const dbName = ENV.MONGODB_DB || ENV.MONGO_DB || 'agentia_chatbot_ventas';
  if (!uri) {
    console.error('❌ Falta MONGODB_URI (.env o entorno)');
    process.exit(1);
  }

  console.log(`\n📡 DB: ${dbName}`);
  console.log(`   Reseller: ${RESELLER_ID}`);
  console.log(`   Slug: ${OLD_SLUG} → ${NEW_SLUG}`);
  console.log(`   Modo: ${DRY_RUN ? 'DRY-RUN (sin escritura)' : 'EJECUCIÓN'}`);
  if (PURGE_OLD && !DRY_RUN) console.log('   ⚠️  --purge-old: se eliminarán originales con slug viejo (no reseller_client)');

  const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 15_000 });
  await client.connect();
  const db = client.db(dbName);
  const coll = db.collection('leads');

  const baseFilter = { resellerId: RESELLER_ID, clientSlug: OLD_SLUG };
  const resellerClientFilter = {
    ...baseFilter,
    _collection_type: 'reseller_client',
  };
  const leadLikeFilter = {
    resellerId: RESELLER_ID,
    clientSlug: OLD_SLUG,
    _collection_type: { $ne: 'reseller_client' },
  };

  const blockingNewSlug = await coll.countDocuments({
    resellerId: RESELLER_ID,
    clientSlug: NEW_SLUG,
    $nor: [
      { '_slugMigration.script': 'rename-client-slug.js' },
      {
        _collection_type: 'reseller_client',
        clientSlugRenamedFrom: OLD_SLUG,
      },
    ],
  });
  if (blockingNewSlug > 0 && !DRY_RUN) {
    console.error(
      `\n❌ Ya hay ${blockingNewSlug} documento(s) con clientSlug="${NEW_SLUG}" ` +
        'sin marcas de esta migración. Aborta para no mezclar datos.',
    );
    await client.close();
    process.exit(1);
  }

  const resellerDoc = await coll.findOne(resellerClientFilter);
  const countLeadLike = await coll.countDocuments(leadLikeFilter);
  const countReseller = resellerDoc ? 1 : 0;
  const totalOld = countLeadLike + countReseller;

  console.log(`\n📊 Documentos con slug "${OLD_SLUG}":`);
  console.log(`   reseller_client: ${countReseller}`);
  console.log(`   otros (leads, etc.): ${countLeadLike}`);
  console.log(`   total: ${totalOld}`);

  if (!resellerDoc && !DRY_RUN) {
    console.error(`\n❌ No se encontró reseller_client para ${RESELLER_ID}/${OLD_SLUG}`);
    await client.close();
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('\n👀 Dry-run: no se escribe nada. Quita --dry-run para migrar.');
    await client.close();
    return;
  }

  // ─── 1) Copiar documentos que no son reseller_client ─────────────────────
  let inserted = 0;
  let skippedIdempotent = 0;
  const cursor = coll.find(leadLikeFilter);
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    const already = await coll.findOne({
      '_slugMigration.sourceId': doc._id,
      clientSlug: NEW_SLUG,
      resellerId: RESELLER_ID,
    });
    if (already) {
      skippedIdempotent++;
      continue;
    }
    const toInsert = cloneDocForInsert(doc);
    await coll.insertOne(toInsert);
    inserted++;
  }
  console.log(`\n✅ Copias insertadas: ${inserted} (omitidas por idempotencia: ${skippedIdempotent})`);

  // ─── 2) Actualizar reseller_client ───────────────────────────────────────
  const updReseller = await coll.updateOne(resellerClientFilter, {
    $set: {
      clientSlug: NEW_SLUG,
      updatedAt: new Date(),
      clientSlugRenamedFrom: OLD_SLUG,
      clientSlugRenamedAt: new Date(),
    },
  });
  if (updReseller.matchedCount === 0) {
    const alreadyNew = await coll.findOne({
      _collection_type: 'reseller_client',
      resellerId: RESELLER_ID,
      clientSlug: NEW_SLUG,
    });
    if (alreadyNew) {
      console.log('\nℹ️  reseller_client ya tenía el slug nuevo (matchedCount 0).');
    } else {
      console.error('\n❌ Falló la actualización de reseller_client.');
      await client.close();
      process.exit(1);
    }
  } else {
    console.log(`✅ reseller_client actualizado: modifiedCount=${updReseller.modifiedCount}`);
  }

  // ─── 3) Verificación (no borra) ───────────────────────────────────────────
  const remainingOldLeads = await coll.countDocuments(leadLikeFilter);
  const newSlugTotal = await coll.countDocuments({
    resellerId: RESELLER_ID,
    clientSlug: NEW_SLUG,
  });
  const newCopies = await coll.countDocuments({
    resellerId: RESELLER_ID,
    clientSlug: NEW_SLUG,
    '_slugMigration.sourceId': { $exists: true },
  });
  const newReseller = await coll.countDocuments({
    _collection_type: 'reseller_client',
    resellerId: RESELLER_ID,
    clientSlug: NEW_SLUG,
  });

  console.log('\n📋 Verificación post-migración:');
  console.log(`   Documentos aún con slug VIEJO (no reseller_client): ${remainingOldLeads}`);
  console.log(`   Total con slug NUEVO: ${newSlugTotal}`);
  console.log(`   Copias con _slugMigration: ${newCopies}`);
  console.log(`   reseller_client con slug NUEVO: ${newReseller}`);

  const okCopies = newCopies === countLeadLike;
  const okReseller = newReseller === 1;
  const okOldLeads = remainingOldLeads === countLeadLike;

  if (!okCopies || !okReseller) {
    console.error('\n❌ Verificación fallida: revisar conteos antes de --purge-old.');
    console.error(`   Esperado copias=${countLeadLike}, reseller nuevo=1`);
    await client.close();
    process.exit(1);
  }
  if (!okOldLeads) {
    console.warn(`\n⚠️  Quedaron ${remainingOldLeads} doc(s) con slug viejo; esperado ${countLeadLike}. Revisa manualmente.`);
  } else {
    console.log('\n✅ Verificación: cada lead original tiene su copia con slug nuevo; reseller_client migrado.');
  }

  // ─── 4) Purga opcional ────────────────────────────────────────────────────
  if (PURGE_OLD) {
    if (!okOldLeads || remainingOldLeads === 0) {
      console.log('\nℹ️  Nada que purgar (originales ya 0 o conteos inconsistentes).');
    } else {
      const del = await coll.deleteMany(leadLikeFilter);
      console.log(`\n🗑️  Purga: eliminados ${del.deletedCount} documento(s) con slug "${OLD_SLUG}" (no reseller_client).`);
    }
  } else {
    console.log('\n💡 Los originales con slug viejo siguen en la BD. Tras revisar en producción:');
    console.log('   node scripts/rename-client-slug.js --purge-old');
  }

  await client.close();
  console.log('');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
