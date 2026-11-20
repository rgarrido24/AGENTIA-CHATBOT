/**
 * SOLO LECTURA. Lista, por pagina de Facebook, a que panel(es) esta conectada y con que formularios,
 * y marca cruces: paginas o formularios compartidos entre varios clientes.
 *   node scripts/auditoria-paginas.js [resellerId=luciano]
 * Genera tambien auditoria-paginas.csv en la carpeta actual (para mandar a Luciano). No imprime tokens.
 */
const fs = require("fs");
const { MongoClient } = require("mongodb");
(async () => {
  const resellerId = process.argv[2] || "luciano";
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const col = c.db(process.env.MONGODB_DB || "agentia_chatbot_ventas").collection("leads");
  const clients = await col.find({ _collection_type: "reseller_client", resellerId, status: "activo" }).toArray();
  await c.close();

  const byPage = new Map(); // pageId -> {name, rows:[{cliente, tipo, forms}]}
  const byForm = new Map(); // formId -> [{cliente, activo, nombre}]
  const add = (pid, pname, cliente, tipo, forms) => {
    if (!pid) return;
    const k = String(pid);
    if (!byPage.has(k)) byPage.set(k, { name: pname || "", rows: [] });
    const e = byPage.get(k);
    if (!e.name && pname) e.name = pname;
    e.rows.push({ cliente, tipo, forms });
  };
  for (const cl of clients) {
    const fb = cl.fb_connection || {};
    const forms = cl.formularios || [];
    const mainId = fb.page_id && fb.status === "connected" ? String(fb.page_id) : null;
    const extras = (cl.fb_extra_pages || []).map((p) => String(p.page_id));
    const label = (f) => `${f.formName || "(sin nombre)"} [${f.formId}]${f.activo ? " *activo" : ""}`;
    // formularios de pagina extra: los que traen page_id de una extra; el resto cuelga de la principal
    const delMain = forms.filter((f) => !f.page_id || String(f.page_id) === mainId || !extras.includes(String(f.page_id)));
    if (mainId) add(mainId, fb.page_name, `${cl.nombre} (${cl.clientSlug})`, "principal", delMain.map(label));
    for (const p of cl.fb_extra_pages || []) {
      const fs2 = forms.filter((f) => String(f.page_id) === String(p.page_id));
      add(p.page_id, p.page_name, `${cl.nombre} (${cl.clientSlug})`, "extra", fs2.map(label));
    }
    for (const f of forms) {
      if (!byForm.has(f.formId)) byForm.set(f.formId, []);
      byForm.get(f.formId).push({ cliente: `${cl.nombre} (${cl.clientSlug})`, activo: !!f.activo, nombre: f.formName });
    }
  }

  const csv = ["pagina_id,pagina_nombre,cliente,tipo,formularios"];
  console.log(`== PAGINAS Y SUS PANELES (${resellerId}, clientes activos: ${clients.length}) ==\n`);
  [...byPage.entries()].sort((a, b) => (a[1].name || "").localeCompare(b[1].name || "")).forEach(([pid, e]) => {
    const compartida = new Set(e.rows.map((r) => r.cliente)).size > 1;
    console.log(`${compartida ? "⚠️ " : ""}${e.name || "(sin nombre)"} [${pid}]`);
    e.rows.forEach((r) => {
      console.log(`    -> ${r.cliente} (${r.tipo})${r.forms.length ? ": " + r.forms.join("; ") : ""}`);
      csv.push([pid, e.name, r.cliente, r.tipo, r.forms.join(" | ")].map((x) => `"${String(x || "").replace(/"/g, '""')}"`).join(","));
    });
  });

  const pagsComp = [...byPage.entries()].filter(([, e]) => new Set(e.rows.map((r) => r.cliente)).size > 1);
  const formsComp = [...byForm.entries()].filter(([, v]) => new Set(v.map((x) => x.cliente)).size > 1);
  console.log(`\n== CRUCES ==`);
  console.log(`Paginas conectadas a mas de un cliente: ${pagsComp.length}`);
  pagsComp.forEach(([pid, e]) => console.log(`  ⚠️ ${e.name} [${pid}]: ${[...new Set(e.rows.map((r) => r.cliente))].join(" / ")}`));
  console.log(`Formularios repetidos en mas de un cliente: ${formsComp.length}`);
  formsComp.forEach(([fid, v]) => console.log(`  ⚠️ ${fid} ${v[0].nombre || ""}: ${v.map((x) => x.cliente + (x.activo ? "*" : "")).join(" / ")}`));
  fs.writeFileSync("auditoria-paginas.csv", csv.join("\n"));
  console.log("\nArchivo: auditoria-paginas.csv");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
