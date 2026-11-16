/**
 * Solo lectura. Dado uno o varios pageId (sacados de "WEBHOOK RECIBIDO" -> entry[].id), dice a que
 * cliente pertenecen y si tienen conexion de Facebook activa.
 * Uso: node scripts/quien-es-pagina.js <pageId> [<pageId> ...]
 */
const { MongoClient } = require("mongodb");
(async () => {
  const ids = process.argv.slice(2);
  if (!ids.length) throw new Error("Falta al menos un pageId");
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const col = c.db(process.env.MONGODB_DB || undefined).collection("leads");
  for (const id of ids) {
    const docs = await col.find({ _collection_type: "reseller_client", "fb_connection.page_id": id })
      .project({ clientSlug: 1, nombre: 1, status: 1, resellerId: 1, "fb_connection.status": 1, "fb_connection.page_name": 1, "fb_connection.connected_at": 1 }).toArray();
    if (!docs.length) {
      // Quizas el numero es un form_id en lugar de un pageId
      const byForm = await col.find({ _collection_type: "reseller_client", "formularios.formId": id })
        .project({ clientSlug: 1, nombre: 1, status: 1, "fb_connection.status": 1, "fb_connection.page_name": 1, formularios: 1 }).toArray();
      if (byForm.length) { for (const d of byForm) console.log(id, "(es un form_id) ->", d.clientSlug, "|", d.nombre, "| cliente:", d.status, "| fb:", d.fb_connection?.status, "|", d.fb_connection?.page_name); continue; } console.log(id, "-> SIN CLIENTE con esa pagina conectada (cliente eliminado o nunca conectado). Usa el token por defecto y falla."); continue; }
    for (const d of docs) console.log(id, "->", d.clientSlug, "|", d.nombre, "| cliente:", d.status, "| fb:", d.fb_connection?.status, "|", d.fb_connection?.page_name);
  }
  await c.close();
})().catch((e) => { console.error(e.message || e); process.exit(1); });
