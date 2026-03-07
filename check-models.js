/**
 * Lista los modelos disponibles para la API key de Gemini.
 * Uso: node check-models.js
 */

const fs = require("fs");
const path = require("path");

function getEnvValue(envText, key) {
  const re = new RegExp(`^${key}=(.+)$`, "m");
  const m = envText.match(re);
  if (!m) return null;
  let value = m[1].trim();
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
  return value;
}

async function main() {
  const envPath = path.join(__dirname, ".env");
  const envText = fs.readFileSync(envPath, "utf8");
  const apiKey = getEnvValue(envText, "GEMINI_API_KEY") || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No se encontró GEMINI_API_KEY en .env");
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    console.error("Error API:", res.status, data);
    process.exit(1);
  }

  const models = data.models || [];
  const names = models.map((m) => m.name || "").filter(Boolean);

  console.log("=== Modelos disponibles para generateContent ===\n");
  names.forEach((name) => console.log(name));
  console.log("\n=== Total:", names.length, "modelos ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
