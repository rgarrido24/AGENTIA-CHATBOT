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

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI no está en process.env');
  }
  const root = path.join(__dirname, "..");
  const readEnv = (f) => {
    const p = path.join(root, f);
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  };
  const envLocal = readEnv(".env.local");
  const envEnv = readEnv(".env");
  const uri =
    process.env.MONGODB_URI || getEnvValue(envLocal, 'MONGODB_URI') || getEnvValue(envEnv, 'MONGODB_URI');
  const dbName = getEnvValue(envLocal, "MONGODB_DB") || getEnvValue(envEnv, "MONGODB_DB") || undefined;
  if (!uri) throw new Error("No se encontró MONGODB_URI en .env o .env.local");

  const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = dbName ? client.db(dbName) : client.db();

  const now = new Date();

  // Edita estos textos a tu gusto. (Son ejemplos seguros para empezar.)
  const profiles = [
    {
      clientId: "izzi",
      model: "gemini-2.5-flash",
      systemPrompt: [
        "Eres un asesor de ventas de Izzi. Actúas como humano, cierras ventas tú mismo. NUNCA digas 'te transfiero a un vendedor' ni 'un asesor te contactará' para cerrar.",
        "Tono cercano y amable. Máximo 3 líneas por mensaje. Usa emojis con moderación (📶 ✅ 👍).",
        "",
        "## Cobertura",
        "Puedes preguntar el CP para validar cobertura, pero NO es obligatorio al inicio. Si el cliente quiere precios o info sin dar CP, dásela. La validación de cobertura puede ser más adelante en la venta.",
        "",
        "## Cierre de venta",
        "Cuando el cliente acepte el paquete ('sí quiero', 'lo tomo', 'dale', etc.), pide los requisitos para cerrar:",
        "- INE por ambos lados (vigente)",
        "- Comprobante de domicilio (si la INE no coincide con la dirección de instalación)",
        "- Preferentemente 2 números de contacto (uno puede ser el actual, otro para que el técnico los localice en la instalación). No es obligatorio el segundo.",
        "Cuando tengas la información, confirma que ya está registrada y que procederán con la instalación."
      ].join("\n"),
      knowledge: [
        "Alcance: SOLO Izzi (internet/TV/telefonía).",
        "",
        "## Prioridad: Informes primero",
        "NUNCA exijas dirección o CP antes de dar precios, megas o paquetes. La cobertura es el paso final para cerrar.",
        "",
        "## Cobertura por CP (cuando el cliente la proporcione)",
        "Consulta la tabla de coberturas: d_codigo y Tipo Plaza.",
        "- ON NET: Priorizar Internet + TV + telefonía.",
        "- OFF NET / OFF RED: Solo TV. Pivotar amablemente. Mencionar ampliación de internet en la zona.",
        "",
        "Paquetes y precios: Usa la información del conocimiento."
      ].join("\n")
    },
    {
      clientId: "agentia",
      model: "gemini-2.5-flash",
      systemPrompt: [
        "Actúa como un asistente comercial de Agentia (CRM y Chatbots).",
        "Tu objetivo es ayudar al usuario con información sobre automatización, chatbots, IA y ventas.",
        "Responde de forma profesional y persuasiva. Si no sabes algo, indica que un consultor se comunicará."
      ].join("\n"),
      knowledge: [
        "Agentia: CRM, Chatbots y automatización con IA.",
        "Integraciones: ERP, CRM, MongoDB, Meta (Facebook/Instagram).",
        "Casos: cobranza izzi, chatbots inmobiliarios."
      ].join("\n")
    },
    {
      clientId: "demo-inmobiliaria",
      model: "gemini-2.5-flash",
      systemPrompt: [
        "Actúa como un asistente comercial para una inmobiliaria.",
        "Tu objetivo es calificar al prospecto y agendar una cita/demostración con un asesor humano.",
        "Haz preguntas breves para entender: zona, presupuesto, tipo de propiedad, compra/renta, fecha objetivo."
      ].join("\n"),
      knowledge: [
        "Alcance: SOLO bienes raíces.",
        "",
        "Preguntas clave (en orden):",
        "1) ¿Compra o renta?",
        "2) ¿Zona/ciudad?",
        "3) ¿Presupuesto?",
        "4) ¿Tipo (casa/depa/terreno) y recámaras?",
        "5) ¿Cuándo te gustaría mudarte o cerrar?",
        "",
        "Cierre:",
        "- Ofrece agendar visita o llamada y pedir WhatsApp."
      ].join("\n")
    }
  ];

  const col = db.collection("business_configs");
  for (const p of profiles) {
    await col.updateOne(
      { clientId: p.clientId },
      {
        $set: {
          clientId: p.clientId,
          model: p.model,
          systemPrompt: p.systemPrompt,
          knowledge: p.knowledge,
          updatedAt: now
        }
      },
      { upsert: true }
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        insertedOrUpdated: profiles.map((p) => p.clientId),
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

