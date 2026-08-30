import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const dbName = "agentia_chatbot_ventas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userName, jornadaId, lat, lng, timestamp, batteryLevel } = body;

    if (!userId || !jornadaId || lat == null || lng == null) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    await client.connect();
    const db = client.db(dbName);

    await db.collection("tracking_points").insertOne({
      userId,
      userName,
      jornadaId,
      lat,
      lng,
      timestamp: new Date(timestamp),
      streetName: null,
      batteryLevel: batteryLevel ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error guardando punto:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
