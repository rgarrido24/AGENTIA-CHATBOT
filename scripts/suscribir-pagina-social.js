/**
 * Diagnostica y suscribe una página de Facebook (y su Instagram vinculado) para recibir
 * DMs y comentarios en el webhook. No imprime tokens.
 *
 * Uso (Render Shell):  node scripts/suscribir-pagina-social.js <pageId> [--apply]
 * Ejemplo Agentia:     node scripts/suscribir-pagina-social.js 104901035867357 --apply
 */
const { MongoClient } = require("mongodb");
const G = "https://graph.facebook.com/v20.0";

async function gj(url, opts) {
  const r = await fetch(url, opts);
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j };
}

(async () => {
  const pageId = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!pageId) throw new Error("Falta pageId");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || undefined);
  const cfg = await db.collection("business_configs").findOne({ pageId: String(pageId) });
  await client.close();
  if (!cfg) { console.log("NO hay documento en business_configs con pageId", pageId, "-> hay que cargarlo con load-page-tokens.js"); return; }
  console.log("business_configs OK: clientId =", cfg.clientId, "| tiene accessToken:", Boolean(cfg.accessToken));
  const t = encodeURIComponent(String(cfg.accessToken || "").trim());
  if (!t) return;

  const info = await gj(`${G}/${pageId}?fields=id,name,instagram_business_account&access_token=${t}`);
  console.log("Pagina:", info.ok ? JSON.stringify(info.j) : `ERROR ${info.status} ${JSON.stringify(info.j)}`);
  const igId = info.j?.instagram_business_account?.id;
  console.log("Instagram vinculado:", igId ? igId : "NINGUNO (vincula la cuenta de IG a la pagina)");

  const cur = await gj(`${G}/${pageId}/subscribed_apps?access_token=${t}`);
  console.log("Suscripcion actual de la pagina:", JSON.stringify(cur.j));

  if (!apply) { console.log("\n(dry-run) agrega --apply para suscribir messages,messaging_postbacks,feed"); return; }

  const fields = "messages,messaging_postbacks,feed,leadgen";
  const s = await gj(`${G}/${pageId}/subscribed_apps?subscribed_fields=${fields}&access_token=${t}`, { method: "POST" });
  console.log("POST subscribed_apps:", JSON.stringify(s.j));
  const chk = await gj(`${G}/${pageId}/subscribed_apps?access_token=${t}`);
  console.log("Despues:", JSON.stringify(chk.j));

  if (igId) {
    const ig = await gj(`${G}/${igId}/subscribed_apps?subscribed_fields=comments,messages&access_token=${t}`, { method: "POST" });
    console.log("POST subscribed_apps (IG):", JSON.stringify(ig.j));
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
