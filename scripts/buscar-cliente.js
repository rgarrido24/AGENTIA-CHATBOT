/** SOLO LECTURA. Busca clientes del reseller por nombre/slug.   node scripts/buscar-cliente.js veronica */
const { MongoClient } = require("mongodb");
(async () => {
  const txt = process.argv[2];
  if (!txt) throw new Error("Falta texto a buscar");
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const col = c.db(process.env.MONGODB_DB || undefined).collection("leads");
  const re = new RegExp(txt.normalize("NFD").replace(/[̀-ͯ]/g, ""), "i");
  const rows = await col.find({ _collection_type: "reseller_client", $or: [{ nombre: re }, { clientSlug: re }] }).toArray();
  for (const r of rows) {
    const leads = await col.countDocuments({ resellerId: r.resellerId, clientSlug: r.clientSlug, _collection_type: { $ne: "reseller_client" } });
    console.log(`\n• ${r.nombre} | slug: ${r.clientSlug} | reseller: ${r.resellerId} | estado: ${r.status}`);
    console.log(`  creado: ${r.createdAt ? new Date(r.createdAt).toISOString() : "n/d"} | leads guardados: ${leads}`);
    console.log(`  facebook: ${r.fb_connection?.status || "sin conexion"} | pagina: ${r.fb_connection?.page_name || "-"} (${r.fb_connection?.page_id || "-"})`);
    console.log(`  formularios: ${(r.formularios || []).map((f) => `${f.formName}[${f.formId}]${f.activo ? "*" : ""}`).join(", ") || "ninguno"}`);
  }
  if (!rows.length) console.log("Sin resultados");
  await c.close();
})().catch((e) => { console.error(e.message || e); process.exit(1); });
