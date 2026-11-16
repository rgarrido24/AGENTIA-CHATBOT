/**
 * SOLO LECTURA. Diagnostico a fondo del token de pagina de UN cliente.
 *   node scripts/diag-token-cliente.js <texto>     (parte del slug, nombre o page_id)
 * No imprime el token.
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
const iso = (s) => (s ? (s === 0 ? "nunca" : new Date(s * 1000).toISOString()) : String(s));
async function gj(url) { const r = await fetch(url); return { ok: r.ok, j: await r.json().catch(() => ({})) }; }

(async () => {
  const term = process.argv[2];
  if (!term) throw new Error("Falta texto a buscar (slug, nombre o page_id)");
  const appId = process.env.FB_APP_ID, appTok = `${appId}|${process.env.FB_APP_SECRET}`;
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const col = c.db(process.env.MONGODB_DB || undefined).collection("leads");
  const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const cl = await col.find({ _collection_type: "reseller_client", $or: [{ clientSlug: rx }, { nombre: rx }, { "fb_connection.page_id": term }, { "fb_connection.page_name": rx }] })
    .project({ clientSlug: 1, nombre: 1, status: 1, fb_connection: 1 }).limit(3).toArray();
  await c.close();
  if (!cl.length) { console.log("Sin coincidencias"); return; }
  for (const x of cl) {
    const fb = x.fb_connection || {};
    console.log("\n== Cliente:", x.clientSlug, "|", x.nombre, "| conectado el", fb.connected_at, "| pagina:", fb.page_name, fb.page_id);
    const tok = decrypt(fb.page_access_token);
    const d = (await gj(`${G}/debug_token?input_token=${q(tok)}&access_token=${q(appTok)}`)).j?.data || {};
    console.log("tipo:", d.type, "| app_id:", d.app_id, "| user_id:", d.user_id, "| valido:", d.is_valid);
    console.log("emitido:", iso(d.issued_at), "| expira:", d.expires_at === 0 ? "nunca" : iso(d.expires_at), "| acceso a datos expira:", iso(d.data_access_expires_at));
    console.log("scopes:", (d.scopes || []).join(",") || "(vacio)");
    console.log("granular_scopes:", JSON.stringify((d.granular_scopes || []).map((g) => g.scope + "->" + (g.target_ids || []).length + " objetos")));
    if (d.user_id) {
      const roles = await gj(`${G}/${appId}/roles?access_token=${q(appTok)}`);
      const mine = (roles.j?.data || []).find((r) => String(r.user) === String(d.user_id));
      console.log("rol de ese usuario en la app:", mine ? mine.role : "NINGUNO", roles.ok ? "" : "(no se pudo leer roles: " + (roles.j?.error?.message || "").slice(0, 80) + ")");
    }
    const f = await gj(`${G}/${fb.page_id}/leadgen_forms?limit=1&access_token=${q(tok)}`);
    console.log("leadgen_forms:", f.ok ? "OK" : JSON.stringify(f.j?.error || f.j).slice(0, 220));
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
