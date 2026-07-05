import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const dbName = "agentia_chatbot_ventas";

export async function GET(
  req: NextRequest,
  { params }: { params: { jornadaId: string } }
) {
  try {
    await client.connect();
    const db = client.db(dbName);

    const jornada = await db.collection("jornadas").findOne({ jornadaId: params.jornadaId });
    const points = await db.collection("tracking_points")
      .find({ jornadaId: params.jornadaId })
      .sort({ timestamp: 1 })
      .toArray();

    return NextResponse.json({ jornada, points });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
