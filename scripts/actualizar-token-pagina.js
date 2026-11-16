/**
 * Renueva el Page Access Token de una página (cuando Meta lo invalidó), lo guarda en
 * business_configs, y suscribe la página (y su Instagram) a mensajes/comentarios.
 *
 * El token de usuario se pasa por variable de entorno SOLO en tu shell (no en el chat):
 *   TMP_USER_TOKEN='EAAB...' node scripts/actualizar-token-pagina.js 104901035867357          (revisa)
 *   TMP_USER_TOKEN='EAAB...' node scripts/actualizar-token-pagina.js 104901035867357 --apply  (guarda)
 * Requiere FB_APP_ID y FB_APP_SECRET (ya están en Render).
 */
const { MongoClient } = require("mongodb");
const G = "https://graph.facebook.com/v20.0";
const q = encodeURIComponent;
async function gj(url, opts) { const r = await fetch(url, opts); return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) }; }

(async () => {
  const pageId = process.argv[2];
  const apply = process.argv.includes("--apply");
  const userTok = (process.env.TMP_USER_TOKEN || "").trim();
  const appId = process.env.FB_APP_ID, secret = process.env.FB_APP_SECRET;
  if (!pageId || !userTok) throw new Error("Falta pageId o TMP_USER_TOKEN");
  if (!appId || !secret) throw new Error("Faltan FB_APP_ID / FB_APP_SECRET");

  // 1) token de usuario de larga duración -> los page tokens derivados no expiran
  const ex = await gj(`${G}/oauth/access_token?grant_type=fb_exchange_token&client_id=${q(appId)}&client_secret=${q(secret)}&fb_exchange_token=${q(userTok)}`);
  // Los tokens de System User ya no expiran y no se pueden "extender": se usan tal cual.
  let longUser = ex.ok ? ex.j.access_token : userTok;
  if (!ex.ok) console.log("(No se pudo extender el token; se usa tal cual. Normal si es de System User.)", ex.j?.error?.message || "");

  // 2) token de la página
  const acc = await gj(`${G}/me/accounts?fields=id,name,access_token,instagram_business_account&limit=100&access_token=${q(longUser)}`);
  if (!acc.ok) { console.log("Error leyendo /me/accounts:", JSON.stringify(acc.j)); return; }
  const pages = acc.j.data || [];
  const page = pages.find((p) => p.id === String(pageId));
  if (!page) { console.log("La pagina", pageId, "no esta entre las del usuario. Paginas disponibles:", pages.map((p) => `${p.id}:${p.name}`).join(" | ") || "(ninguna)"); return; }
  const igId = page.instagram_business_account?.id || null;
  console.log("Pagina:", page.name, "| Instagram vinculado:", igId || "NINGUNO");

  const dbg = await gj(`${G}/debug_token?input_token=${q(page.access_token)}&access_token=${q(appId + "|" + secret)}`);
  const d = dbg.j?.data || {};
  console.log("Token de pagina: valido =", d.is_valid, "| expira =", d.expires_at === 0 ? "nunca" : d.expires_at, "| permisos =", (d.scopes || []).join(","));

  if (!apply) { console.log("\n(dry-run) agrega --apply para guardar el token y suscribir"); return; }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const col = client.db(process.env.MONGODB_DB || undefined).collection("business_configs");
  const set = { accessToken: page.access_token, tokenUpdatedAt: new Date() };
  if (igId) set.igAccountId = igId;
  const r = await col.updateOne({ pageId: String(pageId) }, { $set: set });
  await client.close();
  console.log("business_configs actualizado:", r.matchedCount ? "OK" : "NO ENCONTRADO (no hay doc con ese pageId)");

  const t = q(page.access_token);
  const s = await gj(`${G}/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed,leadgen&access_token=${t}`, { method: "POST" });
  console.log("Suscripcion pagina:", JSON.stringify(s.j));
  if (igId) {
    const ig = await gj(`${G}/${igId}/subscribed_apps?subscribed_fields=comments,messages&access_token=${t}`, { method: "POST" });
    console.log("Suscripcion Instagram:", JSON.stringify(ig.j));
  }
  console.log("Listo. Reinicia el servicio en Render para limpiar la cache (o espera 1 min).");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
