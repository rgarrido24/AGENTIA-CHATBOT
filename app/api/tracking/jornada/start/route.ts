import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const dbName = "agentia_chatbot_ventas";

export async function POST(req: NextRequest) {
  try {
    const { userId, userName, plaza } = await req.json();
    if (!userId) return NextResponse.json({ error: "Falta userId" }, { status: 400 });

    const jornadaId = `jornada_${Date.now()}_${userId}`;

    await client.connect();
    await client.db(dbName).collection("jornadas").insertOne({
      jornadaId,
      userId,
      userName,
      plaza,
      startTime: new Date(),
      endTime: null,
      status: "activa",
    });

    return NextResponse.json({ success: true, jornadaId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
