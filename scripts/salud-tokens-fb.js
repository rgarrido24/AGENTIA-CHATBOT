/**
 * SOLO LECTURA. Revisa el token de pagina de cada cliente conectado y dice cuales fallan.
 *   node scripts/salud-tokens-fb.js                     -> salud de todos los clientes activos
 *   node scripts/salud-tokens-fb.js --lead 1664986015327299   -> ademas prueba ese lead con cada token
 * No imprime tokens.
 */
const crypto = require("crypto");
const { MongoClient } = require("mongodb");
const G = "https://graph.facebook.com/v20.0";
const q = encodeURIComponent;

function decrypt(packed) {
  const raw = process.env.FB_TOKEN_ENCRYPTION_KEY?.trim() || process.env.FB_APP_SECRET?.trim() || "";
  const key = crypto.createHash("sha256").update(raw).digest();
  const [iv, tag, data] = String(packed).split(":");
  const d = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
  d.setAuthTag(Buffer.from(tag, "hex"));
  return Buffer.concat([d.update(Buffer.from(data, "hex")), d.final()]).toString("utf8");
}
async function gj(url) { const r = await fetch(url); return { ok: r.ok, j: await r.json().catch(() => ({})) }; }

(async () => {
  const leadIdx = process.argv.indexOf("--lead");
  const leadId = leadIdx > -1 ? process.argv[leadIdx + 1] : null;
  const appTok = `${process.env.FB_APP_ID}|${process.env.FB_APP_SECRET}`;
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const col = c.db(process.env.MONGODB_DB || undefined).collection("leads");
  const clients = await col.find({ _collection_type: "reseller_client", status: "activo", "fb_connection.page_id": { $exists: true } })
    .project({ clientSlug: 1, nombre: 1, "fb_connection.status": 1, "fb_connection.page_id": 1, "fb_connection.page_name": 1, "fb_connection.page_access_token": 1 }).toArray();
  await c.close();

  let ok = 0, bad = 0;
  for (const cl of clients) {
    const fb = cl.fb_connection || {};
    const tag = `${cl.clientSlug} (${fb.page_name || fb.page_id})`;
    if (fb.status !== "connected" || !fb.page_access_token) { console.log("SIN CONEXION  ", tag, "fb.status =", fb.status); bad++; continue; }
    let tok;
    try { tok = decrypt(fb.page_access_token); } catch (e) { console.log("NO DESCIFRA   ", tag, e.message); bad++; continue; }
    const dbg = await gj(`${G}/debug_token?input_token=${q(tok)}&access_token=${q(appTok)}`);
    const d = dbg.j?.data || {};
    const hasLeads = (d.scopes || []).includes("leads_retrieval");
    const forms = await gj(`${G}/${fb.page_id}/leadgen_forms?limit=1&access_token=${q(tok)}`);
    const row = `${tag} | valido=${d.is_valid} | leads_retrieval=${hasLeads} | forms=${forms.ok ? "OK" : "ERROR " + (forms.j?.error?.message || "").slice(0, 90)}`;
    if (d.is_valid && hasLeads && forms.ok) ok++; else { bad++; console.log("PROBLEMA      ", row, d.error?.message ? "| " + d.error.message.slice(0, 90) : ""); }
    if (leadId) {
      const l = await gj(`${G}/${leadId}?fields=id,form_id,created_time&access_token=${q(tok)}`);
      if (l.ok) console.log("  >>> el lead", leadId, "SI se puede leer con el token de", tag, JSON.stringify(l.j));
    }
  }
  console.log(`\nResumen: ${ok} bien, ${bad} con problema, de ${clients.length} clientes activos con pagina.`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
