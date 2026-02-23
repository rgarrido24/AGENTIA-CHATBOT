/**
 * Carga profesional de Page Access Tokens por clientId.
 *
 * 1) Copia `scripts/page-tokens.example.json` a `scripts/page-tokens.json`
 * 2) Pega tus tokens y pageIds
 * 3) Ejecuta: `node ./scripts/load-page-tokens.js`
 *
 * Importante: `scripts/page-tokens.json` está ignorado por git.
 */

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

function getEnvValue(envText, key) {
  const re = new RegExp(`^${key}=(.+)$`, "m");
  const m = envText.match(re);
  if (!m) return null;
  let value = m[1].trim();
  if (value.startsWith("\"") && value.endsWith("\"")) value = value.slice(1, -1);
  return value;
}

function sanitizeToken(token) {
  // No loguear tokens. Solo recorta espacios/nuevas líneas.
  return String(token || "").trim();
}

async function main() {
  const envPath = "C:/Users/Rodolfo/Desktop/AGENTIA CHATBOT/.env";
  const envText = fs.readFileSync(envPath, "utf8");
  const uri = getEnvValue(envText, "MONGODB_URI");
  const dbName = getEnvValue(envText, "MONGODB_DB") || undefined;
  if (!uri) throw new Error("No se encontró MONGODB_URI en .env");

  const tokensPath = path.join(__dirname, "page-tokens.json");
  if (!fs.existsSync(tokensPath)) {
    throw new Error(
      "No existe scripts/page-tokens.json. Cópialo desde scripts/page-tokens.example.json y pega tus tokens."
    );
  }

  const raw = fs.readFileSync(tokensPath, "utf8");
  const parsed = JSON.parse(raw);
  const pages = Array.isArray(parsed?.pages) ? parsed.pages : [];
  if (pages.length === 0) throw new Error("El JSON no contiene `pages`.");

  const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = dbName ? client.db(dbName) : client.db();

  const col = db.collection("business_configs");
  const now = new Date();

  const updated = [];
  for (const p of pages) {
    const clientId = String(p.clientId || "").trim().toLowerCase();
    const pageId = String(p.pageId || "").trim();
    const accessToken = sanitizeToken(p.accessToken);

    if (!clientId) throw new Error("Falta clientId en un item.");
    if (!pageId) throw new Error(`Falta pageId para clientId='${clientId}'.`);
    if (!accessToken) throw new Error(`Falta accessToken para clientId='${clientId}'.`);

    await col.updateOne(
      { clientId },
      {
        $set: {
          clientId,
          pageId,
          accessToken,
          updatedAt: now
        }
      },
      { upsert: true }
    );
    updated.push({ clientId, pageId });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        updated,
        db: db.databaseName,
        collection: "business_configs"
      },
      null,
      2
    )
  );

  await client.close();
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});

