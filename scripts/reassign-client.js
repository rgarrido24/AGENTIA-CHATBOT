#!/usr/bin/env node
/**
 * reassign-client.js — reutiliza el panel de un cliente de reseller para otra persona.
 *
 * Hace: respaldo JSON -> borra historial (leads, WhatsApp, push, pruebas) -> cambia
 * nombre, slug (link) y contraseña -> limpia conexion a Facebook, formularios y alertas.
 *
 * Uso (por defecto es DRY-RUN, no cambia nada):
 *   node scripts/reassign-client.js <resellerId> <slugViejo> <slugNuevo> "<Nombre nuevo>" <password>
 *   node scripts/reassign-client.js luciano vanesa-rodriguez barbara-rodriguez "Bárbara Rodríguez" Clave2026 --apply
 *
 * Opciones: --apply (ejecuta), --drop-wa (tambien borra la cuenta de WhatsApp API conectada).
 * Variables: MONGODB_URI, MONGODB_DB (opcional, default agentia_chatbot_ventas)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const apply = process.argv.includes('--apply');
const dropWa = process.argv.includes('--drop-wa');
const [resellerId, oldSlug, newSlug, newName, password] = args;
if (!resellerId || !oldSlug || !newSlug || !newName || !password) {
  console.error('Uso: node scripts/reassign-client.js <resellerId> <slugViejo> <slugNuevo> "<Nombre nuevo>" <password> [--apply] [--drop-wa]');
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(newSlug)) { console.error('slugNuevo solo minusculas, numeros y guiones'); process.exit(1); }

const hashPassword = (raw) => crypto.createHash('sha256').update(raw + 'reseller_pass_salt_2026').digest('hex');
const envVal = (k) => {
  for (const f of ['.env.local', '.env']) {
    const p = path.join(__dirname, '..', f);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, 'utf8').match(new RegExp(`^${k}=(.+)$`, 'm'));
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
};

(async () => {
  const uri = process.env.MONGODB_URI || envVal('MONGODB_URI');
  if (!uri) throw new Error('No se encontro MONGODB_URI');
  const c = await MongoClient.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = c.db(process.env.MONGODB_DB || envVal('MONGODB_DB') || 'agentia_chatbot_ventas');
  const leads = db.collection('leads');
  const base = { resellerId, clientSlug: oldSlug };

  const clientDoc = await leads.findOne({ _collection_type: 'reseller_client', ...base });
  if (!clientDoc) throw new Error(`No existe el cliente ${resellerId}/${oldSlug}`);
  if (await leads.findOne({ _collection_type: 'reseller_client', resellerId, clientSlug: newSlug })) {
    throw new Error(`Ya existe un cliente con el slug ${newSlug}`);
  }

  const leadFilter = { clientSlug: oldSlug, _collection_type: { $ne: 'reseller_client' } };
  const campaigns = await db.collection('wa_campaigns').find(base, { projection: { _id: 1 } }).toArray();
  const campIds = campaigns.map((x) => x._id);
  const targets = [
    ['leads (historial)', leads, leadFilter],
    ['wa_messages', db.collection('wa_messages'), base],
    ['wa_conversations', db.collection('wa_conversations'), base],
    ['wa_campaigns', db.collection('wa_campaigns'), base],
    ['wa_campaign_recipients', db.collection('wa_campaign_recipients'), { campaignId: { $in: campIds } }],
    ['wa_form_responses', db.collection('wa_form_responses'), base],
    ['portal_push_subscriptions', db.collection('portal_push_subscriptions'), base],
    ['fb_test_runs', db.collection('fb_test_runs'), base],
  ];
  if (dropWa) targets.push(['wa_accounts (WhatsApp API)', db.collection('wa_accounts'), base]);

  console.log(`\nCliente: ${clientDoc.nombre} (${resellerId}/${oldSlug}) -> ${newName} (${newSlug})`);
  console.log(apply ? 'MODO: APLICAR\n' : 'MODO: DRY-RUN (no se cambia nada)\n');
  const counts = [];
  for (const [label, col, f] of targets) { const n = await col.countDocuments(f); counts.push(n); console.log(`  borrar ${String(n).padStart(6)}  ${label}`); }
  const waAcc = await db.collection('wa_accounts').countDocuments(base);
  if (waAcc && !dropWa) console.log(`  AVISO: tiene ${waAcc} cuenta(s) de WhatsApp API conectada(s); NO se borra (usa --drop-wa si era de la clienta anterior).`);

  if (!apply) { console.log('\nRevisa y repite con --apply para ejecutar.'); return c.close(); }

  // 1) Respaldo
  const dir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${oldSlug}-${Date.now()}.json`);
  const dump = { clientDoc, leads: await leads.find(leadFilter).toArray() };
  for (const [label, col, f] of targets.slice(1)) dump[label] = await col.find(f).toArray();
  fs.writeFileSync(file, JSON.stringify(dump));
  console.log(`\nRespaldo guardado: ${file}`);

  // 2) Borrar historial
  for (const [label, col, f] of targets) { const r = await col.deleteMany(f); console.log(`  borrados ${r.deletedCount}  ${label}`); }

  // 3) Renombrar cliente
  const r = await leads.updateOne(
    { _id: clientDoc._id },
    {
      $set: { clientSlug: newSlug, nombre: newName, clientPasswordHash: hashPassword(password), formularios: [], alertNumber: '', updatedAt: new Date() },
      $unset: { fb_connection: '', wa_settings: '', negocio: '' },
    },
  );
  console.log(`\nCliente actualizado (${r.modifiedCount}). Link: /portal/${resellerId}/cliente/${newSlug}`);
  console.log('Pendiente en el panel: conectar su Facebook, poner su numero de alerta y su negocio.');
  await c.close();
})().catch((e) => { console.error(e.message || e); process.exit(1); });
