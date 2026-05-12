#!/usr/bin/env node
/**
 * audit-luciano-leads.js
 *
 * Audita y repara la asignación de leads entre clientes de un reseller.
 *
 * Detecta:
 *   1. Configs duplicadas: mismo `formId` cargado en >1 cliente
 *      (esto es lo que rompe el aislamiento de privacidad).
 *   2. Leads mal asignados: leads en la colección `leads` cuyo `form_id`
 *      no aparece en los `formularios` del cliente al que están asignados.
 *      Si el `form_id` existe en OTRO cliente, propone reasignarlos.
 *
 * Modos:
 *   `node scripts/audit-luciano-leads.js`                  → dry-run (default)
 *   `node scripts/audit-luciano-leads.js --apply`          → aplica reasignaciones
 *   `node scripts/audit-luciano-leads.js --reseller luciano` → limita a un reseller
 *
 * IMPORTANTE: Antes de aplicar, revisar el dry-run y confirmar que las
 * reasignaciones propuestas son correctas. Cada cambio queda registrado
 * con `reassigned_at` + `reassigned_from` para auditoría.
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

function stripBom(t) { return t.charCodeAt(0) === 0xfeff ? t.slice(1) : t; }
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
const APPLY = ARGS.includes('--apply');
const RESELLER_FILTER = (() => {
  const i = ARGS.indexOf('--reseller');
  return i >= 0 ? ARGS[i + 1] : null;
})();

async function main() {
  const uri = ENV.MONGODB_URI;
  const dbName = ENV.MONGODB_DB || ENV.MONGO_DB || 'agentia_chatbot_ventas';
  if (!uri) {
    console.error('❌ Falta MONGODB_URI en .env');
    process.exit(1);
  }

  console.log(`\n📡 Conectando a Mongo (${dbName})…`);
  console.log(`   Modo: ${APPLY ? '✏️  APLICAR cambios' : '👀 DRY RUN (sin tocar BD)'}`);
  if (RESELLER_FILTER) console.log(`   Reseller filtro: ${RESELLER_FILTER}`);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // ─── 1) Cargar todos los clientes y construir el mapa formId → cliente ──
  const clientFilter = { _collection_type: 'reseller_client' };
  if (RESELLER_FILTER) clientFilter.resellerId = RESELLER_FILTER;

  const clients = await db
    .collection('leads')
    .find(clientFilter)
    .project({
      resellerId: 1, clientSlug: 1, nombre: 1, formularios: 1, _id: 0,
    })
    .toArray();

  console.log(`\n👥 Clientes encontrados: ${clients.length}`);

  // formId → [ { resellerId, clientSlug, nombre, activo } ]
  const formIdMap = new Map();
  for (const c of clients) {
    const forms = Array.isArray(c.formularios) ? c.formularios : [];
    for (const f of forms) {
      if (!f.formId) continue;
      const fid = String(f.formId);
      if (!formIdMap.has(fid)) formIdMap.set(fid, []);
      formIdMap.get(fid).push({
        resellerId: String(c.resellerId),
        clientSlug: String(c.clientSlug),
        nombre:     String(c.nombre || c.clientSlug),
        activo:     f.activo !== false,
      });
    }
  }

  // ─── 2) Detectar duplicados de formId entre clientes ────────────────────
  const dupes = [];
  for (const [fid, owners] of formIdMap.entries()) {
    const activeOwners = owners.filter((o) => o.activo);
    if (activeOwners.length > 1) {
      dupes.push({ formId: fid, owners: activeOwners });
    }
  }

  console.log(`\n🔍 Configs duplicadas (form_id en >1 cliente activo): ${dupes.length}`);
  if (dupes.length > 0) {
    console.log('   ⚠️  ESTO ROMPE LA PRIVACIDAD — corregir manualmente en el dashboard:');
    dupes.forEach((d, i) => {
      console.log(`   ${i + 1}. formId "${d.formId}" está en:`);
      d.owners.forEach((o) => {
        console.log(`        • ${o.resellerId}/${o.clientSlug} (${o.nombre})`);
      });
    });
  }

  // ─── 3) Auditar leads mal asignados ────────────────────────────────────
  console.log('\n🔎 Auditando leads asignados…');

  const leadFilter = { _collection_type: { $ne: 'reseller_client' }, source: 'facebook' };
  if (RESELLER_FILTER) leadFilter.resellerId = RESELLER_FILTER;

  // Construir mapa { resellerId/clientSlug → Set<formIds permitidos> }
  const allowedByClient = new Map();
  for (const c of clients) {
    const key = `${c.resellerId}/${c.clientSlug}`;
    const set = new Set(
      (c.formularios || [])
        .filter((f) => f.formId && f.activo !== false)
        .map((f) => String(f.formId)),
    );
    allowedByClient.set(key, set);
  }

  const cursor = db.collection('leads').find(leadFilter).project({
    _id: 1, leadId: 1, nombre: 1, telefono: 1, form_id: 1, form_name: 1,
    resellerId: 1, clientSlug: 1, createdAt: 1,
  });

  let totalLeads = 0;
  let okLeads = 0;
  let orphanLeads = 0;   // form_id no existe en NINGÚN cliente
  let misassigned = 0;   // form_id pertenece a OTRO cliente
  const fixSamples = [];
  const orphanSamples = [];
  const fixesToApply = []; // { _id, fromReseller, fromSlug, toReseller, toSlug }

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    totalLeads++;

    const fid = doc.form_id ? String(doc.form_id) : '';
    const curReseller = String(doc.resellerId || '');
    const curSlug = String(doc.clientSlug || '');
    const curKey = `${curReseller}/${curSlug}`;

    if (!fid) {
      // Lead sin form_id: lo dejamos pasar (puede ser histórico no-FB)
      continue;
    }

    // ¿El form_id está dentro de los formularios permitidos del cliente actual?
    const allowedHere = allowedByClient.get(curKey);
    if (allowedHere && allowedHere.has(fid)) {
      okLeads++;
      continue;
    }

    // No corresponde acá. Buscar el dueño real.
    const realOwners = formIdMap.get(fid) || [];
    const activeOwners = realOwners.filter((o) => o.activo);

    if (activeOwners.length === 0) {
      orphanLeads++;
      if (orphanSamples.length < 8) {
        orphanSamples.push({
          leadId: doc.leadId || String(doc._id),
          nombre: doc.nombre || '(sin nombre)',
          form_id: fid,
          form_name: doc.form_name || '',
          currentClient: curKey,
        });
      }
      continue;
    }

    // Si hay un único dueño activo, podemos reasignar
    if (activeOwners.length === 1) {
      const real = activeOwners[0];
      if (real.resellerId === curReseller && real.clientSlug === curSlug) {
        // Falso positivo (no debería pasar por la lógica anterior)
        okLeads++;
        continue;
      }
      misassigned++;
      if (fixSamples.length < 12) {
        fixSamples.push({
          leadId: doc.leadId || String(doc._id),
          nombre: doc.nombre || '(sin nombre)',
          form_id: fid,
          from: curKey,
          to: `${real.resellerId}/${real.clientSlug}`,
        });
      }
      fixesToApply.push({
        _id: doc._id,
        fromReseller: curReseller,
        fromSlug: curSlug,
        toReseller: real.resellerId,
        toSlug: real.clientSlug,
      });
    } else {
      // Múltiples dueños activos: no reasignar automáticamente; reportar.
      misassigned++;
      if (fixSamples.length < 12) {
        fixSamples.push({
          leadId: doc.leadId || String(doc._id),
          nombre: doc.nombre || '(sin nombre)',
          form_id: fid,
          from: curKey,
          to: 'CONFLICTO (' + activeOwners.map((o) => `${o.resellerId}/${o.clientSlug}`).join(' / ') + ')',
        });
      }
    }
  }

  console.log('\n📊 Resumen leads:');
  console.log(`   Total escaneados:         ${totalLeads}`);
  console.log(`   ✅ Correctamente asignados: ${okLeads}`);
  console.log(`   ⚠️  Mal asignados:          ${misassigned}`);
  console.log(`   🛸 Huérfanos (form_id no configurado en ningún cliente): ${orphanLeads}`);

  if (fixSamples.length > 0) {
    console.log('\n🔧 Muestras de reasignaciones propuestas:');
    fixSamples.forEach((s, i) => {
      console.log(`   ${i + 1}. lead "${s.leadId}" (${s.nombre})`);
      console.log(`        form_id: ${s.form_id}`);
      console.log(`        de:      ${s.from}`);
      console.log(`        a:       ${s.to}`);
    });
  }

  if (orphanSamples.length > 0) {
    console.log('\n🛸 Muestras de leads huérfanos (no se tocan):');
    orphanSamples.forEach((s, i) => {
      console.log(`   ${i + 1}. lead "${s.leadId}" (${s.nombre}) en ${s.currentClient}`);
      console.log(`        form_id: ${s.form_id} (${s.form_name})`);
    });
  }

  if (APPLY && fixesToApply.length > 0) {
    console.log(`\n✏️  Aplicando ${fixesToApply.length} reasignaciones…`);
    let applied = 0;
    for (const fix of fixesToApply) {
      const res = await db.collection('leads').updateOne(
        { _id: fix._id },
        {
          $set: {
            resellerId: fix.toReseller,
            clientSlug: fix.toSlug,
            reassigned_at: new Date(),
            reassigned_from: { resellerId: fix.fromReseller, clientSlug: fix.fromSlug },
          },
        },
      );
      if (res.modifiedCount > 0) applied++;
    }
    console.log(`✅ Reasignados: ${applied}/${fixesToApply.length}`);
  } else if (!APPLY && fixesToApply.length > 0) {
    console.log('\n💡 Para aplicar las reasignaciones:');
    console.log('   node scripts/audit-luciano-leads.js --apply' +
      (RESELLER_FILTER ? ` --reseller ${RESELLER_FILTER}` : ''));
  }

  await client.close();
  console.log('');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
