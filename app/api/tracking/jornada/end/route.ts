import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const dbName = "agentia_chatbot_ventas";

export async function POST(req: NextRequest) {
  try {
    const { jornadaId } = await req.json();
    if (!jornadaId) return NextResponse.json({ error: "Falta jornadaId" }, { status: 400 });

    await client.connect();
    await client.db(dbName).collection("jornadas").updateOne(
      { jornadaId },
      { $set: { endTime: new Date(), status: "finalizada" } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
