import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

/**
 * AJUSTE NECESARIO ANTES DE DEPLOY:
 * Si ya tienes un helper compartido de conexión a MongoDB (p.ej. lib/mongodb.ts
 * usado en el resto de agentia.software), impórtalo aquí en vez de este cliente
 * standalone, para no duplicar conexiones al mismo cluster.
 */
const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB || "agentia_chatbot_ventas";

let cachedClient: MongoClient | null = null;
async function getClient() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

/**
 * AJUSTE NECESARIO: conecta esto a tu sistema de push existente
 * (el mismo que usas para los portales de asesoras de Luciano, con VAPID keys).
 * Aquí solo se deja el punto de entrada.
 */
async function notifyAgentiaPanel(lead: Record<string, unknown>) {
  try {
    // ejemplo: await sendPushNotification({ title: 'Nuevo lead', body: `${lead.producto} — ${lead.negocio}` });
    console.log("[diagnostico-leads] TODO: disparar push al panel", lead.producto);
  } catch (err) {
    console.error("No se pudo notificar al panel:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, negocio, whatsapp, email, producto, roi, origen, url } = body;

    if (!nombre || !negocio || !whatsapp || !producto) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const client = await getClient();
    const db = client.db(dbName);

    const doc = {
      nombre,
      negocio,
      whatsapp,
      email: email || null,
      producto, // 'chatbot' | 'crm' | 'ecommerce' | 'paginas-web' | 'rastreo'
      roi: roi || null,
      origen: origen || "landing",
      url: url || null,
      status: "nuevo",
      createdAt: new Date(),
    };

    await db.collection("diagnostico_leads").insertOne(doc);
    await notifyAgentiaPanel(doc);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error guardando diagnostico_lead:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 }
    );
  }
}
