import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";

const client = new MongoClient(process.env.MONGODB_URI!);
const dbName = "agentia_chatbot_ventas";

export async function GET() {
  try {
    await client.connect();
    const jornadas = await client
      .db(dbName)
      .collection("jornadas")
      .find(
        {},
        {
          projection: {
            _id: 0,
            jornadaId: 1,
            userId: 1,
            userName: 1,
            plaza: 1,
            startTime: 1,
            endTime: 1,
            status: 1,
          },
        }
      )
      .sort({ startTime: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json(jornadas);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
