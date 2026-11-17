/** SOLO LECTURA. Ultimos 10 eventos sociales (comentarios/DM) procesados por el webhook. */
const { MongoClient } = require("mongodb");
(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const col = c.db(process.env.MONGODB_DB || undefined).collection("webhook_events_social");
  const rows = await col.find({}).sort({ createdAt: -1 }).limit(10).toArray();
  await c.close();
  if (!rows.length) return console.log("Sin eventos: el webhook no ha recibido ningun comentario/DM.");
  rows.forEach((r) => console.log(new Date(r.createdAt).toISOString(), r._id));
})().catch((e) => { console.error(e.message || e); process.exit(1); });
