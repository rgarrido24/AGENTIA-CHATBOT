/**
 * SOLO LECTURA. Lista, por cliente activo del reseller, cuántos dispositivos activaron las
 * notificaciones (campana) en su panel.   node scripts/campanas-clientes.js [resellerId=luciano]
 */
const { MongoClient } = require("mongodb");
(async () => {
  const resellerId = process.argv[2] || "luciano";
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const db = c.db(process.env.MONGODB_DB || undefined);
  const clients = await db.collection("leads").find({ _collection_type: "reseller_client", resellerId, status: "activo" }).project({ clientSlug: 1, nombre: 1 }).toArray();
  const subs = await db.collection("portal_push_subscriptions").aggregate([{ $match: { resellerId } }, { $group: { _id: "$clientSlug", n: { $sum: 1 } } }]).toArray();
  await c.close();
  const m = new Map(subs.map((s) => [String(s._id).toLowerCase(), s.n]));
  const sin = [], con = [];
  for (const cl of clients) { const n = m.get(String(cl.clientSlug).toLowerCase()) || 0; (n ? con : sin).push(`${cl.nombre} (${cl.clientSlug}) — ${n}`); }
  console.log(`SIN campana activada (${sin.length}):`); sin.forEach((x) => console.log("  -", x));
  console.log(`\nCON campana (${con.length}):`); con.forEach((x) => console.log("  -", x));
})().catch((e) => { console.error(e.message || e); process.exit(1); });
