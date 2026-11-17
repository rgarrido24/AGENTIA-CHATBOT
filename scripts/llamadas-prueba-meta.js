/**
 * Hace llamadas reales a la API con el token de la pagina de Agentia para que Meta marque las "pruebas de API"
 * del App Review (pages_read_user_content, pages_show_list, instagram_manage_messages, etc.).
 *   node scripts/llamadas-prueba-meta.js [clientId=agentia]
 * No imprime tokens.
 */
const { MongoClient } = require("mongodb");
const G = "https://graph.facebook.com/v20.0";
async function call(label, path, token) {
  try {
    const sep = path.includes("?") ? "&" : "?";
    const r = await fetch(`${G}/${path}${sep}access_token=${encodeURIComponent(token)}`);
    const j = await r.json().catch(() => ({}));
    const n = Array.isArray(j.data) ? j.data.length : "-";
    console.log(`${r.ok ? "OK   " : "FALLO"} ${label} -> ${r.ok ? "filas=" + n : (j.error && j.error.message || r.status)}`);
    return r.ok ? j : null;
  } catch (e) { console.log("FALLO", label, e.message); return null; }
}
(async () => {
  const clientId = process.argv[2] || "agentia";
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const doc = await c.db(process.env.MONGODB_DB || undefined).collection("business_configs").findOne({ clientId });
  await c.close();
  if (!doc || !doc.accessToken) throw new Error("Sin config/token para " + clientId);
  const t = doc.accessToken, page = doc.pageId || "104901035867357", ig = doc.igAccountId || "17841448371814783";
  await call("me/accounts (pages_show_list)", "me/accounts?limit=5", t);
  await call("page info (pages_read_engagement)", `${page}?fields=name,fan_count`, t);
  const feed = await call("page posts (pages_read_engagement)", `${page}/feed?limit=5`, t);
  const post = feed && feed.data && feed.data[0];
  if (post) await call("comentarios del post (pages_read_user_content)", `${post.id}/comments?limit=5`, t);
  else console.log("Sin posts para leer comentarios");
  await call("conversaciones Messenger (pages_messaging)", `${page}/conversations?limit=5`, t);
  await call("suscripciones webhook (pages_manage_metadata)", `${page}/subscribed_apps`, t);
  await call("IG perfil (instagram_basic)", `${ig}?fields=username,name`, t);
  const media = await call("IG media (instagram_basic)", `${ig}/media?limit=5`, t);
  const m = media && media.data && media.data[0];
  if (m) await call("IG comentarios (instagram_manage_comments)", `${m.id}/comments?limit=5`, t);
  await call("IG conversaciones (instagram_manage_messages)", `${page}/conversations?platform=instagram&limit=5`, t);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
