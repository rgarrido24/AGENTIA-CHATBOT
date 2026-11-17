/**
 * Conecta una pagina EXTRA a un cliente (caso Franco: 2 paginas, 2 formularios) sin pasar por el
 * login de Facebook. Busca, entre las paginas a las que da acceso un token (System User), la que
 * contiene el formulario indicado.
 *
 *   TMP_USER_TOKEN='EAAB...' node scripts/conectar-pagina-extra.js <clientSlug> <formId>           (solo busca)
 *   TMP_USER_TOKEN='EAAB...' node scripts/conectar-pagina-extra.js <clientSlug> <formId> --apply   (guarda)
 * El token va SOLO en tu shell, nunca en el chat. No imprime tokens.
 */
const crypto = require("crypto");
const { MongoClient } = require("mongodb");
const G = "https://graph.facebook.com/v20.0";
const q = encodeURIComponent;
async function gj(url, opts) { const r = await fetch(url, opts); return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) }; }
function encrypt(plain) {
  const raw = process.env.FB_TOKEN_ENCRYPTION_KEY?.trim() || process.env.FB_APP_SECRET?.trim() || "";
  const key = crypto.createHash("sha256").update(raw).digest();
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `${iv.toString("hex")}:${c.getAuthTag().toString("hex")}:${enc.toString("hex")}`;
}
async function allPages(tok) {
  const out = [];
  let url = `${G}/me/accounts?fields=id,name,access_token&limit=100&access_token=${q(tok)}`;
  for (let i = 0; url && i < 20; i++) {
    const r = await gj(url);
    if (!r.ok) { console.log("Error en /me/accounts:", r.j?.error?.message); break; }
    out.push(...(r.j.data || []));
    url = r.j.paging?.next;
  }
  return out;
}

(async () => {
  const [slug, formId] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const apply = process.argv.includes("--apply");
  const tok = (process.env.TMP_USER_TOKEN || "").trim();
  if (!slug || !formId || !tok) throw new Error("Uso: TMP_USER_TOKEN=... node scripts/conectar-pagina-extra.js <clientSlug> <formId> [--apply]");

  const pages = await allPages(tok);
  console.log("Paginas accesibles con este token:", pages.length);
  let found = null, formName = "";
  for (const p of pages) {
    if (!p.access_token) continue;
    const f = await gj(`${G}/${p.id}/leadgen_forms?fields=id,name,status&limit=100&access_token=${q(p.access_token)}`);
    const hit = (f.j?.data || []).find((x) => String(x.id) === String(formId));
    if (hit) { found = p; formName = hit.name; console.log(`>>> ENCONTRADA: ${p.name} (${p.id}) | formulario: ${hit.name} [${hit.status}]`); break; }
  }
  if (!found) { console.log("Ninguna pagina de este token contiene el formulario", formId, "-> la pagina no esta compartida con este token."); return; }
  if (!apply) { console.log("\n(ensayo) agrega --apply para guardarla como pagina extra de", slug); return; }

  const sub = await gj(`${G}/${found.id}/subscribed_apps?subscribed_fields=leadgen&access_token=${q(found.access_token)}`, { method: "POST" });
  console.log("Suscripcion leadgen:", sub.ok ? "OK" : "ERROR " + (sub.j?.error?.message || ""));

  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const col = c.db(process.env.MONGODB_DB || undefined).collection("leads");
  const cl = await col.findOne({ _collection_type: "reseller_client", clientSlug: slug });
  if (!cl) { console.log("No existe el cliente", slug); await c.close(); return; }
  const primary = cl.fb_connection?.page_id;
  const forms = (cl.formularios || []).map((f) => (f.page_id || !primary ? f : { ...f, page_id: primary }));
  const i = forms.findIndex((f) => String(f.formId) === String(formId));
  const row = { formId: String(formId), formName: formName || String(formId), plataforma: "fb/ig", activo: true, page_id: found.id };
  if (i >= 0) forms[i] = { ...forms[i], ...row }; else forms.push(row);
  const extras = (cl.fb_extra_pages || []).filter((p) => p.page_id !== found.id);
  extras.push({ status: "connected", page_id: found.id, page_name: found.name, page_access_token: encrypt(found.access_token), connected_at: new Date() });
  await col.updateOne({ _id: cl._id }, { $set: { fb_extra_pages: extras, formularios: forms, multi_formulario: true, updatedAt: new Date() } });
  await c.close();
  console.log("GUARDADO: pagina extra", found.name, "y formulario", formName, "activos en", slug, "| formularios activos:", forms.filter((f) => f.activo).length);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
