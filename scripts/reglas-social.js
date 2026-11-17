/**
 * Reglas por palabra clave (estilo ManyChat) para comentarios/DMs de Facebook e Instagram.
 *   node scripts/reglas-social.js <clientId> listar
 *   node scripts/reglas-social.js <clientId> agregar <id> "<palabras,separadas,por,coma>" "<respuesta publica 1 || respuesta publica 2>" "<mensaje DM>" [comment|dm|both]
 *   node scripts/reglas-social.js <clientId> borrar <id>
 * Ej.: node scripts/reglas-social.js agentia agregar info "info,informacion,precio" "¡Hola! Te la mandé por privado 📩 || ¡Listo! Revisa tu inbox 😉" "Hola, gracias por tu interés..." comment
 * Los cambios aplican en ~1 minuto (caché).
 */
const { MongoClient } = require("mongodb");
(async () => {
  const [clientId, cmd, id, kws, pub, dm, canal] = process.argv.slice(2);
  if (!clientId || !cmd) throw new Error("Uso: node scripts/reglas-social.js <clientId> listar|agregar|borrar ...");
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const col = c.db(process.env.MONGODB_DB || undefined).collection("business_configs");
  const doc = await col.findOne({ clientId });
  if (!doc) { console.log("No existe business_configs con clientId", clientId); await c.close(); return; }
  let rules = Array.isArray(doc.socialRules) ? doc.socialRules : [];
  if (cmd === "listar") {
    if (!rules.length) console.log("Sin reglas.");
    rules.forEach((r) => console.log(`- ${r.id} [${r.channel || "both"}] palabras: ${r.keywords.join(", ")}\n    publico: ${(r.publicReplies || []).join(" || ") || "(generica)"}\n    dm: ${r.dmMessage || "(responde la IA)"}`));
  } else if (cmd === "agregar") {
    if (!id || !kws) throw new Error("Faltan id y palabras");
    const rule = {
      id, active: true, channel: ["comment", "dm", "both"].includes(canal) ? canal : "both",
      keywords: kws.split(",").map((s) => s.trim()).filter(Boolean),
      publicReplies: (pub || "").split("||").map((s) => s.trim()).filter(Boolean),
      dmMessage: (dm || "").trim() || undefined,
    };
    rules = rules.filter((r) => r.id !== id).concat(rule);
    await col.updateOne({ _id: doc._id }, { $set: { socialRules: rules, updatedAt: new Date() } });
    console.log("Regla guardada:", id, "| total reglas:", rules.length);
  } else if (cmd === "borrar") {
    rules = rules.filter((r) => r.id !== id);
    await col.updateOne({ _id: doc._id }, { $set: { socialRules: rules, updatedAt: new Date() } });
    console.log("Regla borrada:", id, "| quedan:", rules.length);
  }
  await c.close();
})().catch((e) => { console.error(e.message || e); process.exit(1); });
