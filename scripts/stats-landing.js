/**
 * Números reales para la landing (solo lectura, no modifica nada).
 * Uso: node scripts/stats-landing.js
 */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function envVal(text, key) {
  const m = text.match(new RegExp(`^${key}=(.+)$`, 'm'));
  if (!m) return null;
  let v = m[1].trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v;
}

async function main() {
  const root = path.join(__dirname, '..');
  const read = (f) => { const p = path.join(root, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };
  const l = read('.env.local'), e = read('.env');
  const uri = process.env.MONGODB_URI || envVal(l, 'MONGODB_URI') || envVal(e, 'MONGODB_URI');
  const dbName = process.env.MONGODB_DB || envVal(l, 'MONGODB_DB') || envVal(e, 'MONGODB_DB') || undefined;
  if (!uri) throw new Error('No se encontró MONGODB_URI');
  const client = new MongoClient(uri, { maxPoolSize: 3, serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const col = (dbName ? client.db(dbName) : client.db()).collection('leads');

  const noDemo = { es_demo: { $ne: true } };
  const isLead = { ...noDemo, resellerId: { $exists: true }, clientSlug: { $exists: true }, _collection_type: { $nin: ['reseller', 'reseller_client'] } };
  const since = (d) => new Date(Date.now() - d * 864e5);

  const clientes = await col.countDocuments({ ...noDemo, _collection_type: 'reseller_client' });
  const revendedores = await col.countDocuments({ ...noDemo, _collection_type: 'reseller' });
  const leadsTotal = await col.countDocuments(isLead);
  const leads30 = await col.countDocuments({ ...isLead, createdAt: { $gte: since(30) } });
  const leads7 = await col.countDocuments({ ...isLead, createdAt: { $gte: since(7) } });
  const conLeads30 = (await col.distinct('clientSlug', { ...isLead, createdAt: { $gte: since(30) } })).length;
  const cerrados = await col.countDocuments({ ...isLead, status: 'cerrado' });

  console.log(JSON.stringify({
    paneles_de_clientes: clientes,
    revendedores,
    clientes_con_leads_ultimos_30_dias: conLeads30,
    leads_total: leadsTotal,
    leads_ultimos_30_dias: leads30,
    leads_ultimos_7_dias: leads7,
    leads_marcados_cerrado: cerrados,
  }, null, 2));
  await client.close();
}
main().catch((err) => { console.error(err?.message || err); process.exit(1); });
