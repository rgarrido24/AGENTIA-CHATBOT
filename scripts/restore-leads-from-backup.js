#!/usr/bin/env node
/**
 * restore-leads-from-backup.js
 *
 * Restaura leads borrados desde la colección `leads_backup` (append-only)
 * a la colección `leads`. Útil cuando se borraron leads accidentalmente
 * del panel o cuando se necesita reasignarlos a otro cliente.
 *
 * La colección `leads_backup` se llena automáticamente en cada alta de
 * lead nuevo (ver `app/api/webhook/facebook-leads/route.ts`).
 *
 * Flags:
 *   --reseller <id>     ID del reseller dueño (ej: "luciano")
 *   --client <slug>     Slug del cliente destino al que reasignar los leads
 *                       (sobreescribe el clientSlug original del backup;
 *                       util cuando los leads se guardaron mal originalmente)
 *   --form-id <id>      Solo restaurar leads de este form_id específico
 *                       (RECOMENDADO para no traer leads de otros formularios)
 *   --from <YYYY-MM-DD> Solo backups con backedUpAt >= esa fecha
 *   --apply             Aplica realmente (default es dry-run)
 *   --overwrite         Si el lead ya existe en `leads`, reasignar igual
 *                       (default: skip los que ya existen)
 *
 * Ejemplos:
 *
 *   # Ver qué leads de Gabriela hay en backup (form 1424965795847302):
 *   node scripts/restore-leads-from-backup.js \
 *     --reseller luciano --client gabriela_alcaraz \
 *     --form-id 1424965795847302
 *
 *   # Restaurar de verdad:
 *   node scripts/restore-leads-from-backup.js \
 *     --reseller luciano --client gabriela_alcaraz \
 *     --form-id 1424965795847302 --apply
 *
 *   # Solo desde una fecha:
 *   node scripts/restore-leads-from-backup.js \
 *     --reseller luciano --client gabriela_alcaraz \
 *     --form-id 1424965795847302 --from 2026-05-01 --apply
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// ─── Loader simple de .env / .env.local (sin dependencia de `dotenv`) ────
function stripBom(text) {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
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
function getFlag(name) {
  const i = ARGS.indexOf(name);
  return i >= 0 ? ARGS[i + 1] : null;
}

const RESELLER = getFlag('--reseller');
const CLIENT_SLUG = getFlag('--client');
const FORM_ID = getFlag('--form-id');
const FROM_DATE = getFlag('--from');
const APPLY = ARGS.includes('--apply');
const OVERWRITE = ARGS.includes('--overwrite');

if (!RESELLER || !CLIENT_SLUG) {
  console.error('❌ Falta --reseller y/o --client (ambos obligatorios).');
  console.error('Ejemplo: --reseller luciano --client gabriela_alcaraz --form-id 1424965795847302');
  process.exit(1);
}

async function main() {
  const uri = ENV.MONGODB_URI;
  const dbName = ENV.MONGODB_DB || 'agentia_chatbot_ventas';
  if (!uri) {
    console.error('❌ Falta MONGODB_URI en .env / variables de entorno');
    process.exit(1);
  }

  console.log(`\n📡 Conectando a Mongo (${dbName})…`);
  console.log(`   Modo:          ${APPLY ? '✏️  APLICAR' : '👀 DRY RUN'}`);
  console.log(`   Reseller:      ${RESELLER}`);
  console.log(`   Cliente dest:  ${CLIENT_SLUG}`);
  console.log(`   form_id:       ${FORM_ID || '(cualquiera)'}`);
  console.log(`   desde:         ${FROM_DATE || '(sin límite)'}`);
  console.log(`   overwrite:     ${OVERWRITE ? 'sí' : 'no (skip duplicados)'}`);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // ── 1. Validar que el cliente destino existe y que el form_id le pertenece ──
  const target = await db.collection('leads').findOne({
    _collection_type: 'reseller_client',
    resellerId: RESELLER,
    clientSlug: CLIENT_SLUG,
  });
  if (!target) {
    console.error(`❌ No existe cliente ${RESELLER}/${CLIENT_SLUG} en la BD.`);
    process.exit(1);
  }
  const allowedForms = new Set(
    (target.formularios || [])
      .filter((f) => f.formId)
      .map((f) => String(f.formId)),
  );
  console.log(`   Forms activos del cliente destino: ${[...allowedForms].join(', ') || '(ninguno)'}`);

  if (FORM_ID && !allowedForms.has(FORM_ID)) {
    console.error(`\n⚠️  El form_id "${FORM_ID}" NO está cargado en el cliente ${CLIENT_SLUG}.`);
    console.error('    Para evitar que los restaurados queden invisibles en el panel,');
    console.error('    primero agregalo en el dashboard del reseller. Abortando.');
    process.exit(1);
  }

  // ── 2. Construir filtro sobre leads_backup ──────────────────────────────
  const filter = {
    source_collection: 'leads',
    // El backup conserva el clientSlug ORIGINAL — buscamos por form_id que pertenezca
    // al cliente destino. Si no se pasa form_id, restringimos a los forms activos.
  };
  if (FORM_ID) {
    filter.form_id = FORM_ID;
  } else if (allowedForms.size > 0) {
    filter.form_id = { $in: [...allowedForms] };
  } else {
    console.error('❌ El cliente destino no tiene form_ids configurados y no pasaste --form-id.');
    process.exit(1);
  }
  if (FROM_DATE) {
    const d = new Date(FROM_DATE);
    if (Number.isNaN(d.getTime())) {
      console.error(`❌ --from inválida: "${FROM_DATE}". Usar YYYY-MM-DD.`);
      process.exit(1);
    }
    filter.backedUpAt = { $gte: d };
  }

  // ── 3. Buscar backups, de-duplicar por leadId quedándonos con el más reciente ──
  const backups = await db
    .collection('leads_backup')
    .find(filter)
    .sort({ backedUpAt: -1 })
    .toArray();

  console.log(`\n📦 Backups encontrados: ${backups.length}`);

  // De-dup: un mismo leadId puede tener varios snapshots (cada alta crea uno)
  // Nos quedamos con el más reciente (ya están ordenados desc).
  const uniqByLeadId = new Map();
  for (const b of backups) {
    const lid = String(b.leadId || '');
    if (!lid) continue;
    if (!uniqByLeadId.has(lid)) uniqByLeadId.set(lid, b);
  }
  const uniqBackups = [...uniqByLeadId.values()];
  console.log(`   Únicos por leadId: ${uniqBackups.length}`);

  if (uniqBackups.length === 0) {
    console.log('\n✅ Nada que restaurar.');
    await client.close();
    return;
  }

  // ── 4. Comparar con `leads` actual ──────────────────────────────────────
  const existingLeads = await db
    .collection('leads')
    .find({ leadId: { $in: uniqBackups.map((b) => b.leadId) } })
    .project({ leadId: 1, resellerId: 1, clientSlug: 1, _id: 0 })
    .toArray();
  const existingMap = new Map(existingLeads.map((l) => [String(l.leadId), l]));

  let toInsert = 0;       // leadId no existe → insertar
  let toReassign = 0;     // existe pero mal asignado → corregir (solo con --overwrite)
  let toSkip = 0;         // ya está bien asignado
  let toSkipMisassigned = 0; // mal asignado pero sin --overwrite
  const samples = [];

  for (const b of uniqBackups) {
    const lid = String(b.leadId);
    const existing = existingMap.get(lid);

    if (!existing) {
      toInsert++;
      if (samples.length < 10) {
        samples.push({
          action: 'INSERT',
          leadId: lid,
          nombre: b.nombre || b.senderName || '(sin nombre)',
          telefono: b.telefono || '',
          form_id: b.form_id || '',
          backedUpAt: b.backedUpAt ? new Date(b.backedUpAt).toISOString() : '',
        });
      }
      continue;
    }

    const correct = existing.resellerId === RESELLER && existing.clientSlug === CLIENT_SLUG;
    if (correct) {
      toSkip++;
      continue;
    }

    if (OVERWRITE) {
      toReassign++;
      if (samples.length < 10) {
        samples.push({
          action: 'REASSIGN',
          leadId: lid,
          nombre: b.nombre || b.senderName || '(sin nombre)',
          from: `${existing.resellerId}/${existing.clientSlug}`,
          to: `${RESELLER}/${CLIENT_SLUG}`,
        });
      }
    } else {
      toSkipMisassigned++;
    }
  }

  console.log('\n📊 Plan:');
  console.log(`   Insertar (no existía):              ${toInsert}`);
  console.log(`   Reasignar (existe pero mal):        ${toReassign}${OVERWRITE ? '' : '  ← usar --overwrite'}`);
  console.log(`   Skip (ya bien asignado):            ${toSkip}`);
  console.log(`   Skip (mal asignado, sin overwrite): ${toSkipMisassigned}`);

  if (samples.length > 0) {
    console.log('\n🔍 Muestras:');
    samples.forEach((s, i) => {
      if (s.action === 'INSERT') {
        console.log(`   ${i + 1}. INSERT  ${s.leadId}`);
        console.log(`        nombre:  ${s.nombre}`);
        console.log(`        tel:     ${s.telefono}`);
        console.log(`        form_id: ${s.form_id}`);
        console.log(`        backup:  ${s.backedUpAt}`);
      } else {
        console.log(`   ${i + 1}. REASSIGN ${s.leadId}  (${s.nombre})`);
        console.log(`        de: ${s.from}  →  a: ${s.to}`);
      }
    });
  }

  if (!APPLY) {
    console.log('\n💡 Para aplicar realmente, agregá --apply al comando.');
    await client.close();
    return;
  }

  // ── 5. Aplicar ──────────────────────────────────────────────────────────
  console.log(`\n✏️  Aplicando…`);
  let inserted = 0;
  let reassigned = 0;
  const now = new Date();

  for (const b of uniqBackups) {
    const lid = String(b.leadId);
    const existing = existingMap.get(lid);

    if (!existing) {
      const { _id, backedUpAt, source_collection, ...rest } = b;
      const doc = {
        ...rest,
        // Forzar la asignación al cliente destino, sobreescribiendo lo que
        // tuviera el backup (que podría tener clientSlug equivocado por el bug).
        resellerId: RESELLER,
        clientSlug: CLIENT_SLUG,
        restored_at: now,
        restored_from_backup: true,
        restored_backup_id: _id,
        restored_backup_at: backedUpAt,
      };
      // Por si el backup tenía un clientSlug distinto, lo dejamos auditable
      if (b.clientSlug && b.clientSlug !== CLIENT_SLUG) {
        doc.restored_original_clientSlug = b.clientSlug;
      }
      try {
        await db.collection('leads').insertOne(doc);
        inserted++;
      } catch (err) {
        console.warn(`   ⚠️  insert falló para ${lid}:`, err.message);
      }
      continue;
    }

    if (!OVERWRITE) continue;
    const correct = existing.resellerId === RESELLER && existing.clientSlug === CLIENT_SLUG;
    if (correct) continue;

    await db.collection('leads').updateOne(
      { leadId: lid },
      {
        $set: {
          resellerId: RESELLER,
          clientSlug: CLIENT_SLUG,
          reassigned_at: now,
          reassigned_from: { resellerId: existing.resellerId, clientSlug: existing.clientSlug },
        },
      },
    );
    reassigned++;
  }

  console.log(`\n✅ Resultado: ${inserted} insertados, ${reassigned} reasignados.`);
  await client.close();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
