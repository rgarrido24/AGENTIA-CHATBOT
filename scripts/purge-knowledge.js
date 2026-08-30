/**
 * PURGA TOTAL: elimina TODOS los documentos de knowledge_docs en MongoDB.
 * Uso: node scripts/purge-knowledge.js
 */

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

function getEnvValue(envText, key) {
  const re = new RegExp(`^${key}=(.+)$`, "m");
  const m = envText.match(re);
  if (!m) return null;
  let value = m[1].trim();
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
  return value;
}

async function main() {
  const envPath = path.join(__dirname, "..", ".env");
  const envText = fs.readFileSync(envPath, "utf8");
  const uri = getEnvValue(envText, "MONGODB_URI");
  const dbName = getEnvValue(envText, "MONGODB_DB") || undefined;
  if (!uri) throw new Error("No se encontró MONGODB_URI en .env");

  const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = dbName ? client.db(dbName) : client.db();

  const col = db.collection("knowledge_docs");
  const result = await col.deleteMany({});

  console.log(JSON.stringify({
    ok: true,
    deletedCount: result.deletedCount,
    collection: "knowledge_docs",
    db: db.databaseName,
  }, null, 2));

  await client.close();
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
